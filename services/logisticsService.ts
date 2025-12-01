import { CarrierName, Shipment, ShipmentStatus, ReportStats, DetailedShipmentInfo, ShipmentEvent, ShipmentRisk, ShipmentRiskLevel } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import { v4 as uuidv4 } from 'uuid';

// Fix: Added missing storage persistence functions required by App.tsx
const STORAGE_KEY = 'litper_logistics_data';
const TIMESTAMP_KEY = 'litper_logistics_ts';

export const CHATEA_PRO_URL = "https://chateapro.app/flow/f140677#/livechat";

export const saveShipments = (shipments: Shipment[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Failed to save shipments:", error);
  }
};

export const loadShipments = (): Shipment[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);

    if (saved && timestamp) {
        const now = Date.now();
        const savedTime = parseInt(timestamp, 10);
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            console.log("Data expired (>24h). Clearing storage.");
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);
            return [];
        }
        
        const data = JSON.parse(saved);
        // CRITICAL FIX: Re-analyze risk for loaded data to ensure the Alert Dashboard works with existing data
        return data.map((s: Shipment) => ({
            ...s,
            riskAnalysis: analyzeShipmentRisk(s)
        }));
    }
    return [];
  } catch (error) {
    console.error("Failed to load shipments:", error);
    return [];
  }
};

// --- SESSION MANAGEMENT (NEW) ---
export const exportSessionData = (shipments: Shipment[]) => {
    const sessionData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        shipments: shipments
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LITPER_SESION_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const importSessionData = async (file: File): Promise<Shipment[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (json.shipments && Array.isArray(json.shipments)) {
                    // Recalculate risk just in case
                    const freshData = json.shipments.map((s: Shipment) => ({
                        ...s,
                        riskAnalysis: analyzeShipmentRisk(s)
                    }));
                    resolve(freshData);
                } else {
                    reject("Formato de archivo inválido");
                }
            } catch (err) {
                reject("Error leyendo el archivo");
            }
        };
        reader.readAsText(file);
    });
};


// Helper to map internal carrier names to 17TRACK carrier codes
const get17TrackCarrierCode = (carrier: CarrierName): string | undefined => {
    switch (carrier) {
      case CarrierName.INTER_RAPIDISIMO: return '100014'; // Inter Rapidisimo ID in 17Track
      case CarrierName.ENVIA: return 'envia-colombia';
      case CarrierName.COORDINADORA: return 'coordinadora-mercantil';
      case CarrierName.TCC: return 'tcc';
      // Add others if needed
      default: return undefined;
    }
};

export const detectCarrier = (guide: string): CarrierName => {
  const cleanGuide = guide.trim().toLowerCase();

  // Inter Rapidísimo: Inicia con '7' y tiene ~10 dígitos.
  if (cleanGuide.startsWith('7') && cleanGuide.length >= 9 && cleanGuide.length <= 11) {
    return CarrierName.INTER_RAPIDISIMO;
  }
  
  // Envía: Longitud de 12 dígitos.
  if (/^\d{12}$/.test(cleanGuide)) {
    return CarrierName.ENVIA;
  }

  // Coordinadora: Longitud de 11 dígitos.
  if (/^\d{11}$/.test(cleanGuide)) {
    return CarrierName.COORDINADORA;
  }

  // TCC: Longitud mayor a 18 dígitos o inicia con "tcc".
  if (cleanGuide.length > 18 || cleanGuide.startsWith('tcc')) {
    return CarrierName.TCC;
  }

  // Veloces: Inicia con "vel".
  if (cleanGuide.startsWith('vel')) {
    return CarrierName.VELOCES;
  }

  return CarrierName.UNKNOWN;
};

export const getTrackingUrl = (carrier: CarrierName, id: string): string => {
  // Enforced 17TRACK redirection for all carriers to avoid official site blocks/CAPTCHAs.
  const baseUrl = 'https://t.17track.net/es';
  const carrierCode = get17TrackCarrierCode(carrier);
  
  if (carrierCode) {
      return `${baseUrl}#nums=${encodeURIComponent(id)}&fc=${carrierCode}`;
  }
  
  return `${baseUrl}#nums=${encodeURIComponent(id)}`;
};

