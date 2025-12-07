# Disaster Recovery - Litper

## Visión General

El sistema de Disaster Recovery de Litper garantiza la continuidad del negocio con RPO de 15 minutos y RTO de 30 minutos.

## Objetivos

| Métrica | Objetivo |
|---------|----------|
| RPO (Recovery Point Objective) | 15 minutos |
| RTO (Recovery Time Objective) | 30 minutos |
| Disponibilidad | 99.9% |

## Arquitectura Multi-Región

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REGIÓN PRIMARIA (us-east-1)                   │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ PostgreSQL  │  │   Redis     │  │    S3       │                  │
│  │  Primary    │  │   Master    │  │   Bucket    │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
│         │                │                │                          │
└─────────┼────────────────┼────────────────┼──────────────────────────┘
          │                │                │
          │    Replicación │                │ Cross-Region
          │    Síncrona    │                │ Replication
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       REGIÓN SECUNDARIA (us-west-2)                  │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ PostgreSQL  │  │   Redis     │  │    S3       │                  │
│  │  Standby    │  │   Slave     │  │   Replica   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Estrategia de Backups

### PostgreSQL

| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Full Backup | Diario 3AM | 7 días |
| Incremental | Cada hora | 24 horas |
| WAL (Point-in-Time) | Continuo | 7 días |
| Weekly | Lunes 3AM | 4 semanas |
| Monthly | Día 1, 3AM | 12 meses |

### Proceso de Backup

```python
from backend.disaster_recovery import BackupManager

manager = BackupManager(config={
    "db_host": "postgres.litper.co",
    "db_name": "litper",
    "backup_bucket": "litper-backups",
    "retention": {
        "daily": 7,
        "weekly": 4,
        "monthly": 12
    }
})

# Backup completo
await manager.backup_postgresql_full()

# Verificar integridad
result = await manager.verify_backup("postgresql_full", "postgresql_full_20240115.dump")
```

### Verificación de Backups

```python
# Verificación automática
verification = await manager.verify_backup(
    backup_type="postgresql_full",
    backup_file="postgresql_full_20240115.dump"
)

# Checks realizados:
# 1. Archivo existe en S3
# 2. Checksum SHA256 coincide
# 3. Dump es legible (pg_restore -l)
```

## Procedimiento de Failover

### Pasos de Failover

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PROCESO DE FAILOVER                              │
│                                                                       │
│  1. DETECTAR                                                         │
│     └─▶ Health check falla 3 veces consecutivas                     │
│                                                                       │
│  2. DECIDIR                                                          │
│     └─▶ Evaluar si es problema temporal o permanente                │
│                                                                       │
│  3. DETENER ESCRITURAS                                               │
│     └─▶ Poner aplicación en modo read-only                          │
│                                                                       │
│  4. SINCRONIZAR                                                      │
│     └─▶ Asegurar réplica está al día                                │
│                                                                       │
│  5. PROMOVER                                                         │
│     └─▶ Promover réplica a primario                                 │
│                                                                       │
│  6. ACTIVAR SERVICIOS                                                │
│     └─▶ Iniciar servicios en región secundaria                      │
│                                                                       │
│  7. DNS                                                              │
│     └─▶ Actualizar DNS a nueva región                               │
│                                                                       │
│  8. VALIDAR                                                          │
│     └─▶ Verificar funcionamiento completo                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Código de Failover

```python
from backend.disaster_recovery import FailoverOrchestrator

orchestrator = FailoverOrchestrator(
    primary_region="us-east-1",
    secondary_region="us-west-2",
    config=failover_config
)

# Ejecutar failover
result = await orchestrator.execute_failover(
    reason="Database server unresponsive",
    initiated_by="auto"  # o "manual"
)

# Resultado:
# {
#     "status": "completed",
#     "steps_completed": [...],
#     "new_primary": "us-west-2",
#     "total_time_seconds": 847
# }
```

## Restauración

### Desde Backup

```python
# Restaurar último backup
await manager.restore_postgresql()

# Restaurar backup específico
await manager.restore_postgresql(
    backup_file="postgresql_full_20240115_030000.dump"
)
```

### Point-in-Time Recovery (PITR)

```python
from datetime import datetime

# Restaurar a momento específico
await manager.restore_postgresql(
    point_in_time=datetime(2024, 1, 15, 14, 30, 0)
)

# Útil para:
# - Recuperar datos borrados accidentalmente
# - Revertir cambios problemáticos
# - Investigar estado histórico
```

## Monitoreo DR

### Health Checks

```python
# Verificación continua
health = await orchestrator.check_health()
# {
#     "primary": {
#         "database": "healthy",
#         "redis": "healthy",
#         "services": "healthy"
#     },
#     "secondary": {
#         "database": "healthy",
#         "redis": "healthy",
#         "services": "standby"
#     },
#     "replication_lag_seconds": 0.5
# }
```

### Alertas DR

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| ReplicationLagHigh | Lag > 60s | High |
| BackupFailed | Backup falló | Critical |
| BackupVerificationFailed | Verificación falló | Critical |
| SecondaryUnreachable | Región secundaria caída | Critical |

## Plan de Pruebas DR

### Pruebas Mensuales

1. **Restauración de Backup**
   - Restaurar backup en ambiente de prueba
   - Verificar integridad de datos
   - Medir tiempo de restauración

2. **Failover Simulado**
   - Ejecutar failover a región secundaria
   - Verificar todos los servicios
   - Ejecutar failback

### Pruebas Trimestrales

1. **DR Completo**
   - Simular caída total de región primaria
   - Ejecutar procedimiento completo
   - Medir RTO real

## Runbooks

### Runbook: Base de Datos Caída

```markdown
1. Verificar conectividad: ping postgres.litper.co
2. Revisar logs: kubectl logs postgres-0
3. Si no responde en 2 minutos, iniciar failover
4. Notificar a equipo: #alerts-critical
5. Documentar incidente en Jira
```

### Runbook: Failover Manual

```markdown
1. Confirmar que failover es necesario
2. Notificar a stakeholders
3. Ejecutar: python -m disaster_recovery.failover
4. Monitorear progreso en dashboard
5. Verificar servicios post-failover
6. Actualizar status page
```

## Limpieza de Backups

```python
# Ejecutar limpieza según política de retención
deleted = await manager.cleanup_old_backups()
# {"daily": 5, "weekly": 2, "monthly": 0}
```

## Archivos de Implementación

- `backend/disaster_recovery/backup_manager.py`: Gestión de backups
- `backend/disaster_recovery/failover.py`: Orquestación de failover
