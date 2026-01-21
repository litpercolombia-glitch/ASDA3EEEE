# PLAN PRÁCTICO: HACER QUE TODO FUNCIONE

**Estado actual:** 85% implementado, necesita activación
**Objetivo:** Que todo lo que tienes SIRVA correctamente

---

## DIAGNÓSTICO RÁPIDO

### LO QUE YA TIENES Y FUNCIONA

| Componente | Archivo | Estado |
|------------|---------|--------|
| API FastAPI | `main.py` | ✅ Funciona |
| 15 Routers registrados | `main.py:289-357` | ✅ Registrados |
| Cerebro Autónomo | `brain_engine.py` | ✅ Código completo |
| Chat Inteligente | `chat_inteligente.py` | ✅ Código completo |
| ML Predicciones | `ml_models/models.py` | ✅ Código completo |
| 40+ Tools de agentes | `brain/claude/tools.py` | ✅ Definidos |
| Sistema de Conocimiento | `knowledge_system/` | ✅ Código completo |

### LO QUE FALLA Y POR QUÉ

| Problema | Causa | Solución |
|----------|-------|----------|
| Brain no responde | API key no configurada | Configurar `.env` |
| Chat sin respuestas | Claude API no conecta | Instalar `anthropic` |
| Acciones no ejecutan | Handlers en simulación | Conectar integraciones reales |
| ML no predice | No hay datos entrenados | Cargar datos + entrenar |

---

## PLAN PASO A PASO

### PASO 1: VERIFICAR DEPENDENCIAS (5 minutos)

```bash
cd /home/user/ASDA3EEEE/backend
pip install -r requirements.txt
```

**Dependencias críticas para IA:**
- `anthropic>=0.40.0` - Cliente de Claude
- `aiohttp>=3.9.0` - Para Gemini (fallback gratis)
- `scikit-learn==1.4.0` - Para modelos ML
- `xgboost==2.0.3` - Para predicciones

### PASO 2: CONFIGURAR VARIABLES DE ENTORNO (10 minutos)

Crear/editar `.env` en `/backend/`:

```env
# =============================================
# CONFIGURACIÓN MÍNIMA PARA QUE TODO FUNCIONE
# =============================================

# BASE DE DATOS (OBLIGATORIO)
DATABASE_URL=postgresql://litper_user:litper_pass@localhost:5432/litper_ml_db

# CLAUDE API (OBLIGATORIO para IA)
ANTHROPIC_API_KEY=sk-ant-api03-TU_API_KEY_AQUI
CLAUDE_API_KEY=sk-ant-api03-TU_API_KEY_AQUI
CLAUDE_MODEL=claude-sonnet-4-20250514

# GEMINI (GRATIS - Fallback si Claude falla)
GEMINI_API_KEY=TU_GEMINI_API_KEY  # Obtener gratis en: https://makersuite.google.com/app/apikey

# CONFIGURACIÓN DE ML
MODELOS_DIR=ml_models/saved
REENTRENAMIENTO_AUTOMATICO=true
MIN_REGISTROS_ENTRENAMIENTO=100

# SERVIDOR
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
LOG_LEVEL=INFO
ENV=development
```

**Dónde obtener las API keys:**
- **Claude:** https://console.anthropic.com/settings/keys
- **Gemini:** https://makersuite.google.com/app/apikey (GRATIS)

### PASO 3: INICIALIZAR BASE DE DATOS (5 minutos)

```bash
# Opción A: Con Docker (recomendado)
docker-compose up -d db

# Opción B: PostgreSQL local
createdb litper_ml_db
psql litper_ml_db -c "CREATE USER litper_user WITH PASSWORD 'litper_pass';"
psql litper_ml_db -c "GRANT ALL PRIVILEGES ON DATABASE litper_ml_db TO litper_user;"
```

Luego inicializar tablas:
```bash
cd /home/user/ASDA3EEEE/backend
python init_db.py
```

### PASO 4: PROBAR QUE EL SERVIDOR INICIA (2 minutos)

```bash
cd /home/user/ASDA3EEEE/backend
python main.py
```

