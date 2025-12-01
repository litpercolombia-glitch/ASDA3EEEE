# Litper Pro - Sistema de Seguimiento Logístico

<div align="center">

**Plataforma profesional de gestión y seguimiento de envíos con Inteligencia Artificial**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [API y Servicios](#-api-y-servicios)
- [Contribuir](#-contribuir)

## ✨ Características

### 🎯 Funcionalidades Principales

- **Importación Masiva de Datos**: Soporta Excel/CSV para carga rápida de envíos
- **Detección Automática de Transportadora**: Identifica automáticamente 5 transportadoras colombianas
- **Seguimiento Inteligente con IA**: Powered by Google Gemini para tracking en tiempo real
- **Sistema de Alertas por Riesgo**: Categorización automática (Urgente, Atención, Seguimiento, Normal)
- **Análisis de Evidencias**: Vision AI para análisis de imágenes de entrega
- **Comunicación WhatsApp**: Integración directa para contacto con clientes
- **Reportes y Estadísticas**: Dashboard completo con métricas clave
- **Modo Oscuro**: Soporte completo para tema claro/oscuro
- **Almacenamiento Local**: Persistencia de datos con expiración configurable (24h)

### 🤖 Capacidades de IA

- **Gemini Vision**: Análisis de fotos de entrega
- **Gemini Flash**: Transcripción de audio
- **Gemini Image**: Generación de imágenes de marketing
- **Search Grounding**: Búsqueda en tiempo real para tracking
- **Asistente Virtual**: Chat contextual sobre envíos

### 🚚 Transportadoras Soportadas

- Inter Rapidísimo
- Envía
- Coordinadora
- TCC
- Veloces

## 🛠 Tecnologías

### Frontend

- **React 19.2** - Framework UI
- **TypeScript 5.8** - Tipado estático
- **Vite 6.2** - Build tool y dev server
- **Tailwind CSS** - Estilos utility-first
- **Lucide React** - Iconografía moderna

### Integracion IA

- **Google Gemini API** - Modelos de IA (Vision, Flash, Image)
- **@google/genai** - SDK oficial de Google

### Utilidades

- **XLSX** - Manejo de archivos Excel
- **jsPDF** - Generación de PDFs
- **html-to-image** - Capturas de pantalla
- **uuid** - Generación de IDs únicos

### Calidad de Código

- **ESLint** - Linting de código
- **Prettier** - Formateo automático
- **TypeScript Strict Mode** - Verificación de tipos estricta

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- npm 9+
- API Key de Google Gemini ([Obtener aquí](https://aistudio.google.com/apikey))

### Pasos

```bash
# Clonar el repositorio
git clone <repository-url>
cd ASDA3EEEE

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env y añadir tu VITE_GEMINI_API_KEY

# Ejecutar en desarrollo
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# API de Google Gemini (REQUERIDO)
VITE_GEMINI_API_KEY=tu_api_key_aqui

# Configuración de Almacenamiento
VITE_STORAGE_KEY=litper-shipments
VITE_STORAGE_EXPIRY_HOURS=24

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_IMAGE_ANALYSIS=true
VITE_ENABLE_AUDIO_TRANSCRIPTION=true
```

### Configuración de Constantes

Edita `config/constants.ts` para personalizar:

- Umbrales de riesgo por ciudad
- Patrones de transportadoras
- Límites de archivo
- Configuración de UI

## 🚀 Uso

### 1. Importar Datos

La aplicación requiere un proceso de 3 pasos:

**Paso 1: Teléfonos**

```
Pega números de WhatsApp (uno por línea)
Formato: +573001234567 o 3001234567
```

**Paso 2: Informe Detallado**

```
Importa Excel con columnas:
- Guía
- Estado
- Origen
- Destino
- Días en tránsito
- Eventos (opcional)
```

**Paso 3: Resumen**

```
Importa guías adicionales sin seguimiento detallado
```

### 2. Visualizar y Gestionar

- **Vista Simple**: Onboarding inicial
- **Vista Detallada**: Lista completa con filtros
- **Dashboard de Alertas**: Vista por niveles de riesgo

### 3. Seguimiento Masivo

```
1. Selecciona hasta 40 envíos
2. Click en "Seguimiento Masivo 17Track"
3. Captura screenshot del tracking
4. Usa IA para extraer datos
```

### 4. Comunicación con Clientes

```
1. Click en icono de WhatsApp
2. Mensaje pre-llenado según estado
3. Envío directo desde WhatsApp Web/App
```

## 📁 Estructura del Proyecto

```
ASDA3EEEE/
├── components/              # Componentes React
│   ├── ui/                 # Componentes UI reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── AlertDashboard.tsx
│   ├── AssistantPanel.tsx
│   ├── BatchTrackingModal.tsx
│   ├── DetailedShipmentCard.tsx
│   ├── EvidenceModal.tsx
│   ├── GeneralReport.tsx
│   ├── QuickReferencePanel.tsx
│   └── ShipmentRow.tsx
│
├── services/               # Lógica de negocio
│   ├── logisticsService.ts # Gestión de envíos
│   └── geminiService.ts    # Integración con IA
│
├── hooks/                  # Custom React Hooks
│   ├── useShipments.ts
│   ├── useTheme.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useToast.ts
│
├── utils/                  # Utilidades
│   ├── errorHandler.ts
│   └── validators.ts
│
├── config/                 # Configuración
│   └── constants.ts
│
├── types.ts                # Definiciones TypeScript
├── App.tsx                 # Componente principal
├── index.tsx               # Entry point
├── vite.config.ts          # Configuración Vite
├── tsconfig.json           # Configuración TypeScript
├── .eslintrc.json          # Configuración ESLint
├── .prettierrc.json        # Configuración Prettier
└── package.json            # Dependencias

```

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (puerto 3000)

# Build
npm run build            # Compila para producción
npm run preview          # Preview del build de producción

# Calidad de Código
npm run lint             # Ejecuta ESLint
npm run lint:fix         # Corrige problemas automáticamente
npm run format           # Formatea código con Prettier
npm run format:check     # Verifica formateo sin modificar
npm run type-check       # Verifica tipos TypeScript
```

## 🔌 API y Servicios

### Logistics Service (`services/logisticsService.ts`)

```typescript
// Gestión de datos
loadShipments(): Shipment[]
saveShipments(shipments: Shipment[]): void
clearAllShipments(): void

// Análisis
detectCarrier(guide: string): CarrierName
analyzeShipmentRisk(shipment: Shipment): ShipmentRisk

// Tracking
getTrackingUrl(carrier: CarrierName, id: string): string
generateBulkTrackingUrl(shipments: Shipment[]): string

// Reportes
generateReportStats(shipments: Shipment[]): ReportStats
exportToExcel(shipments: Shipment[]): void
generateClaimPDF(shipment: Shipment): void

// Sesiones
exportSessionData(shipments: Shipment[]): void
importSessionData(file: File): Promise<Shipment[]>
```

### Gemini Service (`services/geminiService.ts`)

```typescript
// Análisis de imágenes
analyzeEvidenceImage(base64Image: string): Promise<string>

// Transcripción
transcribeAudio(base64Audio: string): Promise<string>

// Generación de imágenes
generateMarketingImage(prompt: string): Promise<string | null>

// Tracking con IA
trackShipmentWithAI(trackingNumber: string, carrier: string): Promise<AITrackingResult>

// Screenshot analysis
analyzeTrackingScreenshot(base64Image: string): Promise<AITrackingResult[]>

// Asistente
askAssistant(question: string, context?: string): Promise<string>
```

## 🎨 Componentes UI Reutilizables

### Button

```tsx
<Button
  variant="primary|secondary|danger|ghost"
  size="sm|md|lg"
  isLoading={false}
  icon={<IconComponent />}
>
  Texto del botón
</Button>
```

### Input

```tsx
<Input
  label="Nombre del campo"
  error="Mensaje de error"
  helperText="Texto de ayuda"
  icon={<SearchIcon />}
  {...props}
/>
```

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título del Modal"
  size="sm|md|lg|xl|full"
>
  Contenido del modal
</Modal>
```

### Toast

```tsx
const { success, error, warning, info } = useToast();

success('Operación exitosa');
error('Ocurrió un error');
warning('Advertencia importante');
info('Información relevante');
```

## 🔒 Seguridad

- ✅ Variables de entorno para API keys
- ✅ Sanitización de inputs de usuario
- ✅ Validación de tipos con TypeScript
- ✅ Error boundaries para captura de errores
- ✅ LocalStorage con expiración
- ✅ Headers de seguridad (configurables en producción)

## 🐛 Debugging

```bash
# Modo desarrollo con logs
npm run dev

# Verificar errores de tipos
npm run type-check

# Verificar calidad de código
npm run lint

# Ver bundle size
npm run build
```

## 📊 Métricas de Código

- **Líneas de código**: ~5,000
- **Componentes React**: 15+
- **Hooks personalizados**: 5
- **Funciones de servicio**: 30+
- **Cobertura TypeScript**: 100%

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Estilo

- Sigue las reglas de ESLint configuradas
- Formatea con Prettier antes de commit
- Escribe tests para nuevas funcionalidades
- Documenta funciones públicas con JSDoc
- Usa commits semánticos (feat:, fix:, docs:, etc.)

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Litper Colombia** - Desarrollo inicial

## 🙏 Agradecimientos

- Google Gemini por la API de IA
- 17Track por el servicio de tracking
- Comunidad de React y TypeScript
- Contribuidores de código abierto

## 📞 Soporte

Para soporte técnico o preguntas:

- 📧 Email: soporte@litper.com
- 💬 WhatsApp: [Contactar](https://chateapro.app/flow/f140677#/livechat)
- 📚 Documentación: [Wiki del proyecto](#)

---

<div align="center">
Hecho con ❤️ por el equipo de Litper Colombia
</div>
