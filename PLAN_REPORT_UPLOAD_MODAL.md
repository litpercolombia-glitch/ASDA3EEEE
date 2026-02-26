# PLAN: Sistema de Subida de Reportes por Persona con Modal Emergente

## Resumen Ejecutivo
Crear un sistema profesional de subida de reportes donde cada persona (operador/usuario) pueda subir su reporte individual a través de un modal emergente. Los reportes quedan almacenados en la app, se pueden consultar por persona, y el admin tiene vista completa de todos los reportes de todos los usuarios.

---

## Ideas Profesionales Inspiradas en Empresas Top Globales

### Salesforce - Report Builder
- Formularios dinámicos con campos personalizables
- Flujo de aprobación (submit → pending → approved/rejected)
- Notificaciones en tiempo real al admin

### Google Workspace - Drive + Forms
- Drag & drop de archivos con preview instantáneo
- Múltiples formatos soportados (PDF, Excel, imágenes, texto)
- Búsqueda inteligente en contenido de reportes

### Microsoft Power BI / Dynamics 365
- Dashboard de estado de reportes por persona
- Indicadores de completitud (% reportes enviados vs esperados)
- Exportación masiva y consolidación automática

### Workday (HR Enterprise)
- Deadlines con alertas automáticas
- Templates de reportes por tipo/departamento
- Historial con versiones (si alguien re-sube, se guarda histórico)

### SAP SuccessFactors
- Workflow de aprobación multi-nivel
- Score de cumplimiento por persona
- Reportes consolidados automáticos para managers

### Slack / Notion
- Comentarios y feedback en cada reporte
- Menciones y asignaciones
- Estado visual (semáforo: pendiente, enviado, aprobado)

---

## Arquitectura Técnica

### Stack actual detectado:
- **Framework**: React 19 + TypeScript + Vite
- **State**: Zustand (persistido con localStorage)
- **Styling**: Tailwind CSS (dark theme navy)
- **Auth**: Sistema propio con roles: `admin | operador | viewer`
- **Icons**: Lucide React
- **Export**: jsPDF + xlsx

---

## Componentes a Crear

### 1. `components/ReportUpload/ReportUploadModal.tsx`
Modal emergente principal donde cada persona sube su reporte.

**Características:**
- Drag & drop de archivos (PDF, Excel, imágenes)
- Formulario con: título, tipo de reporte, descripción, periodo
- Preview del archivo antes de enviar
- Barra de progreso de subida
- Confirmación visual de éxito

### 2. `components/ReportUpload/ReportUploadButton.tsx`
Botón flotante/accesible que abre el modal desde cualquier pantalla.

### 3. `components/ReportUpload/MyReportsPanel.tsx`
Panel donde cada persona ve SUS reportes subidos.

**Características:**
- Lista de reportes con estado (enviado, revisado, aprobado)
- Filtros por fecha, tipo, estado
- Opción de re-subir/actualizar un reporte
- Descargar sus propios reportes

### 4. `components/ReportUpload/AdminReportsView.tsx`
Vista admin que consolida TODOS los reportes de TODAS las personas.

**Características:**
- Tabla con filtros por persona, fecha, tipo, estado
- Bulk actions (aprobar múltiples, exportar todos)
- Métricas: quién ha subido, quién falta, cumplimiento %
- Exportar consolidado (Excel/PDF)
- Comentarios/feedback por reporte

### 5. `stores/reportUploadStore.ts`
Estado global con Zustand para manejar reportes subidos.

### 6. `services/reportUploadService.ts`
Servicio para CRUD de reportes, validaciones, y lógica de negocio.

---

## Modelo de Datos

```typescript
interface UserReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  type: ReportCategory;
  period: { start: string; end: string };
  fileData: string; // Base64 del archivo
  fileName: string;
  fileType: string; // 'pdf' | 'xlsx' | 'image' | 'text'
  fileSize: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  adminComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  version: number;
  previousVersionId?: string;
  tags: string[];
}

type ReportCategory =
  | 'daily_operations'    // Reporte diario de operaciones
  | 'weekly_summary'      // Resumen semanal
  | 'incident_report'     // Reporte de incidencias
  | 'delivery_report'     // Reporte de entregas
  | 'financial_report'    // Reporte financiero
  | 'custom';             // Personalizado
```

---

## Flujo de Usuario

### Para Operadores/Usuarios:
1. Click en botón "Subir Reporte" (visible en sidebar/header)
2. Se abre modal emergente con formulario
3. Llena campos + arrastra archivo
4. Click "Enviar Reporte"
5. Confirmación visual → reporte queda en "Enviado"
6. Puede ver sus reportes en "Mis Reportes"

### Para Admin:
1. Sección "Gestión de Reportes" en AdminPanel
2. Ve dashboard con métricas de cumplimiento
3. Lista todos los reportes de todas las personas
4. Puede aprobar/rechazar con comentarios
5. Exportar consolidado
6. Ver historial por persona

---

## Pasos de Implementación

### Paso 1: Store + Service (Base de datos en memoria)
- Crear `stores/reportUploadStore.ts`
- Crear `services/reportUploadService.ts`

### Paso 2: Modal de Subida
- Crear `components/ReportUpload/ReportUploadModal.tsx`
- Incluir drag & drop, form, preview, validación

### Paso 3: Panel "Mis Reportes" (Vista usuario)
- Crear `components/ReportUpload/MyReportsPanel.tsx`
- Lista con filtros y estados

### Paso 4: Vista Admin
- Crear `components/ReportUpload/AdminReportsView.tsx`
- Dashboard de métricas + tabla completa + acciones

### Paso 5: Integración
- Agregar botón de subida en la UI principal
- Agregar pestaña en sidebar/tabs
- Conectar con sistema de auth existente (roles)
- Agregar en AdminPanel existente

### Paso 6: Extras profesionales
- Notificaciones de nuevos reportes
- Deadlines configurables
- Export consolidado