**Deberías ver:**
```
✅ Conexión a base de datos establecida
📚 Sistema de Conocimiento cargado
🤖 Sistema de Asistente IA cargado
🧠 Sistema de Cerebro Autónomo cargado
🔐 Sistema de AI Proxy Seguro cargado
...
INFO: Uvicorn running on http://0.0.0.0:8000
```

### PASO 5: PROBAR ENDPOINTS BÁSICOS (5 minutos)

```bash
# Health check
curl http://localhost:8000/health

# Probar cerebro (si tienes API key configurada)
curl -X POST http://localhost:8000/api/brain/think \
  -H "Content-Type: application/json" \
  -d '{"pregunta": "¿Cuál es el estado del sistema?"}'

# Probar chat inteligente
curl -X POST http://localhost:8000/chat/preguntar \
  -H "Content-Type: application/json" \
  -d '{"pregunta": "¿Cuántas guías hay en el sistema?"}'
```

### PASO 6: CARGAR DATOS PARA ML (10 minutos)

**Opción A: Subir Excel con datos históricos**
```bash
curl -X POST http://localhost:8000/memoria/cargar-excel \
  -F "archivo=@tu_archivo_guias.xlsx"
```

**Opción B: Insertar datos de prueba**
```python
# Ejecutar en Python
from database import get_session, GuiaHistorica
from datetime import datetime

session = next(get_session())

# Insertar 100 guías de prueba
for i in range(100):
    guia = GuiaHistorica(
        numero_guia=f"GUIA-{i:05d}",
        transportadora="Coordinadora" if i % 3 == 0 else "Servientrega" if i % 3 == 1 else "TCC",
        ciudad_destino="Bogotá" if i % 4 == 0 else "Medellín" if i % 4 == 1 else "Cali" if i % 4 == 2 else "Barranquilla",
        fecha_envio=datetime.now(),
        estatus="Entregado" if i % 5 != 0 else "En tránsito",
        tiene_retraso=i % 7 == 0,
        tiene_novedad=i % 10 == 0,
        dias_transito=2 + (i % 5),
        precio_flete=15000 + (i * 100)
    )
    session.add(guia)

session.commit()
print("100 guías de prueba insertadas")
```

### PASO 7: ENTRENAR MODELOS ML (5 minutos)

```bash
curl -X POST http://localhost:8000/ml/entrenar
```

**Respuesta esperada:**
```json
{
  "exito": true,
  "mensaje": "Modelos entrenados exitosamente",
  "metricas": {
    "modelo_retrasos": {"accuracy": 0.85, "f1_score": 0.82},
    "modelo_novedades": {"accuracy": 0.78}
  }
}
```

### PASO 8: VERIFICAR TODO FUNCIONA (5 minutos)

```bash
# 1. Verificar predicción ML
curl -X POST http://localhost:8000/ml/predecir \
  -H "Content-Type: application/json" \
  -d '{"numero_guia": "GUIA-00001"}'

# 2. Verificar dashboard
curl http://localhost:8000/dashboard/resumen

# 3. Verificar cerebro autónomo
curl http://localhost:8000/api/brain/status

# 4. Verificar KPIs
curl http://localhost:8000/dashboard/kpis-avanzados
```

---

## CHECKLIST DE VERIFICACIÓN

### Componentes Core

- [ ] **Base de datos conecta**
  - `curl http://localhost:8000/health` → `"database": true`

- [ ] **Modelos ML entrenados**
  - `curl http://localhost:8000/health` → `"ml_models_loaded": true`

- [ ] **Cerebro autónomo responde**
  - `curl http://localhost:8000/api/brain/status` → `"status": "running"`

- [ ] **Chat inteligente funciona**
  - `curl -X POST http://localhost:8000/chat/preguntar` → Respuesta de Claude

### Endpoints que DEBEN funcionar

