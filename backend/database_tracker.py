"""
Base de datos SQLite para LITPER Tracker
Almacenamiento persistente de usuarios y rondas
"""

import sqlite3
import json
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pathlib import Path
from loguru import logger

# Ruta de la base de datos
DB_PATH = Path(__file__).parent / "data" / "tracker.db"

def get_connection():
    """Obtiene conexión a la base de datos"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Inicializa las tablas de la base de datos"""
    conn = get_connection()
    cursor = conn.cursor()

    # Tabla de usuarios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            avatar TEXT DEFAULT '😊',
            color TEXT DEFAULT '#F59E0B',
            meta_diaria INTEGER DEFAULT 50,
            activo INTEGER DEFAULT 1,
            password_hash TEXT,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tabla de rondas de guías
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rondas_guias (
            id TEXT PRIMARY KEY,
            usuario_id TEXT NOT NULL,
            usuario_nombre TEXT,
            numero INTEGER,
            fecha TEXT NOT NULL,
            hora_inicio TEXT,
            hora_fin TEXT,
            tiempo_usado INTEGER DEFAULT 0,
            pedidos_iniciales INTEGER DEFAULT 0,
            realizado INTEGER DEFAULT 0,
            cancelado INTEGER DEFAULT 0,
            agendado INTEGER DEFAULT 0,
            dificiles INTEGER DEFAULT 0,
            pendientes INTEGER DEFAULT 0,
            revisado INTEGER DEFAULT 0,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    """)

    # Tabla de rondas de novedades
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rondas_novedades (
            id TEXT PRIMARY KEY,
            usuario_id TEXT NOT NULL,
            usuario_nombre TEXT,
            numero INTEGER,
            fecha TEXT NOT NULL,
            hora_inicio TEXT,
            hora_fin TEXT,
            tiempo_usado INTEGER DEFAULT 0,
            revisadas INTEGER DEFAULT 0,
            solucionadas INTEGER DEFAULT 0,
            devolucion INTEGER DEFAULT 0,
            cliente INTEGER DEFAULT 0,
            transportadora INTEGER DEFAULT 0,
            litper INTEGER DEFAULT 0,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    """)

    # Tabla de configuración
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT
        )
    """)

    conn.commit()

    # Insertar usuarios iniciales si no existen
    usuarios_iniciales = [
        ("cat1", "CATALINA", "😊", "#F59E0B", 50),
        ("ang1", "ANGIE", "😊", "#F59E0B", 50),
        ("car1", "CAROLINA", "😊", "#F59E0B", 50),
        ("ale1", "ALEJANDRA", "😊", "#F59E0B", 50),
        ("eva1", "EVAN", "😊", "#F59E0B", 50),
        ("jim1", "JIMMY", "😊", "#F59E0B", 50),
        ("fel1", "FELIPE", "😊", "#F59E0B", 50),
        ("nor1", "NORMA", "😊", "#F59E0B", 50),
        ("kar1", "KAREN", "😊", "#F59E0B", 50),
    ]

    for uid, nombre, avatar, color, meta in usuarios_iniciales:
        cursor.execute("""
            INSERT OR IGNORE INTO usuarios (id, nombre, avatar, color, meta_diaria)
            VALUES (?, ?, ?, ?, ?)
        """, (uid, nombre, avatar, color, meta))

    conn.commit()
    conn.close()
    logger.info(f"📦 Base de datos inicializada en {DB_PATH}")

# ==================== USUARIOS ====================

def get_usuarios(activos_only: bool = True) -> List[Dict]:
    """Obtiene todos los usuarios"""
    conn = get_connection()
    cursor = conn.cursor()

    if activos_only:
        cursor.execute("SELECT * FROM usuarios WHERE activo = 1")
    else:
        cursor.execute("SELECT * FROM usuarios")

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def get_usuario(usuario_id: str) -> Optional[Dict]:
    """Obtiene un usuario por ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def crear_usuario(id: str, nombre: str, avatar: str = "😊", color: str = "#F59E0B",
                  meta_diaria: int = 50, password_hash: str = None) -> Dict:
    """Crea o actualiza un usuario"""
    conn = get_connection()
    cursor = conn.cursor()

    # Verificar si existe
    cursor.execute("SELECT id FROM usuarios WHERE id = ?", (id,))
    existe = cursor.fetchone()

    if existe:
        cursor.execute("""
            UPDATE usuarios SET nombre=?, avatar=?, color=?, meta_diaria=?, activo=1
            WHERE id=?
        """, (nombre, avatar, color, meta_diaria, id))
    else:
        cursor.execute("""
            INSERT INTO usuarios (id, nombre, avatar, color, meta_diaria, password_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (id, nombre, avatar, color, meta_diaria, password_hash))

    conn.commit()
    conn.close()

    return get_usuario(id)

def actualizar_usuario(usuario_id: str, datos: Dict) -> Optional[Dict]:
    """Actualiza un usuario"""
    conn = get_connection()
    cursor = conn.cursor()

    campos = []
    valores = []
    for campo, valor in datos.items():
        if campo in ['nombre', 'avatar', 'color', 'meta_diaria', 'activo', 'password_hash']:
            campos.append(f"{campo}=?")
            valores.append(valor)

    if campos:
        valores.append(usuario_id)
        cursor.execute(f"UPDATE usuarios SET {', '.join(campos)} WHERE id=?", valores)
        conn.commit()

    conn.close()
    return get_usuario(usuario_id)

def eliminar_usuario(usuario_id: str) -> bool:
    """Desactiva un usuario (soft delete)"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE usuarios SET activo = 0 WHERE id = ?", (usuario_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def verificar_password(usuario_id: str, password_hash: str) -> bool:
    """Verifica la contraseña de un usuario"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM usuarios WHERE id = ? AND activo = 1", (usuario_id,))
    row = cursor.fetchone()
    conn.close()

    if row and row['password_hash']:
        return row['password_hash'] == password_hash
    return True  # Si no tiene contraseña, permitir acceso

# ==================== RONDAS GUÍAS ====================

def crear_ronda_guias(data: Dict) -> Dict:
    """Crea una ronda de guías"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO rondas_guias (
            id, usuario_id, usuario_nombre, numero, fecha, hora_inicio, hora_fin,
            tiempo_usado, pedidos_iniciales, realizado, cancelado, agendado,
            dificiles, pendientes, revisado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get('id'), data.get('usuario_id'), data.get('usuario_nombre'),
        data.get('numero'), data.get('fecha'), data.get('hora_inicio'),
        data.get('hora_fin'), data.get('tiempo_usado', 0),
        data.get('pedidos_iniciales', 0), data.get('realizado', 0),
        data.get('cancelado', 0), data.get('agendado', 0),
        data.get('dificiles', 0), data.get('pendientes', 0), data.get('revisado', 0)
    ))

    conn.commit()
    conn.close()

    return {**data, 'tipo': 'guias'}