export const generateBulkTrackingUrl = (shipments: Shipment[]): string => {
    if (shipments.length === 0) return 'https://t.17track.net/es';

    const limitedShipments = shipments.slice(0, 40);
    const nums = limitedShipments.map(s => s.id).join(',');
    
    const firstCarrier = limitedShipments[0].carrier;
    const allSame = limitedShipments.every(s => s.carrier === firstCarrier);
    const carrierCode = (allSame && firstCarrier !== CarrierName.UNKNOWN) 
        ? get17TrackCarrierCode(firstCarrier) 
        : undefined;
    
    let url = `https://t.17track.net/es#nums=${encodeURIComponent(nums)}`;
    if (carrierCode) {
        url += `&fc=${carrierCode}`;
    }
    
    return url;
};

// --- HELPER LOGIC ---

const calculateEstimatedDelivery = (status: ShipmentStatus, lastEventDateStr: string): string => {
    if (status === ShipmentStatus.DELIVERED) return "Entregado";
    if (status === ShipmentStatus.IN_OFFICE) return "Disponible para retiro inmediato";
    
    const lastDate = new Date(lastEventDateStr);
    if (isNaN(lastDate.getTime())) return "Por confirmar";

    // Add 2 days for estimation if in transit
    const estimated = new Date(lastDate);
    estimated.setDate(estimated.getDate() + 2);
    
    return estimated.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
};

// --- RISK ANALYSIS ENGINE (Predictive Alerts) ---
export const analyzeShipmentRisk = (shipment: Shipment): ShipmentRisk => {
    const { status, detailedInfo, carrier } = shipment;
    const days = detailedInfo?.daysInTransit || 0;
    const dest = (detailedInfo?.destination || "").toUpperCase();
    const rawStatus = (detailedInfo?.rawStatus || "").toUpperCase();
    
    // Get time since last update
    let hoursSinceUpdate = 0;
    if (detailedInfo?.events?.[0]?.date) {
        const lastDate = new Date(detailedInfo.events[0].date);
        const now = new Date();
        hoursSinceUpdate = Math.abs(now.getTime() - lastDate.getTime()) / 36e5;
    }

    // --- 1. URGENT RULES (Red) ---
    
    // Status Keyword: "No contesta"
    if (rawStatus.includes("NO CONTESTA") || rawStatus.includes("NO RESPONDE")) {
        return {
            level: ShipmentRiskLevel.URGENT,
            reason: "Cliente no contesta (Riesgo devolución inminente)",
            action: "Llamada directa + Mensaje urgente"
        };
    }

    // Status Keyword: "Dirección Errada/Insuficiente"
    if (rawStatus.includes("DIRECCION") || rawStatus.includes("NOMENCLATURA") || rawStatus.includes("NO EXISTE")) {
        return {
            level: ShipmentRiskLevel.URGENT,
            reason: "Problema Dirección",
            action: "Confirmar dirección exacta con cliente"
        };
    }
    
    // Geo Rules: Bogota > 4 days
    if (dest.includes("BOGOTA") && days > 4 && status !== ShipmentStatus.DELIVERED) {
         return {
            level: ShipmentRiskLevel.URGENT,
            reason: "Retraso crítico Bogotá (>4 días)",
            action: "Contactar Transportadora (Promedio 2-3 días)",
            timeLabel: `${days} días`
        };
    }

    // Geo Rules: Cali/Cartagena > 6 days
    if ((dest.includes("CALI") || dest.includes("CARTAGENA")) && days > 6 && status !== ShipmentStatus.DELIVERED) {
         return {
            level: ShipmentRiskLevel.URGENT,
            reason: "Retraso crítico Costa/Valle (>6 días)",
            action: "Contactar Transportadora (Promedio 3-5 días)",
            timeLabel: `${days} días`
        };
    }

    // General Time: > 3 days no update
    if (hoursSinceUpdate > 72 && status === ShipmentStatus.IN_TRANSIT) {
        return {
            level: ShipmentRiskLevel.URGENT,
            reason: "Sin movimiento > 72h",
            action: "Verificar estado real con transportadora",
            timeLabel: `${Math.floor(hoursSinceUpdate/24)} días quietos`
        };
    }

    // --- 2. ATTENTION RULES (Amber/Yellow) ---

    // Keyword: "Desconfianza" (Mock logic as parsing relies on rawStatus text)
    if (rawStatus.includes("RECHAZ") || rawStatus.includes("NO RECIBE") || rawStatus.includes("DEVUELTO")) {
         return {
            level: ShipmentRiskLevel.ATTENTION,
            reason: "Intento Fallido / Rechazo",
            action: "Enviar pruebas/garantías al cliente"
        };
    }

    // General Time: > 48h no update
    if (hoursSinceUpdate > 48 && status === ShipmentStatus.IN_TRANSIT) {
        return {
            level: ShipmentRiskLevel.ATTENTION,
            reason: "Sin actualización > 48h",
            action: "Solicitar actualización",
            timeLabel: "48h sin cambios"
        };
    }

    // Office: In Office > 24h
    if (status === ShipmentStatus.IN_OFFICE) {
         return {
            level: ShipmentRiskLevel.ATTENTION,
            reason: "Disponible en Oficina",
            action: "Notificar al cliente para retiro inmediato",
            timeLabel: "En Oficina"
        };
    }
    
    // --- 3. WATCH RULES (Orange/Yellow) ---

    if (dest.includes("USME") || dest.includes("BOSA") || dest.includes("SOACHA")) {
        return {
            level: ShipmentRiskLevel.WATCH,
            reason: "Zona Periférica (Riesgo Acceso)",
            action: "Confirmar referencias de dirección"
        };
    }

    // --- 4. NORMAL ---
    if (status === ShipmentStatus.DELIVERED) {
        return { level: ShipmentRiskLevel.NORMAL, reason: "Entregado OK", action: "Cerrar caso" };
    }

    return {
        level: ShipmentRiskLevel.NORMAL,
        reason: "Tránsito Normal",
        action: "Monitorear"
    };
};


