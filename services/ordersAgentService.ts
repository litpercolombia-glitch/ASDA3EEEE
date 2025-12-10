/**
 * 📦 DISTRITO ORDER PROCESSING
 * Servicio de procesamiento de pedidos desde Chatea Pro, Shopify y Web
 * Integración automática con Dropi
 */

import { askAssistant } from './claudeService';
import { registrarAprendizaje, crearAlerta } from './agentCityService';
import {
  Pedido,
  ProductoPedido,
  Pais,
  DistritoId,
  LlamadaProgramada,
  CanalComunicacion,
} from '../types/agents';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_PEDIDOS = 'litper_pedidos';
const STORAGE_KEY_LLAMADAS = 'litper_llamadas_programadas';

// Configuración por país
const CONFIG_PAIS: Record<
  Pais,
  {
    moneda: string;
    costoEnvioBase: number;
    tiempoValidacion: number; // minutos
  }
> = {
  [Pais.COLOMBIA]: {
    moneda: 'COP',
    costoEnvioBase: 12500,
    tiempoValidacion: 30,
  },
  [Pais.CHILE]: {
    moneda: 'CLP',
    costoEnvioBase: 5000,
    tiempoValidacion: 30,
  },
  [Pais.ECUADOR]: {
    moneda: 'USD',
    costoEnvioBase: 4.5,
    tiempoValidacion: 30,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASE SERVICIO DE PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════════

class OrdersAgentService {
  private pedidos: Map<string, Pedido> = new Map();
  private llamadasProgramadas: Map<string, LlamadaProgramada> = new Map();

  constructor() {
    this.cargarPedidos();
    this.cargarLlamadas();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE PEDIDOS DESDE CHATEA PRO
  // ═══════════════════════════════════════════════════════════════════════════

  async procesarMensajeChateaPro(
    mensaje: string,
    telefono: string,
    pais: Pais
  ): Promise<{
    respuesta: string;
    pedidoCreado?: Pedido;
    requiereValidacion: boolean;
  }> {
    // Analizar mensaje con IA
    const analisis = await this.analizarMensajeCliente(mensaje, pais);

    if (!analisis.esIntencionCompra) {
      return {
        respuesta: analisis.respuestaSugerida,
        requiereValidacion: false,
      };
    }

    // Es intención de compra - procesar
    if (analisis.datosFaltantes.length > 0) {
      return {
        respuesta: this.generarPreguntasDatosFaltantes(analisis.datosFaltantes, pais),
        requiereValidacion: true,
      };
    }

    // Crear pedido con datos extraídos
    const pedido = await this.crearPedidoDesdeChateaPro({
      telefono,
      pais,
      productos: analisis.productosDetectados,
      direccion: analisis.direccionDetectada,
      nombre: analisis.nombreDetectado || '',
    });

    return {
      respuesta: this.generarConfirmacionPedido(pedido),
      pedidoCreado: pedido,
      requiereValidacion: pedido.requiereValidacion,
    };
  }

  private async analizarMensajeCliente(
    mensaje: string,
    pais: Pais
  ): Promise<{
    esIntencionCompra: boolean;
    productosDetectados: Array<{ nombre: string; cantidad: number }>;
    direccionDetectada?: string;
    ciudadDetectada?: string;
    nombreDetectado?: string;
    datosFaltantes: string[];
    respuestaSugerida: string;
  }> {
    const prompt = `
Analiza este mensaje de cliente de ${pais.toUpperCase()} y determina si quiere comprar algo.

MENSAJE: "${mensaje}"

Responde en JSON:
{
  "esIntencionCompra": boolean,
  "productosDetectados": [{"nombre": "...", "cantidad": 1}],
  "direccionDetectada": "dirección si la mencionó",
  "ciudadDetectada": "ciudad si la mencionó",
  "nombreDetectado": "nombre si lo mencionó",
  "datosFaltantes": ["lista de datos que faltan para procesar pedido"],
  "respuestaSugerida": "respuesta amigable si no es compra o si faltan datos"
}`;

    try {
      const respuesta = await askAssistant(prompt);
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error analizando mensaje:', error);
    }

    // Fallback
    return {
      esIntencionCompra: false,
      productosDetectados: [],
      datosFaltantes: ['producto', 'dirección', 'ciudad'],
      respuestaSugerida: '¡Hola! ¿En qué puedo ayudarte hoy?',
    };
  }

  private generarPreguntasDatosFaltantes(datosFaltantes: string[], pais: Pais): string {
    const preguntas: Record<string, string> = {
      producto: '¿Qué producto te interesa?',
      cantidad: '¿Cuántas unidades necesitas?',
      direccion: '¿A qué dirección lo enviamos?',
      ciudad: '¿En qué ciudad estás?',
      nombre: '¿A nombre de quién va el pedido?',
      telefono: '¿Cuál es tu número de contacto?',
    };

    const preguntasFormateadas = datosFaltantes
      .map((d) => preguntas[d] || `¿Cuál es tu ${d}?`)
      .join('\n');

    return `Para completar tu pedido necesito:\n${preguntasFormateadas}`;
  }

  private async crearPedidoDesdeChateaPro(datos: {
    telefono: string;
    pais: Pais;
    productos: Array<{ nombre: string; cantidad: number }>;
    direccion?: string;
    nombre: string;
  }): Promise<Pedido> {
    const config = CONFIG_PAIS[datos.pais];

    // Buscar productos (simulado - en producción conectar con catálogo Dropi)
    const productos: ProductoPedido[] = await Promise.all(
      datos.productos.map(async (p) => ({
        id: `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precioUnitario: await this.buscarPrecioProducto(p.nombre, datos.pais),
        disponible: true,
      }))
    );

    const subtotal = productos.reduce((sum, p) => sum + p.precioUnitario * p.cantidad, 0);

    const pedido: Pedido = {
      id: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      origenPlataforma: 'chatea_pro',
      estado: 'nuevo',
      cliente: {
        nombre: datos.nombre,
        telefono: datos.telefono,
        direccion: datos.direccion || '',
        ciudad: '',
        pais: datos.pais,
      },
      productos,
      subtotal,
      envio: config.costoEnvioBase,
      total: subtotal + config.costoEnvioBase,
      moneda: config.moneda,
      requiereValidacion: !datos.direccion || !datos.nombre,
      datosValidados: false,
      creadoEn: new Date(),
    };

    this.pedidos.set(pedido.id, pedido);
    this.guardarPedidos();

    // Registrar
    registrarAprendizaje({
      tipo: 'experiencia',
      categoria: 'pedido_chateapro',
      descripcion: `Pedido desde Chatea Pro: ${productos.length} productos`,
      datos: { productos: productos.map((p) => p.nombre), total: pedido.total },
      impacto: 'medio',
      origenPais: datos.pais,
    });

    return pedido;
  }

  private async buscarPrecioProducto(nombre: string, pais: Pais): Promise<number> {
    // En producción: conectar con API de Dropi para buscar precio real
    // Por ahora: precio simulado basado en el nombre
    const basePrice = Math.floor(Math.random() * 100000) + 50000;
    return basePrice;
  }

  private generarConfirmacionPedido(pedido: Pedido): string {
    const productosLista = pedido.productos
      .map(
        (p) =>
          `• ${p.cantidad}x ${p.nombre} - ${pedido.moneda} ${p.precioUnitario.toLocaleString()}`
      )
      .join('\n');

    return `¡Pedido confirmado! 🎉

${productosLista}

💰 Subtotal: ${pedido.moneda} ${pedido.subtotal.toLocaleString()}
🚚 Envío: ${pedido.moneda} ${pedido.envio.toLocaleString()}
━━━━━━━━━━━━━━━━━
📦 TOTAL: ${pedido.moneda} ${pedido.total.toLocaleString()}

${pedido.requiereValidacion ? '⚠️ Te llamaremos para confirmar la dirección de envío.' : '✅ Tu pedido será procesado inmediatamente.'}

¿Todo correcto?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE PEDIDOS DESDE SHOPIFY
  // ═══════════════════════════════════════════════════════════════════════════

  async procesarPedidoShopify(datosShopify: {
    orderId: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    shippingAddress: {
      address1: string;
      address2?: string;
      city: string;
      country: string;
    };
    lineItems: Array<{
      name: string;
      quantity: number;
      price: number;
      sku?: string;
    }>;
    totalPrice: number;
    paymentStatus: string;
  }): Promise<Pedido> {
    const pais = this.detectarPaisPorDireccion(datosShopify.shippingAddress.country);
    const config = CONFIG_PAIS[pais];

    const productos: ProductoPedido[] = datosShopify.lineItems.map((item) => ({
      id: item.sku || `SKU_${Date.now()}`,
      nombre: item.name,
      sku: item.sku,
      cantidad: item.quantity,
      precioUnitario: item.price,
      disponible: true,
    }));

    const direccionCompleta = [
      datosShopify.shippingAddress.address1,
      datosShopify.shippingAddress.address2,
    ]
      .filter(Boolean)
      .join(', ');

    // Validar datos
    const validacion = await this.validarDatosPedido({
      telefono: datosShopify.customer.phone,
      direccion: direccionCompleta,
      ciudad: datosShopify.shippingAddress.city,
      pais,
    });

    const pedido: Pedido = {
      id: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      origenPlataforma: 'shopify',
      origenId: datosShopify.orderId,
      estado: validacion.esValido ? 'validando' : 'nuevo',
      cliente: {
        nombre: datosShopify.customer.name,
        telefono: datosShopify.customer.phone,
        email: datosShopify.customer.email,
        direccion: direccionCompleta,
        ciudad: datosShopify.shippingAddress.city,
        pais,
      },
      productos,
      subtotal: datosShopify.totalPrice - config.costoEnvioBase,
      envio: config.costoEnvioBase,
      total: datosShopify.totalPrice,
      moneda: config.moneda,
      requiereValidacion: !validacion.esValido,
      datosValidados: validacion.esValido,
      validacionNotas: validacion.problemas?.join(', '),
      creadoEn: new Date(),
    };

    this.pedidos.set(pedido.id, pedido);
    this.guardarPedidos();

    // Si requiere validación, programar llamada
    if (!validacion.esValido) {
      await this.programarLlamadaValidacion(pedido, validacion.problemas || []);
    } else {
      // Procesar automáticamente
      await this.enviarADropi(pedido);
    }

    return pedido;
  }

  private detectarPaisPorDireccion(country: string): Pais {
    const paises: Record<string, Pais> = {
      Colombia: Pais.COLOMBIA,
      CO: Pais.COLOMBIA,
      Chile: Pais.CHILE,
      CL: Pais.CHILE,
      Ecuador: Pais.ECUADOR,
      EC: Pais.ECUADOR,
    };
    return paises[country] || Pais.COLOMBIA;
  }

  private async validarDatosPedido(datos: {
    telefono: string;
    direccion: string;
    ciudad: string;
    pais: Pais;
  }): Promise<{
    esValido: boolean;
    problemas?: string[];
  }> {
    const problemas: string[] = [];

    // Validar teléfono
    const telefonoLimpio = datos.telefono.replace(/\D/g, '');
    const longitudesValidas: Record<Pais, number[]> = {
      [Pais.COLOMBIA]: [10],
      [Pais.CHILE]: [9],
      [Pais.ECUADOR]: [9, 10],
    };

    if (!longitudesValidas[datos.pais].includes(telefonoLimpio.length)) {
      problemas.push('telefono_invalido');
    }

    // Validar dirección
    if (datos.direccion.length < 10) {
      problemas.push('direccion_incompleta');
    }

    // Validar que tenga número
    if (!/\d/.test(datos.direccion)) {
      problemas.push('direccion_sin_numero');
    }

    // Validar ciudad
    if (!datos.ciudad || datos.ciudad.length < 3) {
      problemas.push('ciudad_invalida');
    }

    return {
      esValido: problemas.length === 0,
      problemas: problemas.length > 0 ? problemas : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLAMADAS DE VALIDACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  async programarLlamadaValidacion(
    pedido: Pedido,
    problemas: string[]
  ): Promise<LlamadaProgramada> {
    const llamada: LlamadaProgramada = {
      id: `CALL_${Date.now()}`,
      tipo: 'confirmacion',
      clienteNombre: pedido.cliente.nombre,
      clienteTelefono: pedido.cliente.telefono,
      pais: pedido.cliente.pais,
      programadaPara: new Date(
        Date.now() + CONFIG_PAIS[pedido.cliente.pais].tiempoValidacion * 60 * 1000
      ),
      estado: 'pendiente',
      motivo: `Validar datos de pedido: ${problemas.join(', ')}`,
      pedidoRelacionado: pedido.id,
    };

    this.llamadasProgramadas.set(llamada.id, llamada);
    this.guardarLlamadas();

    crearAlerta({
      tipo: 'info',
      distrito: DistritoId.ORDERS,
      pais: pedido.cliente.pais,
      titulo: 'Llamada de validación programada',
      mensaje: `Pedido ${pedido.id} - Llamar a ${pedido.cliente.nombre} para validar ${problemas.join(', ')}`,
    });

    return llamada;
  }

  async ejecutarLlamadaValidacion(llamadaId: string): Promise<{
    exito: boolean;
    resultado: string;
    datosCorrregidos?: Partial<Pedido['cliente']>;
  }> {
    const llamada = this.llamadasProgramadas.get(llamadaId);
    if (!llamada) {
      return { exito: false, resultado: 'Llamada no encontrada' };
    }

    llamada.estado = 'en_curso';

    // Generar script de llamada
    const script = await this.generarScriptValidacion(llamada);

    // En producción: integrar con sistema de llamadas VoIP
    console.log(`[Llamada Validación] A ${llamada.clienteTelefono}:`);
    console.log(script);

    // Simular resultado exitoso
    llamada.estado = 'completada';
    llamada.resultado = 'exitosa';
    llamada.duracion = 120; // 2 minutos simulados

    // Actualizar pedido
    if (llamada.pedidoRelacionado) {
      const pedido = this.pedidos.get(llamada.pedidoRelacionado);
      if (pedido) {
        pedido.datosValidados = true;
        pedido.estado = 'validando';

        // Enviar a Dropi automáticamente
        await this.enviarADropi(pedido);
      }
    }

    this.guardarLlamadas();
    this.guardarPedidos();

    return {
      exito: true,
      resultado: 'Datos validados correctamente',
    };
  }

  private async generarScriptValidacion(llamada: LlamadaProgramada): Promise<string> {
    const prompt = `
Genera un script de llamada corto y profesional para validar datos de un pedido.

CLIENTE: ${llamada.clienteNombre}
PAÍS: ${llamada.pais}
MOTIVO: ${llamada.motivo}

El script debe:
- Ser breve (30-60 segundos)
- Confirmar identidad del cliente
- Pedir los datos faltantes
- Confirmar el pedido
- Ser amigable y en español de ${llamada.pais}

Genera solo el script.`;

    try {
      return await askAssistant(prompt);
    } catch {
      return `Hola ${llamada.clienteNombre}, le llamo de Litper para confirmar los datos de su pedido...`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRACIÓN CON DROPI
  // ═══════════════════════════════════════════════════════════════════════════

  async enviarADropi(pedido: Pedido): Promise<{
    exito: boolean;
    dropiOrderId?: string;
    error?: string;
  }> {
    pedido.estado = 'procesando';

    try {
      // En producción: llamar API de Dropi
      // const response = await fetch('https://api.dropi.com/orders', {
      //   method: 'POST',
      //   headers: { 'Authorization': 'Bearer TOKEN' },
      //   body: JSON.stringify(pedido)
      // });

      // Simular respuesta exitosa
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dropiOrderId = `DROPI_${Date.now()}`;

      pedido.dropiOrderId = dropiOrderId;
      pedido.estado = 'creado_dropi';
      pedido.procesadoEn = new Date();

      this.guardarPedidos();

      // Registrar éxito
      registrarAprendizaje({
        tipo: 'experiencia',
        categoria: 'pedido_dropi',
        descripcion: 'Pedido creado en Dropi exitosamente',
        datos: {
          pedidoId: pedido.id,
          dropiId: dropiOrderId,
          origen: pedido.origenPlataforma,
        },
        impacto: 'medio',
        origenPais: pedido.cliente.pais,
      });

      return {
        exito: true,
        dropiOrderId,
      };
    } catch (error) {
      pedido.estado = 'error';
      this.guardarPedidos();

      crearAlerta({
        tipo: 'error',
        distrito: DistritoId.ORDERS,
        pais: pedido.cliente.pais,
        titulo: 'Error creando pedido en Dropi',
        mensaje: `Pedido ${pedido.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });

      return {
        exito: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async asignarGuia(
    pedidoId: string,
    guiaNumero: string,
    transportadora: string
  ): Promise<boolean> {
    const pedido = this.pedidos.get(pedidoId);
    if (!pedido) return false;

    pedido.guiaNumero = guiaNumero;
    pedido.transportadora = transportadora;
    pedido.estado = 'con_guia';

    this.guardarPedidos();

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════════════════════════

  getPedido(id: string): Pedido | undefined {
    return this.pedidos.get(id);
  }

  getPedidosPorPais(pais: Pais): Pedido[] {
    return Array.from(this.pedidos.values()).filter((p) => p.cliente.pais === pais);
  }

  getPedidosPendientes(): Pedido[] {
    return Array.from(this.pedidos.values()).filter((p) =>
      ['nuevo', 'validando', 'procesando'].includes(p.estado)
    );
  }

  getPedidosPorOrigen(origen: Pedido['origenPlataforma']): Pedido[] {
    return Array.from(this.pedidos.values()).filter((p) => p.origenPlataforma === origen);
  }

  getLlamadasPendientes(): LlamadaProgramada[] {
    return Array.from(this.llamadasProgramadas.values()).filter((l) => l.estado === 'pendiente');
  }

  getEstadisticas(pais?: Pais) {
    let pedidos = Array.from(this.pedidos.values());
    if (pais) {
      pedidos = pedidos.filter((p) => p.cliente.pais === pais);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pedidosHoy = pedidos.filter((p) => p.creadoEn >= hoy);

    const porOrigen = {
      chatea_pro: pedidos.filter((p) => p.origenPlataforma === 'chatea_pro').length,
      shopify: pedidos.filter((p) => p.origenPlataforma === 'shopify').length,
      web: pedidos.filter((p) => p.origenPlataforma === 'web').length,
      manual: pedidos.filter((p) => p.origenPlataforma === 'manual').length,
    };

    const porEstado = {
      nuevo: pedidos.filter((p) => p.estado === 'nuevo').length,
      validando: pedidos.filter((p) => p.estado === 'validando').length,
      procesando: pedidos.filter((p) => p.estado === 'procesando').length,
      creado_dropi: pedidos.filter((p) => p.estado === 'creado_dropi').length,
      con_guia: pedidos.filter((p) => p.estado === 'con_guia').length,
      error: pedidos.filter((p) => p.estado === 'error').length,
    };

    const totalValor = pedidos.reduce((sum, p) => sum + p.total, 0);
    const pedidosValidados = pedidos.filter((p) => p.datosValidados).length;

    return {
      total: pedidos.length,
      procesadosHoy: pedidosHoy.length,
      pendientes: porEstado.nuevo + porEstado.validando + porEstado.procesando,
      conError: porEstado.error,
      porOrigen,
      porEstado,
      valorTotal: totalValor,
      tasaValidacion:
        pedidos.length > 0 ? Math.round((pedidosValidados / pedidos.length) * 100) : 100,
      llamadasPendientes: this.getLlamadasPendientes().length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════

  private cargarPedidos(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PEDIDOS);
      if (data) {
        const pedidos: Pedido[] = JSON.parse(data);
        pedidos.forEach((p) => {
          p.creadoEn = new Date(p.creadoEn);
          if (p.procesadoEn) p.procesadoEn = new Date(p.procesadoEn);
          this.pedidos.set(p.id, p);
        });
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  }

  private guardarPedidos(): void {
    try {
      const pedidos = Array.from(this.pedidos.values());
      localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(pedidos));
    } catch (error) {
      console.error('Error guardando pedidos:', error);
    }
  }

  private cargarLlamadas(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LLAMADAS);
      if (data) {
        const llamadas: LlamadaProgramada[] = JSON.parse(data);
        llamadas.forEach((l) => {
          l.programadaPara = new Date(l.programadaPara);
          this.llamadasProgramadas.set(l.id, l);
        });
      }
    } catch (error) {
      console.error('Error cargando llamadas:', error);
    }
  }

  private guardarLlamadas(): void {
    try {
      const llamadas = Array.from(this.llamadasProgramadas.values());
      localStorage.setItem(STORAGE_KEY_LLAMADAS, JSON.stringify(llamadas));
    } catch (error) {
      console.error('Error guardando llamadas:', error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const ordersService = new OrdersAgentService();

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════════

export const procesarMensajeChateaPro = (mensaje: string, telefono: string, pais: Pais) =>
  ordersService.procesarMensajeChateaPro(mensaje, telefono, pais);

export const procesarPedidoShopify = (
  datos: Parameters<typeof ordersService.procesarPedidoShopify>[0]
) => ordersService.procesarPedidoShopify(datos);

export const ejecutarLlamadaValidacion = (id: string) =>
  ordersService.ejecutarLlamadaValidacion(id);

export const enviarADropi = (pedido: Pedido) => ordersService.enviarADropi(pedido);

export const asignarGuia = (pedidoId: string, guia: string, transportadora: string) =>
  ordersService.asignarGuia(pedidoId, guia, transportadora);

export const getPedido = (id: string) => ordersService.getPedido(id);

export const getPedidosPorPais = (pais: Pais) => ordersService.getPedidosPorPais(pais);

export const getPedidosPendientes = () => ordersService.getPedidosPendientes();

export const getPedidosPorOrigen = (origen: Pedido['origenPlataforma']) =>
  ordersService.getPedidosPorOrigen(origen);

export const getLlamadasPendientes = () => ordersService.getLlamadasPendientes();

export const getEstadisticasPedidos = (pais?: Pais) => ordersService.getEstadisticas(pais);