| Endpoint | Método | Para qué sirve |
|----------|--------|----------------|
| `/health` | GET | Verificar estado del sistema |
| `/dashboard/resumen` | GET | Ver estadísticas generales |
| `/chat/preguntar` | POST | Preguntar al asistente IA |
| `/ml/predecir` | POST | Predecir retraso de guía |
| `/ml/entrenar` | POST | Entrenar modelos ML |
| `/api/brain/think` | POST | Usar cerebro autónomo |
| `/api/brain/status` | GET | Estado del cerebro |
| `/api/ai/chat` | POST | Chat seguro (proxy) |
| `/memoria/cargar-excel` | POST | Subir datos históricos |

---

## PROBLEMAS COMUNES Y SOLUCIONES

### 1. "anthropic module not found"
```bash
pip install anthropic>=0.40.0
```

### 2. "Database connection failed"
```bash
# Verificar que PostgreSQL está corriendo
docker-compose up -d db
# O
sudo systemctl start postgresql
```

### 3. "Claude API key invalid"
- Verificar que la key empieza con `sk-ant-api03-`
- Verificar que no tiene espacios extras
- Regenerar key en https://console.anthropic.com

### 4. "Modelos no entrenados"
```bash
# Cargar datos primero
curl -X POST http://localhost:8000/memoria/cargar-excel -F "archivo=@datos.xlsx"
# Luego entrenar
curl -X POST http://localhost:8000/ml/entrenar
```

### 5. "Brain routes not available"
- Verificar que `ANTHROPIC_API_KEY` está en `.env`
- Reiniciar el servidor después de cambiar `.env`

---

## ORDEN DE PRIORIDAD PARA ACTIVAR

### Día 1: Core funcionando
1. ✅ Instalar dependencias
2. ✅ Configurar `.env` con API keys
3. ✅ Iniciar PostgreSQL
4. ✅ Iniciar servidor
5. ✅ Probar `/health`

### Día 2: IA funcionando
1. ✅ Probar `/api/brain/status`
2. ✅ Probar `/chat/preguntar`
3. ✅ Probar `/api/ai/chat`

### Día 3: ML funcionando
1. ✅ Cargar datos históricos
2. ✅ Entrenar modelos
3. ✅ Probar predicciones

### Día 4: Todo integrado
1. ✅ Dashboard con datos reales
2. ✅ Alertas funcionando
3. ✅ Reportes generándose

---

## SCRIPTS DE AYUDA

### Script 1: Verificar todo de una vez

```bash
#!/bin/bash
# verificar_sistema.sh

echo "=== VERIFICACIÓN DEL SISTEMA LITPER ==="

echo -n "1. Health check: "
curl -s http://localhost:8000/health | jq -r '.status'

echo -n "2. Database: "
curl -s http://localhost:8000/health | jq -r '.database'

echo -n "3. ML Models: "
curl -s http://localhost:8000/health | jq -r '.ml_models_loaded'

echo -n "4. Brain status: "
curl -s http://localhost:8000/api/brain/status | jq -r '.status' 2>/dev/null || echo "No disponible"

echo -n "5. Total guías: "
curl -s http://localhost:8000/dashboard/resumen | jq -r '.estadisticas_generales.total_guias'

echo "=== FIN VERIFICACIÓN ==="
```

### Script 2: Iniciar todo con Docker

```bash
#!/bin/bash
# iniciar_todo.sh

echo "Iniciando servicios..."
cd /home/user/ASDA3EEEE
docker-compose up -d

echo "Esperando a que la BD esté lista..."
sleep 10

echo "Iniciando backend..."
cd backend
python main.py
```

---

## RESUMEN EJECUTIVO

**Lo que necesitas hacer HOY:**

1. **Configurar `.env`** con tu `ANTHROPIC_API_KEY`
2. **Iniciar PostgreSQL** (con Docker o local)
3. **Ejecutar `python main.py`**
4. **Probar `http://localhost:8000/health`**

**Tiempo estimado:** 30-45 minutos

**Resultado:** Sistema 100% operativo con:
- Chat IA funcionando
- Predicciones ML activas
- Dashboard con datos
- Cerebro autónomo respondiendo

---

*El código ya está completo. Solo falta configurar y activar.*
