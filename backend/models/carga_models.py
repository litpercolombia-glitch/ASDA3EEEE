# backend/models/carga_models.py
# Modelos SQLAlchemy para el sistema de cargas

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, date
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class Usuario(Base):
    """Modelo de usuario del sistema"""
    __tablename__ = "usuarios"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="operador")  # admin, operador, viewer
    avatar = Column(String(500))
    activo = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # Relaciones
    cargas = relationship("Carga", back_populates="usuario")
    actividades = relationship("ActividadUsuario", back_populates="usuario")


class Carga(Base):
    """Modelo de carga (batch de guías)"""
    __tablename__ = "cargas"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    fecha = Column(Date, nullable=False, index=True)
    numero_carga = Column(Integer, nullable=False)
    nombre = Column(String(200), nullable=False)

    # Usuario que creó la carga
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False, index=True)

    # Estadísticas
    total_guias = Column(Integer, default=0)
    entregadas = Column(Integer, default=0)
    en_transito = Column(Integer, default=0)
    con_novedad = Column(Integer, default=0)
    devueltas = Column(Integer, default=0)
    porcentaje_entrega = Column(Float, default=0)
    dias_promedio_transito = Column(Float, default=0)

    # Estado
    estado = Column(String(20), default="activa")  # activa, cerrada, archivada

    # Metadata
    notas = Column(Text)
    tags = Column(JSON)  # Lista de tags
    stats_transportadoras = Column(JSON)  # {transportadora: count}
    stats_ciudades = Column(JSON)  # {ciudad: count}

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime)

    # Relaciones
    usuario = relationship("Usuario", back_populates="cargas")
    guias = relationship("GuiaCarga", back_populates="carga", cascade="all, delete-orphan")

    # Índices compuestos
    __table_args__ = (
        Index('idx_carga_fecha_usuario', 'fecha', 'usuario_id'),
        Index('idx_carga_estado', 'estado'),
    )


class GuiaCarga(Base):
    """Modelo de guía dentro de una carga"""
    __tablename__ = "guias_carga"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    carga_id = Column(String(100), ForeignKey("cargas.id"), nullable=False, index=True)

    # Datos principales
    numero_guia = Column(String(50), nullable=False, index=True)
    estado = Column(String(100), nullable=False, index=True)
    transportadora = Column(String(100), index=True)
    ciudad_destino = Column(String(100), index=True)

    # Datos del cliente
    telefono = Column(String(50))
    nombre_cliente = Column(String(200))
    direccion = Column(Text)

    # Tracking
    dias_transito = Column(Integer, default=0)
    tiene_novedad = Column(Boolean, default=False, index=True)
    tipo_novedad = Column(String(100))
    descripcion_novedad = Column(Text)

    # Valores
    valor_declarado = Column(Float)

    # Fechas
    fecha_generacion = Column(DateTime)
    fecha_ultimo_movimiento = Column(DateTime)
    ultimo_movimiento = Column(Text)

    # Historial y metadata
    historial_eventos = Column(JSON)  # Lista de eventos
    fuente = Column(String(20))  # PHONES, REPORT, SUMMARY, EXCEL, MANUAL
    datos_extra = Column(JSON)  # Datos adicionales

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación
    carga = relationship("Carga", back_populates="guias")

    # Índices
    __table_args__ = (
        Index('idx_guia_carga_estado', 'carga_id', 'estado'),
        Index('idx_guia_transportadora', 'transportadora'),
    )


class ActividadUsuario(Base):
    """Log de actividad de usuarios"""
    __tablename__ = "actividad_usuarios"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False, index=True)

    tipo = Column(String(50), nullable=False, index=True)  # login, logout, carga_creada, etc.
    descripcion = Column(String(500))

    # Metadata
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    metadata = Column(JSON)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relación
    usuario = relationship("Usuario", back_populates="actividades")


# Esquemas Pydantic para la API
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime as dt


class GuiaCargaCreate(BaseModel):
    numero_guia: str
    estado: str
    transportadora: Optional[str] = None
    ciudad_destino: Optional[str] = None
    telefono: Optional[str] = None
    nombre_cliente: Optional[str] = None
    direccion: Optional[str] = None
    dias_transito: int = 0
    tiene_novedad: bool = False
    tipo_novedad: Optional[str] = None
    descripcion_novedad: Optional[str] = None
    valor_declarado: Optional[float] = None
    fuente: str = "MANUAL"
    datos_extra: Optional[Dict[str, Any]] = None


class GuiaCargaResponse(BaseModel):
    id: str
    numero_guia: str
    estado: str
    transportadora: Optional[str]
    ciudad_destino: Optional[str]
    telefono: Optional[str]
    nombre_cliente: Optional[str]
    dias_transito: int
    tiene_novedad: bool
    fuente: str
    created_at: dt

    class Config:
        from_attributes = True


class CargaCreate(BaseModel):
    fecha: Optional[date] = None
    notas: Optional[str] = None
    tags: Optional[List[str]] = None


class CargaUpdate(BaseModel):
    notas: Optional[str] = None
    tags: Optional[List[str]] = None
    estado: Optional[str] = None


class CargaStats(BaseModel):
    total_guias: int
    entregadas: int
    en_transito: int
    con_novedad: int
    devueltas: int
    porcentaje_entrega: float
    dias_promedio_transito: float
    transportadoras: Dict[str, int]
    ciudades: Dict[str, int]


class CargaResponse(BaseModel):
    id: str
    fecha: date
    numero_carga: int
    nombre: str
    usuario_id: str
    usuario_nombre: Optional[str] = None
    total_guias: int
    estado: str
    stats: CargaStats
    notas: Optional[str]
    tags: Optional[List[str]]
    created_at: dt
    updated_at: dt
    closed_at: Optional[dt]

    class Config:
        from_attributes = True


class CargaListResponse(BaseModel):
    id: str
    fecha: date
    numero_carga: int
    nombre: str
    usuario_nombre: str
    total_guias: int
    entregadas: int
    con_novedad: int
    estado: str
    created_at: dt


class CargaDiaResponse(BaseModel):
    fecha: date
    cargas: List[CargaListResponse]
    total_guias: int
    total_cargas: int


class HistorialResponse(BaseModel):
    fechas: List[CargaDiaResponse]
    total_cargas: int
    total_guias: int


class FiltrosCarga(BaseModel):
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    usuario_id: Optional[str] = None
    estado: Optional[str] = None
    busqueda: Optional[str] = None
    transportadora: Optional[str] = None
    ciudad_destino: Optional[str] = None
    solo_con_novedad: bool = False


class UsuarioCreate(BaseModel):
    email: str
    nombre: str
    password: str
    rol: str = "operador"


class UsuarioResponse(BaseModel):
    id: str
    email: str
    nombre: str
    rol: str
    activo: bool
    created_at: dt
    last_login: Optional[dt]

    class Config:
        from_attributes = True