// --- RECOMMENDATION LOGIC (Dropi / Colombia) ---
export const getShipmentRecommendation = (shipment: Shipment): string => {
    const { status, detailedInfo } = shipment;
    const daysInTransit = detailedInfo?.daysInTransit || 0;
    
    // Calculate days in office if applicable
    let daysInOffice = 0;
    if (status === ShipmentStatus.IN_OFFICE && detailedInfo?.events.length > 0) {
        const lastDate = new Date(detailedInfo.events[0].date);
        const now = new Date();
        const diff = Math.abs(now.getTime() - lastDate.getTime());
        daysInOffice = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    if (status === ShipmentStatus.IN_OFFICE) {
        if (daysInOffice > 4) return "⚠ URGENTE: Solicitar Devolución/Extensión en Dropi";
        return "Notificar retiro inmediato al cliente";
    }

    if (status === ShipmentStatus.ISSUE) {
        return "Gestionar Novedad en Chatea Pro";
    }

    if (status === ShipmentStatus.IN_TRANSIT) {
        if (daysInTransit > 5) return "Validar demora con Transportadora";
        return "Monitorear entrega (En ruta)";
    }

    if (status === ShipmentStatus.DELIVERED) {
        return "Finalizar venta en Dropi";
    }

    return "Verificar estado";
};


// --- TEMPLATE SYSTEM (PROFESSIONAL & CLEAN) ---

export const getLogisticsTemplates = (shipment: Shipment): { clientTemplate: string, ticketTemplate: string, ticketType: string } => {
    const { id, carrier, status, detailedInfo, phone } = shipment;
    // Extract a clean city name from the location string usually formatted like "BOGOTA CUND COL"
    const rawLocation = detailedInfo?.events[0]?.location || 'Oficina Principal';
    const destination = detailedInfo?.destination.replace('COL', '').trim() || 'tu ciudad';
    const city = rawLocation.split(' ')[0] || destination; // Just the first word usually works for "BOGOTA", "MEDELLIN"

    let clientTemplate = "";
    let ticketTemplate = "";
    let ticketType = "GENERAL";

    switch (status) {
        case ShipmentStatus.IN_OFFICE:
            // Template: Clean, urgency without internal headers
            clientTemplate = `¡Hola! 👋 Tu pedido ya está disponible para retirar.\n\n` +
                             `📍 *Lugar:* Oficina de ${carrier} en ${city}.\n` +
                             `📦 *Guía:* ${id}\n` +
                             `⚠️ *Importante:* Tienes 5 días hábiles para reclamarlo antes de que sea devuelto.\n\n` +
                             `*Recuerda llevar tu cédula original.* ¡Gracias por tu compra!`;
            
            ticketTemplate = `SOLICITUD RETENCIÓN EN OFICINA\n` +
                             `-----------------------------------------------------\n` +
                             `El cliente confirma que lo recibe. Por favor mantener el pedido en oficina 5 DÍAS MÁS.\n` +
                             `El cliente pasará a recogerlo.\n` +
                             `Guía: ${id}`;
            ticketType = "RETENCIÓN 5 DÍAS";
            break;

        case ShipmentStatus.IN_TRANSIT:
            // Template: Excited, delivery expectation
            clientTemplate = `¡Buenas noticias! Tu pedido va en camino 🚚💨\n\n` +
                             `La transportadora ${carrier} nos informa que tu paquete (Guía: *${id}*) está próximo a ser entregado en ${destination}.\n\n` +
                             `🏠 Por favor, mantente atento a la dirección registrada para recibirlo.\n` +
                             `¡Que lo disfrutes! ✨`;
            
            ticketTemplate = `COORDINACIÓN DE ENTREGA\n` +
                             `-----------------------------------------------------\n` +
                             `Cliente contactado. Solicita entrega en *1 a 2 días hábiles*.\n` +
                             `Llamar antes de entregar al: ${phone || 'Destinatario'}\n` +
                             `Guía: ${id}`;
            ticketType = "PROGRAMAR ENTREGA";
            break;

        case ShipmentStatus.DELIVERED:
            clientTemplate = `¡Pedido Entregado! ✅\n\n` +
                             `Hola, el sistema nos confirma que tu pedido con guía *${id}* ha sido entregado exitosamente.\n\n` +
                             `Esperamos que todo esté perfecto. ¡Gracias por confiar en nosotros! ⭐`;
            
            ticketTemplate = `CONFIRMACIÓN DE ENTREGA\n` +
                             `Guía: ${id}\n` +
                             `Cliente confirma recibido conforme. Cerrar caso.`;
            ticketType = "CIERRE EXITOSO";
            break;

        case ShipmentStatus.ISSUE:
            clientTemplate = `Hola 👋, tenemos una actualización sobre tu envío.\n\n` +
                             `La transportadora ${carrier} reporta una novedad con tu guía *${id}*.\n` +
                             `🛠️ Estamos validando para solucionarlo lo antes posible.\n\n` +
                             `Si necesitas ayuda inmediata, por favor confírmanos tu dirección o disponibilidad. ❤️`;
            
            ticketTemplate = `SOLUCIÓN DE NOVEDAD\n` +
                             `-----------------------------------------------------\n` +
                             `Guía: ${id}\n` +
                             `Cliente contactado. Se confirman datos de entrega.\n` +
                             `Por favor intentar reparto nuevamente.\n` +
                             `Tel: ${phone || ''}`;
            ticketType = "SOLUCIÓN NOVEDAD";
            break;

        default:
            clientTemplate = `Hola, te informamos sobre tu pedido con guía *${id}*.\nEstado actual: ${status}.\nCualquier duda estamos para servirte.`;
            ticketTemplate = `CONSULTA GENERAL\nGuía: ${id}\nSolicitud: Por favor brindar estatus detallado.`;
            break;
    }

    return { clientTemplate, ticketTemplate, ticketType };
};

export const getWhatsAppTemplate = (shipment: Shipment): string => {
    const { clientTemplate } = getLogisticsTemplates(shipment);
    return clientTemplate;
};

// --- PDF CLAIM GENERATOR ---
export const generateClaimPDF = (shipment: Shipment) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DERECHO DE PETICIÓN - RECLAMO LOGÍSTICO", 105, 20, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Bogotá D.C., ${date}`, 20, 40);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Señores:\nDEPARTAMENTO DE SERVICIO AL CLIENTE\n${shipment.carrier.toUpperCase()}`, 20, 50);
    
    doc.text(`REF: RECLAMACIÓN POR SERVICIO DE TRANSPORTE - GUÍA No. ${shipment.id}`, 20, 70);
    
    doc.setFont("helvetica", "normal");
    const body = `Por medio de la presente, actuando en calidad de remitente/generador de carga, presento reclamo formal respecto al envío identificado con la guía de la referencia.\n\n` +
    `ESTADO ACTUAL SEGÚN SISTEMA: ${shipment.status.toUpperCase()}\n` +
    `VALOR DECLARADO: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(shipment.detailedInfo?.declaredValue || 0)}\n\n` +
    `HECHOS:\nEl envío presenta una novedad operativa que afecta el cumplimiento de la promesa de servicio pactada. ` +
    `Solicitamos la validación inmediata del estado real de la unidad de carga, la gestión prioritaria para su entrega efectiva al destinatario final o, en su defecto, el inicio del proceso de indemnización por el valor declarado si se confirma pérdida o avería.\n\n` +
    `FUNDAMENTOS DE DERECHO:\nInvocamos el derecho fundamental de petición (Art. 23 Constitución Política de Colombia) y las normas vigentes sobre el contrato de transporte terrestre de carga.\n\n` +
    `Quedamos atentos a su pronta respuesta dentro de los términos de ley.`;
    
    // Split text to fit page width
    const splitBody = doc.splitTextToSize(body, 170);
    doc.text(splitBody, 20, 85);
    
    doc.text("Atentamente,", 20, 180);
    doc.setFont("helvetica", "bold");
    doc.text("LITPER LOGÍSTICA", 20, 190);
    doc.setFont("helvetica", "normal");
    doc.text("Departamento de Operaciones", 20, 195);
    doc.text("logistica@litper.com", 20, 200);
    
    doc.save(`Reclamo_${shipment.carrier}_${shipment.id}.pdf`);
};

