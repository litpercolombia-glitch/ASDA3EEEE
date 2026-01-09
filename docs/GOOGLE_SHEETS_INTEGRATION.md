# Google Sheets Integration - Litper Pro

## Resumen

Sistema completo de integración bidireccional entre Litper Pro y Google Sheets que permite:

- Sincronizar envíos automáticamente
- Usar fórmulas de Excel/Sheets para análisis
- Dashboard en tiempo real
- Plantillas predefinidas para logística

---

## Archivos Creados

### Frontend (TypeScript/React)

| Archivo | Descripción |
|---------|-------------|
| `types/googleSheets.types.ts` | Tipos TypeScript para toda la integración |
| `services/googleSheetsService.ts` | Servicio principal con plantillas y fórmulas |
| `components/tabs/GoogleSheetsTab.tsx` | Tab principal de la UI |
| `components/tabs/SheetsConfigPanel.tsx` | Panel de configuración avanzada |

### Backend (Python/FastAPI)

| Archivo | Descripción |
|---------|-------------|
| `backend/services/google_sheets_service.py` | Servicio con Google Sheets API |
| `backend/routes/google_sheets_routes.py` | Endpoints REST de la API |

---

## Cómo Usar

### 1. Configuración Inicial

1. Crear un nuevo Google Spreadsheet en [sheets.google.com](https://sheets.google.com)
2. Copiar el ID del spreadsheet de la URL:
   ```
   https://docs.google.com/spreadsheets/d/[ID_AQUÍ]/edit
   ```
3. Ir al tab "Google Sheets" en Litper Pro
4. Pegar el ID y conectar

### 2. Sincronizar Envíos

Una vez conectado, puedes:

- **Sincronizar Envíos**: Exporta todos tus envíos a la hoja "Envíos"
- **Actualizar Dashboard**: Crea métricas y KPIs en la hoja "Dashboard"
- **Sincronizar Ciudades**: Estadísticas agrupadas por ciudad
- **Sincronizar Alertas**: Lista de alertas activas

### 3. Usar Plantillas

El sistema incluye 3 plantillas predefinidas:

#### Logística Completa
- Hojas: Envíos, Dashboard, Alertas, Ciudades, Transportadoras
- Fórmulas: Total envíos, entregados, tasa de éxito, valor en riesgo

#### Finanzas Básico
- Hojas: Resumen Diario, Resumen Mensual
- Fórmulas: Ganancia, margen porcentual

#### Reporte Semanal
- Hojas: Esta Semana, Comparativo
- Fórmulas: Variación semanal

### 4. Fórmulas Predefinidas

El sistema incluye 10+ fórmulas listas para usar:

```
=COUNTIF(C:C,"Entregado")                    # Total entregados
=COUNTIF(C:C,"Entregado")/(COUNTA(C:C)-1)*100  # Tasa de éxito %
=AVERAGE(E:E)                                # Promedio de días
=SUMIF(K:K,"URGENTE",H:H)                    # Valor en riesgo urgente
=IF(E2>7,"CRÍTICO",IF(E2>5,"ALTO","NORMAL")) # Semáforo de riesgo
```

---

## API Endpoints

### Conexión

```bash
# Conectar a spreadsheet
POST /api/google-sheets/connect
{
  "spreadsheet_id": "1BxiMVs...",
  "credentials": "..." (opcional)
}

# Verificar conexión
GET /api/google-sheets/test-connection/{spreadsheet_id}

# Obtener info
GET /api/google-sheets/info/{spreadsheet_id}
```

### Sincronización

```bash
# Sincronizar envíos
POST /api/google-sheets/sync/envios
{
  "spreadsheet_id": "...",
  "envios": [...],
  "sheet_name": "Envíos"
}

# Sincronizar finanzas
POST /api/google-sheets/sync/finanzas

# Sincronizar ciudades
POST /api/google-sheets/sync/ciudades

# Actualizar dashboard
POST /api/google-sheets/dashboard/update
```

### Lectura/Escritura

```bash
# Leer datos de una hoja
GET /api/google-sheets/data?spreadsheet_id=...&sheet_name=Envíos

# Escribir datos
POST /api/google-sheets/write
{
  "spreadsheet_id": "...",
  "sheet_name": "...",
  "data": [[...]],
  "start_cell": "A1"
}

# Agregar filas
POST /api/google-sheets/append
```

---

## Configuración de Credenciales (Avanzado)

Para sincronización automática desde el backend, necesitas credenciales de Google Cloud:

### Paso 1: Crear Proyecto en Google Cloud

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto o seleccionar uno existente
3. Habilitar Google Sheets API y Google Drive API

### Paso 2: Crear Cuenta de Servicio

1. IAM & Admin → Service Accounts
2. Create Service Account
3. Descargar JSON de credenciales

### Paso 3: Compartir Spreadsheet

1. Abrir tu Google Sheet
2. Compartir con el email de la cuenta de servicio
3. Dar permisos de Editor

### Paso 4: Configurar en Litper Pro

Opción A: Variable de entorno
```bash
export GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

Opción B: Archivo de credenciales
```bash
GOOGLE_SHEETS_CREDENTIALS_PATH=/path/to/credentials.json
```

---

## Estructura de Datos

### Hoja: Envíos

| Columna | Campo | Ejemplo |
|---------|-------|---------|
| A | Guía | 123456789 |
| B | Transportadora | Coordinadora |
| C | Estado | Entregado |
| D | Ciudad | Bogotá |
| E | Días | 3 |
| F | Cliente | Juan Pérez |
| G | Teléfono | 3101234567 |
| H | Valor | 50000 |
| I | Novedad | No |
| J | Tipo Novedad | |
| K | Riesgo | NORMAL |
| L | Fecha Carga | 2024-01-15 |
| M | Última Actualización | 2024-01-18 |

### Hoja: Dashboard

| Fila | Métrica | Valor | Indicador |
|------|---------|-------|-----------|
| 2 | Total Envíos | 1500 | 📦 |
| 3 | Entregados | 1350 | ✅ |
| 4 | En Tránsito | 100 | 🚚 |
| 5 | Novedades | 50 | ⚠️ |
| 6 | Tasa de Éxito | 90% | 🟢 |

---

## Troubleshooting

### Error: "No se pudo conectar al spreadsheet"

**Causas posibles:**
1. ID del spreadsheet incorrecto
2. Spreadsheet no existe o fue eliminado
3. Sin permisos de acceso

**Solución:**
1. Verificar que el ID sea correcto (está en la URL)
2. Asegurar que el spreadsheet sea público o compartido

### Error: "Servicio no disponible"

**Causas posibles:**
1. Credenciales de servicio no configuradas
2. API de Google Sheets no habilitada
3. Cuota de API excedida

**Solución:**
1. Verificar configuración de credenciales
2. Habilitar API en Google Cloud Console
3. Esperar o aumentar cuota

### Los datos no se actualizan

**Causas posibles:**
1. Sincronización manual requerida
2. Auto-sync deshabilitado
3. Error silencioso en sincronización

**Solución:**
1. Clic en "Sincronizar" manualmente
2. Habilitar auto-sync en configuración
3. Revisar historial de sincronización

---

## Roadmap Futuro

- [ ] Webhooks para cambios en tiempo real
- [ ] Sincronización bidireccional (Sheets → App)
- [ ] Integración con Apps Script
- [ ] Reportes automáticos por email
- [ ] Gráficos nativos de Sheets
- [ ] Alertas desde fórmulas

---

## Soporte

Para problemas o sugerencias, contactar al equipo de desarrollo de Litper Pro.
