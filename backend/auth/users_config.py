"""
CONFIGURACIÓN DE USUARIOS - BACKEND
====================================

Este archivo contiene la configuración de usuarios.
En producción, estos datos deben venir de una base de datos.

IMPORTANTE: Este archivo NO debe exponerse al frontend.
"""

import os
from typing import List, Dict
from datetime import datetime

# Los usuarios se cargan desde variables de entorno o base de datos
# Por ahora, configuración inicial (en producción usar DB)

def get_users_config() -> List[Dict]:
    """
    Obtiene la configuración de usuarios.
    En producción, esto debería venir de una base de datos.
    """
    # Contraseña maestra desde env (para desarrollo)
    master_password = os.getenv("LITPER_MASTER_PASSWORD", "LitperSecure2025!")

    return [
        {
            "id": "litper_karen_001",
            "email": "karenlitper@gmail.com",
            "nombre": "Karen",
            "rol": "operador",
            "activo": True,
        },
        {
            "id": "litper_dayana_002",
            "email": "litperdayana@gmail.com",
            "nombre": "Dayana",
            "rol": "operador",
            "activo": True,
        },
        {
            "id": "litper_david_003",
            "email": "litperdavid@gmail.com",
            "nombre": "David",
            "rol": "operador",
            "activo": True,
        },
        {
            "id": "litper_felipe_004",
            "email": "felipelitper@gmail.com",
            "nombre": "Felipe",
            "rol": "operador",
            "activo": True,
        },
        {
            "id": "litper_jimmy_005",
            "email": "jimmylitper@gmail.com",
            "nombre": "Jimmy",
            "rol": "operador",
            "activo": True,
        },
        {
            "id": "litper_jhonnatan_006",
            "email": "jhonnatanlitper@gmail.com",
            "nombre": "Jhonnatan",
            "rol": "operador",
            "activo": True,
        },
        {
            "id": "litper_daniel_007",
            "email": "daniellitper@gmail.com",
            "nombre": "Daniel",
            "rol": "admin",
            "activo": True,
        },
        {
            "id": "litper_maletas_008",
            "email": "maletaslitper@gmail.com",
            "nombre": "Maletas",
            "rol": "admin",
            "activo": True,
        },
        {
            "id": "litper_colombia_009",
            "email": "litpercolombia@gmail.com",
            "nombre": "Litper Colombia",
            "rol": "admin",
            "activo": True,
        },
    ]