// --- CHAT REPORT GENERATOR (INLINE - MARKDOWN TABLE) ---
export const generateInlineChatReport = (shipments: Shipment[]): string => {
    let report = "";

    // Group by Batch
    const batches: Record<string, Shipment[]> = {};
    shipments.forEach(s => {
        const key = s.batchId ? `Lote ${s.batchDate?.split('T')[1].slice(0,5) || 'Principal'}` : 'Sin Lote';
        if (!batches[key]) batches[key] = [];
        batches[key].push(s);
    });

    Object.entries(batches).forEach(([batchName, batchShipments]) => {
        report += `### 📂 ${batchName} (${batchShipments.length} Guías)\n\n`;
        // Markdown table format specifically requested
        report += "| Guía | Celular | Fechas | Estatus | Recomendaciones | Días después de despacho |\n";
        report += "|---|---|---|---|---|---|\n";
        
        batchShipments.forEach(s => {
            const id = s.id;
            const phone = s.phone || "3000000000"; // Placeholder if missing
            // Get latest event info
            const latestEvent = s.detailedInfo?.events[0];
            const date = latestEvent?.date.replace('T', ' ') || "N/A";
            
            // Format: 2025-11-27 01:09 BOGOTA CUND COL En Centro Logístico de Tránsito
            // Use full event description + location as requested
            const fullStatus = `${date} ${latestEvent?.location || ''} ${s.detailedInfo?.rawStatus || ''}`.trim();
            
            const shortStatus = s.status;
            const rec = getShipmentRecommendation(s);
            const days = `(${s.detailedInfo?.daysInTransit || 0} Días)`;
            
            report += `| ${id} | ${phone} | ${fullStatus} | ${shortStatus} | ${rec} | ${days} |\n`;
        });
        report += "\n---\n";
    });
    
    return report;
};


