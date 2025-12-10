"""
Sistema de Disaster Recovery para Litper
========================================

Este paquete contiene:
- BackupManager: Gestión de backups automáticos
- FailoverOrchestrator: Orquestación de failover

Uso:
    from disaster_recovery.backup_manager import BackupManager
    from disaster_recovery.failover import FailoverOrchestrator
"""

from .backup_manager import BackupManager
from .failover import FailoverOrchestrator, FailoverStatus

__all__ = [
    "BackupManager",
    "FailoverOrchestrator",
    "FailoverStatus",
]
