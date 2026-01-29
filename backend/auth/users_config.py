"""
CONFIGURACIÓN DE USUARIOS - BACKEND
====================================

Este archivo contiene la configuración de usuarios.
Las contraseñas se cargan desde variables de entorno.

IMPORTANTE: Este archivo NO debe exponerse al frontend.
"""

import os
from typing import List, Dict

def get_users_config() -> List[Dict]:
    """
    Obtiene la configuración de usuarios con sus contraseñas.
    Las contraseñas vienen de variables de entorno para seguridad.
    """
    return [
        # Chat & Atención
        {
            "id": "litper_karen_001",
            "email": "karenlitper@gmail.com",
            "nombre": "Karen",
            "rol": "operador",
            "activo": True,
            "password": os.getenv("LITPER_PASS_KAREN", "LP.CAROLINA_2024?Jm"),
        },
        {
            "id": "litper_dayana_002",
            "email": "litperdayana@gmail.com",
            "nombre": "Dayana",
            "rol": "operador",
            "activo": True,
            "password": os.getenv("LITPER_PASS_DAYANA", "tELLEZ_LITper2025Angie?"),
        },
        {
            "id": "litper_david_003",
            "email": "litperdavid@gmail.com",
            "nombre": "David",
            "rol": "operador",
            "activo": True,
            "password": os.getenv("LITPER_PASS_DAVID", "2025NORMAN_?litper"),
        },
        # Tracking & Envíos
        {
            "id": "litper_felipe_004",
            "email": "felipelitper@gmail.com",
            "nombre": "Felipe",
            "rol": "operador",
            "activo": True,
            "password": os.getenv("LITPER_PASS_FELIPE", "2025?LITper.FELIPE"),
        },
        {
            "id": "litper_jimmy_005",
            "email": "jimmylitper@gmail.com",
            "nombre": "Jimmy",
            "rol": "operador",
            "activo": True,
            "password": os.getenv("LITPER_PASS_JIMMY", "20.25_JIMMY.LITper?"),
        },
        {
            "id": "litper_jhonnatan_006",
            "email": "jhonnatanlitper@gmail.com",
            "nombre": "Jhonnatan",
            "rol": "operador",
            "activo": True,
            "password": os.getenv("LITPER_PASS_JHONNATAN", "2025_EVAN10?LITper.?"),
        },
        # Administración
        {
            "id": "litper_daniel_007",
            "email": "daniellitper@gmail.com",
            "nombre": "Daniel",
            "rol": "admin",
            "activo": True,
            "password": os.getenv("LITPER_PASS_DANIEL", "ALEJANDRA_?2025Litper"),
        },
        {
            "id": "litper_maletas_008",
            "email": "maletaslitper@gmail.com",
            "nombre": "Maletas",
            "rol": "admin",
            "activo": True,
            "password": os.getenv("LITPER_PASS_MALETAS", "2025_KAREN.litper10?"),
        },
        {
            "id": "litper_colombia_009",
            "email": "litpercolombia@gmail.com",
            "nombre": "Litper Colombia",
            "rol": "admin",
            "activo": True,
            "password": os.getenv("LITPER_PASS_COLOMBIA", "?2024LP.JEferMoreno?"),
        },
    ]


# Diccionario para búsqueda rápida por email
_users_by_email = None

def get_user_by_email(email: str) -> Dict | None:
    """Obtiene un usuario por su email."""
    global _users_by_email
    if _users_by_email is None:
        _users_by_email = {u["email"].lower(): u for u in get_users_config()}
    return _users_by_email.get(email.lower())