export const exportToExcel = (shipments: Shipment[]) => {
    // Sheet 1: Dashboard
    const total = shipments.length;
    const issues = shipments.filter(s => s.status === ShipmentStatus.ISSUE).length;
    const dashboardData = [
        { "Métrica": "Total Pedidos", "Valor": total },
        { "Métrica": "Novedades", "Valor": issues },
        { "Métrica": "En Oficina", "Valor": shipments.filter(s => s.status === ShipmentStatus.IN_OFFICE).length },
        { "Métrica": "Fecha Reporte", "Valor": new Date().toLocaleString() }
    ];

    // Sheet 2: Base de Datos with FULL History Text
    const dbData = shipments.map(s => {
        const risk = analyzeShipmentRisk(s);
        
        // Reconstruct the full history text block
        let historyText = `Número: ${s.id}\n`;
        historyText += `Estatus del paquete: ${s.detailedInfo?.rawStatus}\n`;
        historyText += `País: ${s.detailedInfo?.origin} -> ${s.detailedInfo?.destination}\n`;
        historyText += `${s.carrier}:\n`;
        if (s.detailedInfo?.events) {
            s.detailedInfo.events.forEach(e => {
                historyText += `${e.date.replace('T', ' ')} ${e.location} ${e.description}\n`;
            });
        }

        return {
            "Guía": s.id,
            "Lote": s.batchDate ? new Date(s.batchDate).toLocaleString() : 'General',
            "Nivel Riesgo": risk.level,
            "Recomendación Dropi/Pro": getShipmentRecommendation(s),
            "Valor Pedido": s.detailedInfo?.declaredValue || 0,
            "Transportadora": s.carrier,
            "Estado": s.status,
            "Teléfono": s.phone || '',
            "Origen": s.detailedInfo?.origin || '',
            "Destino": s.detailedInfo?.destination || '',
            "Días Tránsito": s.detailedInfo?.daysInTransit || 0,
            "Fecha Actualización": s.dateKey,
            "Último Evento": s.detailedInfo?.events[0]?.description || '',
            "Historial Completo": historyText // Full text block for reference
        };
    });

    // Sheet 3: Reglas
    const rulesData = [
        { "Nivel": "URGENTE", "Color": "Rojo", "Acción": "Resolver en 1h", "Condición": ">5 días sin entrega" },
        { "Nivel": "ATENCIÓN", "Color": "Naranja", "Acción": "Resolver en 4h", "Condición": ">48h sin actualización" },
        { "Nivel": "NORMAL", "Color": "Verde", "Acción": "Monitorear", "Condición": "Tránsito regular" }
    ];

    // Sheet 4: Plantillas
    const templateData = shipments.slice(0, 5).map(s => {
        const t = getLogisticsTemplates(s);
        return { "Tipo": s.status, "Ticket": t.ticketType, "Plantilla Cliente": t.clientTemplate };
    });

    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dashboardData), "Dashboard");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dbData), "Base Datos");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rulesData), "Reglas y Acciones");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateData), "Plantillas WhatsApp");
    
    // Generate file name with date
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Litper_Inteligencia_${dateStr}.xlsx`);
};

// --- DATA MERGING LOGIC ---

// New helper to just parse phones into a map
export const parsePhoneRegistry = (text: string): Record<string, string> => {
    const lines = text.split('\n');
    const phoneMap: Record<string, string> = {};

    lines.forEach(line => {
        const parts = line.trim().split(/[\t,;]+| {2,}/); 
        
        if (parts.length >= 2) {
            const p1 = parts[0].trim();
            const p2 = parts[1].trim();
            
            let guide = "";
            let phone = "";

            if (p2.match(/^3\d{9}$/) || p2.length === 10) {
                phone = p2;
                guide = p1;
            } 
            else if (p1.match(/^3\d{9}$/) || p1.length === 10) {
                phone = p1;
                guide = p2;
            }
            
            if (guide && phone) {
                guide = guide.replace(/[^a-zA-Z0-9]/g, '');
                phoneMap[guide] = phone;
            }
        }
    });
    return phoneMap;
}

export const mergePhoneNumbers = (text: string, currentShipments: Shipment[]): Shipment[] => {
    const phoneMap = parsePhoneRegistry(text);
    if (Object.keys(phoneMap).length === 0) return currentShipments;

    return currentShipments.map(s => {
        // Try exact match first
        let phone = phoneMap[s.id];
        
        // If no exact match, try fuzzy
        if (!phone) {
             const matchKey = Object.keys(phoneMap).find(k => s.id.includes(k) || k.includes(s.id));
             if (matchKey) phone = phoneMap[matchKey];
        }

        if (phone) {
            return { ...s, phone: phone };
        }
        return s;
    });
};

// --- SUMMARY PARSER (17TRACK COPY-PASTE) ---
// UPDATED: Now accepts 'existingShipments' to avoid creating duplicates
export const parseSummaryInput = (text: string, phoneRegistry: Record<string, string> = {}, existingShipments: Shipment[] = [], forcedCarrier?: CarrierName): { shipments: Shipment[] } => {
    const lines = text.split('\n').filter(l => l.trim().length > 0 && !l.includes('Powered by'));
    const shipments: Shipment[] = [];
    const today = new Date().toISOString().split('T')[0];
    const batchId = uuidv4();
    const batchDate = new Date().toISOString();

    // Create a Set of existing IDs to prevent duplication logic here
    const existingIds = new Set(existingShipments.map(s => s.id));

    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 4) {
            const id = parts[0].trim();
            if (id.toLowerCase() === 'número') return;

            // SKIP IF ALREADY EXISTS IN DETAILED LIST
            if (existingIds.has(id)) return;

            // Apply forced carrier if selected, otherwise detect
            const carrier = forcedCarrier || detectCarrier(id);

            const fullStatusStr = parts[3].trim(); 
            const shortStatus = parts[4]?.trim() || "Desconocido"; 
            const daysStr = parts[5]?.trim() || ""; 

            let daysInTransit = 0;
            const daysMatch = daysStr.match(/\((\d+)\s*Días\)/i);
            if (daysMatch) daysInTransit = parseInt(daysMatch[1]);

            let status = ShipmentStatus.IN_TRANSIT;
            const lowerShort = shortStatus.toLowerCase();
             if (lowerShort.includes('entregado') || lowerShort.includes('recogido')) status = ShipmentStatus.DELIVERED;
            else if (lowerShort.includes('novedad') || lowerShort.includes('fallido') || lowerShort.includes('devolución') || lowerShort.includes('no entregado')) status = ShipmentStatus.ISSUE;
            else if (lowerShort.includes('oficina') || lowerShort.includes('disponible')) status = ShipmentStatus.IN_OFFICE;

            const dateMatch = fullStatusStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
            const date = dateMatch ? `${dateMatch[1]}T${dateMatch[2]}` : today;
            const description = fullStatusStr;

            // Apply phone from registry if available
            const phone = phoneRegistry[id];

            const shipment: Shipment = {
                id,
                batchId,
                batchDate,
                source: 'SUMMARY', 
                carrier,
                status,
                phone, // Link phone
                checkStatus: false,
                dateKey: today,
                detailedInfo: {
                    origin: "Colombia",
                    destination: "Colombia",
                    daysInTransit,
                    rawStatus: description,
                    events: [{
                        date,
                        location: "Resumen",
                        description: description,
                        isRecent: true
                    }],
                    hasErrors: false,
                    estimatedDelivery: "N/A",
                    declaredValue: 0
                }
            };
            
            shipment.riskAnalysis = analyzeShipmentRisk(shipment);
            shipments.push(shipment);
        }
    });

    return { shipments };
};

// --- STATS CALCULATION HELPER ---
export const calculateStats = (shipments: Shipment[]): ReportStats => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT || s.status === ShipmentStatus.IN_OFFICE).length;
    const issues = shipments.filter(s => s.status === ShipmentStatus.ISSUE).length;
    
    // Count Untracked (Summary only)
    const untrackedCount = shipments.filter(s => s.source === 'SUMMARY').length;
    
    const totalDays = shipments.reduce((acc, curr) => acc + (curr.detailedInfo?.daysInTransit || 0), 0);
    const avgDays = total > 0 ? Math.round((totalDays / total) * 10) / 10 : 0;

    const criticalPoints: string[] = [];
    if (issues > 0) criticalPoints.push(`${issues} guías presentan novedades o errores.`);
    const longTransit = shipments.filter(s => (s.detailedInfo?.daysInTransit || 0) > 5 && s.status !== ShipmentStatus.DELIVERED);
    if (longTransit.length > 0) criticalPoints.push(`${longTransit.length} guías llevan más de 5 días en tránsito.`);

    // --- FINANCIAL CALCULATIONS ---
    const AVG_RETURN_COST = 40000; 
    
    const activeShipments = shipments.filter(s => s.status !== ShipmentStatus.DELIVERED);
    const totalValuePotential = activeShipments.reduce((sum, s) => sum + (s.detailedInfo?.declaredValue || 0), 0);
    
    const projectedLoss = issues * AVG_RETURN_COST;

    const cityCount: Record<string, number> = {};
    shipments.forEach(s => {
        const d = s.detailedInfo?.destination || "Desconocido";
        cityCount[d] = (cityCount[d] || 0) + 1;
    });
    
    const topCitiesIssues = Object.entries(cityCount)
        .map(([city, count]) => ({
            city, 
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4); 

    const statusBreakdown: Record<string, number> = {};
    shipments.forEach(s => {
        const key = s.status;
        statusBreakdown[key] = (statusBreakdown[key] || 0) + 1;
    });

    return {
        total,
        delivered,
        inTransit,
        issues,
        avgDays,
        criticalPoints,
        totalValuePotential,
        projectedLoss,
        topCitiesIssues,
        statusBreakdown,
        untrackedCount
    };
};

export const parseDetailedInput = (text: string, phoneRegistry: Record<string, string> = {}, forcedCarrier?: CarrierName): { shipments: Shipment[] } => {
    const blocks = text.split(/Número:\s*/).filter(b => b.trim().length > 0);
    const shipments: Shipment[] = [];
    const today = new Date().toISOString().split('T')[0];
    const batchId = uuidv4();
    const batchDate = new Date().toISOString();

    const phoneRegex = /\b(3\d{9})\b/;
    const moneyRegex = /\$\s?([0-9]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/;

    blocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        const id = lines[0].replace('#ERROR!', '').trim();
        let status = ShipmentStatus.PENDING;
        let daysInTransit = 0;
        let origin = "";
        let destination = "";
        // Initialize with forced carrier or Unknown
        let carrier = forcedCarrier || CarrierName.UNKNOWN;
        let rawStatus = "";
        let phone: string | undefined = undefined;
        let declaredValue: number = 0;
        const events: ShipmentEvent[] = [];
        const errors: string[] = [];

        // Check registry first
        if (phoneRegistry[id]) {
            phone = phoneRegistry[id];
        } else {
            const phoneMatch = block.match(phoneRegex);
            if (phoneMatch) {
                phone = phoneMatch[1];
            }
        }

        const moneyMatch = block.match(moneyRegex);
        if (moneyMatch) {
             const cleanVal = moneyMatch[1].replace(/\./g, '').replace(/,/g, '');
             const val = parseInt(cleanVal, 10);
             if (!isNaN(val)) declaredValue = val;
        }

        // Parse basic lines
        lines.forEach(line => {
            if (line.startsWith('Estatus del paquete:')) {
                rawStatus = line.replace('Estatus del paquete:', '').trim();
                const daysMatch = rawStatus.match(/\((\d+)\s*Días\)/i);
                if (daysMatch) daysInTransit = parseInt(daysMatch[1]);
            }

            if (line.startsWith('País:')) {
                const parts = line.replace('País:', '').split('->');
                if (parts.length === 2) {
                    origin = parts[0].trim();
                    destination = parts[1].trim();
                }
            }

            // Only attempt text detection if not forced
            if (!forcedCarrier) {
                if (line.includes('Inter Rapidisimo')) carrier = CarrierName.INTER_RAPIDISIMO;
                else if (line.includes('Coordinadora')) carrier = CarrierName.COORDINADORA;
                else if (line.includes('Envía') || line.includes('Envia')) carrier = CarrierName.ENVIA;
                else if (line.includes('TCC')) carrier = CarrierName.TCC;
                else if (line.includes('Veloces')) carrier = CarrierName.VELOCES;
            }
        });

        // Parse Events
        const dateRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/;
        lines.forEach(line => {
            const match = line.match(dateRegex);
            if (match) {
                const fullDate = `${match[1]}T${match[2]}`;
                let restOfLine = line.replace(match[0], '').trim();
                
                let location = "Ubicación Logística";
                const locMatch = restOfLine.match(/^([A-Z\s\.]+(?:COL|CUND|ANT|CALD|SANT|NORT|VALLE|ATL|BOL|BOY|CAU|CES|COR|HUI|MAG|MET|NAR|QUI|RIS|SUC|TOL))\s+(.*)/);
                
                let description = restOfLine;
                if (locMatch) {
                    location = locMatch[1].trim();
                    description = locMatch[2].trim();
                }

                events.push({
                    date: fullDate,
                    location: location, 
                    description: description,
                    isRecent: false
                });
            }
        });

        if (events.length > 0) {
            events[0].isRecent = true;
            rawStatus = events[0].description; 

            const lowerRaw = rawStatus.toLowerCase();
            if (lowerRaw.includes('entregado') || lowerRaw.includes('recogido') || lowerRaw.includes('entregada')) status = ShipmentStatus.DELIVERED;
            else if (lowerRaw.includes('novedad') || lowerRaw.includes('fallido') || lowerRaw.includes('devolución') || lowerRaw.includes('retorno') || lowerRaw.includes('no entregado')) status = ShipmentStatus.ISSUE;
            else if (lowerRaw.includes('oficina') || lowerRaw.includes('recoger') || lowerRaw.includes('disponible') || lowerRaw.includes('retención')) status = ShipmentStatus.IN_OFFICE;
            else if (lowerRaw.includes('tránsito') || lowerRaw.includes('viajando') || lowerRaw.includes('camino') || lowerRaw.includes('recibimos')) status = ShipmentStatus.IN_TRANSIT;
            else status = ShipmentStatus.IN_TRANSIT;

            if (events[0].location && events[0].location !== "Ubicación Logística") {
                 destination = events[0].location.replace(/\s*COL$/, '').trim();
            }
            const lastEvent = events[events.length - 1];
            if (lastEvent.location && lastEvent.location !== "Ubicación Logística") {
                origin = lastEvent.location.replace(/\s*COL$/, '').trim();
            }
        } else {
            errors.push("No se encontraron eventos de historial.");
        }

        if (carrier === CarrierName.UNKNOWN) carrier = detectCarrier(id);
        const estimatedDelivery = calculateEstimatedDelivery(status, events.length > 0 ? events[0].date : '');

        const baseShipment: Shipment = {
            id,
            batchId,
            batchDate,
            source: 'DETAILED', 
            carrier,
            status,
            phone,
            checkStatus: false,
            dateKey: today,
            detailedInfo: {
                origin: origin || "Colombia",
                destination: destination || "Colombia",
                daysInTransit,
                rawStatus,
                events,
                hasErrors: errors.length > 0,
                errorDetails: errors,
                estimatedDelivery,
                declaredValue
            }
        };

        baseShipment.riskAnalysis = analyzeShipmentRisk(baseShipment);
        shipments.push(baseShipment);
    });

    return { shipments };
};