def get_rondas_guias(fecha: str = None, usuario_id: str = None) -> List[Dict]:
    """Obtiene rondas de guías con filtros"""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT *, 'guias' as tipo FROM rondas_guias WHERE 1=1"
    params = []

    if fecha:
        query += " AND fecha = ?"
        params.append(fecha)
    if usuario_id:
        query += " AND usuario_id = ?"
        params.append(usuario_id)

    query += " ORDER BY hora_inicio"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

# ==================== RONDAS NOVEDADES ====================

def crear_ronda_novedades(data: Dict) -> Dict:
    """Crea una ronda de novedades"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO rondas_novedades (
            id, usuario_id, usuario_nombre, numero, fecha, hora_inicio, hora_fin,
            tiempo_usado, revisadas, solucionadas, devolucion, cliente,
            transportadora, litper
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get('id'), data.get('usuario_id'), data.get('usuario_nombre'),
        data.get('numero'), data.get('fecha'), data.get('hora_inicio'),
        data.get('hora_fin'), data.get('tiempo_usado', 0),
        data.get('revisadas', 0), data.get('solucionadas', 0),
        data.get('devolucion', 0), data.get('cliente', 0),
        data.get('transportadora', 0), data.get('litper', 0)
    ))

    conn.commit()
    conn.close()

    return {**data, 'tipo': 'novedades'}

def get_rondas_novedades(fecha: str = None, usuario_id: str = None) -> List[Dict]:
    """Obtiene rondas de novedades con filtros"""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT *, 'novedades' as tipo FROM rondas_novedades WHERE 1=1"
    params = []

    if fecha:
        query += " AND fecha = ?"
        params.append(fecha)
    if usuario_id:
        query += " AND usuario_id = ?"
        params.append(usuario_id)

    query += " ORDER BY hora_inicio"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

# ==================== TODAS LAS RONDAS ====================

def get_todas_rondas(fecha: str = None, usuario_id: str = None) -> List[Dict]:
    """Obtiene todas las rondas (guías + novedades)"""
    guias = get_rondas_guias(fecha, usuario_id)
    novedades = get_rondas_novedades(fecha, usuario_id)

    todas = guias + novedades
    todas.sort(key=lambda x: x.get('hora_inicio', ''))
    return todas

def get_historial_rondas(usuario_id: str = None, dias: int = 30) -> List[Dict]:
    """Obtiene historial de rondas de los últimos N días"""
    conn = get_connection()
    cursor = conn.cursor()

    # Guías
    query_guias = """
        SELECT *, 'guias' as tipo FROM rondas_guias
        WHERE fecha >= date('now', ?)
    """
    params_guias = [f'-{dias} days']

    if usuario_id:
        query_guias += " AND usuario_id = ?"
        params_guias.append(usuario_id)

    cursor.execute(query_guias, params_guias)
    guias = [dict(row) for row in cursor.fetchall()]

    # Novedades
    query_novedades = """
        SELECT *, 'novedades' as tipo FROM rondas_novedades
        WHERE fecha >= date('now', ?)
    """
    params_novedades = [f'-{dias} days']

    if usuario_id:
        query_novedades += " AND usuario_id = ?"
        params_novedades.append(usuario_id)

    cursor.execute(query_novedades, params_novedades)
    novedades = [dict(row) for row in cursor.fetchall()]

    conn.close()

    todas = guias + novedades
    todas.sort(key=lambda x: (x.get('fecha', ''), x.get('hora_inicio', '')), reverse=True)
    return todas

# ==================== ESTADÍSTICAS ====================

def get_estadisticas_usuario(usuario_id: str, fecha: str = None) -> Dict:
    """Obtiene estadísticas de un usuario"""
    conn = get_connection()
    cursor = conn.cursor()

    fecha_filtro = fecha or date.today().isoformat()

    # Guías del día
    cursor.execute("""
        SELECT COUNT(*) as rondas, SUM(realizado) as total_realizado,
               SUM(cancelado) as total_cancelado, SUM(tiempo_usado) as tiempo_total
        FROM rondas_guias WHERE usuario_id = ? AND fecha = ?
    """, (usuario_id, fecha_filtro))
    guias = dict(cursor.fetchone())

    # Novedades del día
    cursor.execute("""
        SELECT COUNT(*) as rondas, SUM(solucionadas) as total_solucionadas,
               SUM(tiempo_usado) as tiempo_total
        FROM rondas_novedades WHERE usuario_id = ? AND fecha = ?
    """, (usuario_id, fecha_filtro))
    novedades = dict(cursor.fetchone())

    conn.close()

    return {
        'usuario_id': usuario_id,
        'fecha': fecha_filtro,
        'guias': {
            'rondas': guias['rondas'] or 0,
            'realizado': guias['total_realizado'] or 0,
            'cancelado': guias['total_cancelado'] or 0,
            'tiempo': guias['tiempo_total'] or 0,
        },
        'novedades': {
            'rondas': novedades['rondas'] or 0,
            'solucionadas': novedades['total_solucionadas'] or 0,
            'tiempo': novedades['tiempo_total'] or 0,
        }
    }

def get_ranking(fecha: str = None, tipo: str = 'guias') -> List[Dict]:
    """Obtiene ranking de usuarios por tipo de proceso"""
    conn = get_connection()
    cursor = conn.cursor()

    fecha_filtro = fecha or date.today().isoformat()

    if tipo == 'guias':
        cursor.execute("""
            SELECT usuario_id, usuario_nombre, COUNT(*) as rondas,
                   SUM(realizado) as total, SUM(tiempo_usado) as tiempo
            FROM rondas_guias WHERE fecha = ?
            GROUP BY usuario_id
            ORDER BY total DESC
        """, (fecha_filtro,))
    else:
        cursor.execute("""
            SELECT usuario_id, usuario_nombre, COUNT(*) as rondas,
                   SUM(solucionadas) as total, SUM(tiempo_usado) as tiempo
            FROM rondas_novedades WHERE fecha = ?
            GROUP BY usuario_id
            ORDER BY total DESC
        """, (fecha_filtro,))

    rows = cursor.fetchall()
    conn.close()

    ranking = []
    for i, row in enumerate(rows):
        ranking.append({
            'posicion': i + 1,
            'usuario_id': row['usuario_id'],
            'usuario_nombre': row['usuario_nombre'],
            'rondas': row['rondas'],
            'total': row['total'] or 0,
            'tiempo': row['tiempo'] or 0,
        })

    return ranking

def get_resumen_dia(fecha: str = None) -> Dict:
    """Obtiene resumen del día"""
    conn = get_connection()
    cursor = conn.cursor()

    fecha_filtro = fecha or date.today().isoformat()

    # Total guías
    cursor.execute("""
        SELECT COUNT(*) as rondas, SUM(realizado) as total, SUM(cancelado) as cancelados
        FROM rondas_guias WHERE fecha = ?
    """, (fecha_filtro,))
    guias = dict(cursor.fetchone())

    # Total novedades
    cursor.execute("""
        SELECT COUNT(*) as rondas, SUM(solucionadas) as total
        FROM rondas_novedades WHERE fecha = ?
    """, (fecha_filtro,))
    novedades = dict(cursor.fetchone())

    # Usuarios activos
    cursor.execute("""
        SELECT COUNT(DISTINCT usuario_id) as usuarios
        FROM (
            SELECT usuario_id FROM rondas_guias WHERE fecha = ?
            UNION
            SELECT usuario_id FROM rondas_novedades WHERE fecha = ?
        )
    """, (fecha_filtro, fecha_filtro))
    usuarios = cursor.fetchone()['usuarios']

    conn.close()

    return {
        'fecha': fecha_filtro,
        'usuarios_activos': usuarios or 0,
        'guias': {
            'rondas': guias['rondas'] or 0,
            'realizado': guias['total'] or 0,
            'cancelado': guias['cancelados'] or 0,
        },
        'novedades': {
            'rondas': novedades['rondas'] or 0,
            'solucionadas': novedades['total'] or 0,
        }
    }

# Inicializar base de datos al importar
init_database()
