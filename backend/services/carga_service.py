# backend/services/carga_service.py
# Servicio para gestionar cargas en la base de datos

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
import logging

from ..models.carga_models import (
    Carga, GuiaCarga, Usuario, ActividadUsuario,
    CargaCreate, CargaUpdate, GuiaCargaCreate, FiltrosCarga,
    CargaStats, CargaResponse, CargaListResponse, CargaDiaResponse, HistorialResponse
)

logger = logging.getLogger(__name__)


class CargaServiceDB:
    """Servicio para operaciones de cargas en BD"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== CARGAS ====================

    def crear_carga(self, usuario_id: str, data: CargaCreate = None) -> Carga:
        """Crear una nueva carga"""
        fecha = data.fecha if data and data.fecha else date.today()

        # Contar cargas del día para este usuario
        cargas_del_dia = self.db.query(Carga).filter(
            and_(Carga.fecha == fecha, Carga.usuario_id == usuario_id)
        ).count()

        numero_carga = cargas_del_dia + 1

        # Obtener nombre del usuario
        usuario = self.db.query(Usuario).filter(Usuario.id == usuario_id).first()
        usuario_nombre = usuario.nombre if usuario else "Usuario"

        # Formatear nombre de la carga
        fecha_str = fecha.strftime("%d-%b-%Y")
        nombre = f"{fecha_str} Carga #{numero_carga}"

        carga = Carga(
            fecha=fecha,
            numero_carga=numero_carga,
            nombre=nombre,
            usuario_id=usuario_id,
            notas=data.notas if data else None,
            tags=data.tags if data else None,
            estado="activa"
        )

        self.db.add(carga)
        self.db.commit()
        self.db.refresh(carga)

        # Registrar actividad
        self._registrar_actividad(usuario_id, "carga_creada", f"Creó carga {nombre}", {
            "carga_id": carga.id,
            "fecha": str(fecha)
        })

        return carga

    def obtener_carga(self, carga_id: str) -> Optional[Carga]:
        """Obtener una carga por ID"""
        return self.db.query(Carga).filter(Carga.id == carga_id).first()

    def actualizar_carga(self, carga_id: str, data: CargaUpdate) -> Optional[Carga]:
        """Actualizar una carga"""
        carga = self.obtener_carga(carga_id)
        if not carga:
            return None

        if data.notas is not None:
            carga.notas = data.notas
        if data.tags is not None:
            carga.tags = data.tags
        if data.estado is not None:
            carga.estado = data.estado
            if data.estado == "cerrada":
                carga.closed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(carga)

        return carga

    def cerrar_carga(self, carga_id: str) -> bool:
        """Cerrar una carga"""
        carga = self.obtener_carga(carga_id)
        if not carga:
            return False

        carga.estado = "cerrada"
        carga.closed_at = datetime.utcnow()

        self.db.commit()

        self._registrar_actividad(carga.usuario_id, "carga_cerrada", f"Cerró carga {carga.nombre}", {
            "carga_id": carga.id
        })

        return True

    def eliminar_carga(self, carga_id: str) -> bool:
        """Eliminar una carga y sus guías"""
        carga = self.obtener_carga(carga_id)
        if not carga:
            return False

        self.db.delete(carga)
        self.db.commit()

        return True

    # ==================== GUÍAS ====================

    def agregar_guias(self, carga_id: str, guias: List[GuiaCargaCreate]) -> int:
        """Agregar guías a una carga"""
        carga = self.obtener_carga(carga_id)
        if not carga or carga.estado != "activa":
            return 0

        # Obtener guías existentes para evitar duplicados
        guias_existentes = set(
            g.numero_guia for g in self.db.query(GuiaCarga.numero_guia)
            .filter(GuiaCarga.carga_id == carga_id).all()
        )

        agregadas = 0
        for guia_data in guias:
            if guia_data.numero_guia not in guias_existentes:
                guia = GuiaCarga(
                    carga_id=carga_id,
                    numero_guia=guia_data.numero_guia,
                    estado=guia_data.estado,
                    transportadora=guia_data.transportadora,
                    ciudad_destino=guia_data.ciudad_destino,
                    telefono=guia_data.telefono,
                    nombre_cliente=guia_data.nombre_cliente,
                    direccion=guia_data.direccion,
                    dias_transito=guia_data.dias_transito,
                    tiene_novedad=guia_data.tiene_novedad,
                    tipo_novedad=guia_data.tipo_novedad,
                    descripcion_novedad=guia_data.descripcion_novedad,
                    valor_declarado=guia_data.valor_declarado,
                    fuente=guia_data.fuente,
                    datos_extra=guia_data.datos_extra,
                )
                self.db.add(guia)
                guias_existentes.add(guia_data.numero_guia)
                agregadas += 1

        if agregadas > 0:
            self.db.commit()
            self._actualizar_stats_carga(carga_id)

            self._registrar_actividad(carga.usuario_id, "guias_agregadas",
                f"Agregó {agregadas} guías a {carga.nombre}", {
                    "carga_id": carga_id,
                    "count": agregadas
                })

        return agregadas

    def actualizar_guia(self, guia_id: str, updates: Dict[str, Any]) -> Optional[GuiaCarga]:
        """Actualizar una guía"""
        guia = self.db.query(GuiaCarga).filter(GuiaCarga.id == guia_id).first()
        if not guia:
            return None

        for key, value in updates.items():
            if hasattr(guia, key):
                setattr(guia, key, value)

        self.db.commit()
        self.db.refresh(guia)

        # Actualizar stats de la carga
        self._actualizar_stats_carga(guia.carga_id)

        return guia

    def eliminar_guia(self, guia_id: str) -> bool:
        """Eliminar una guía"""
        guia = self.db.query(GuiaCarga).filter(GuiaCarga.id == guia_id).first()
        if not guia:
            return False

        carga_id = guia.carga_id
        self.db.delete(guia)
        self.db.commit()

        # Actualizar stats
        self._actualizar_stats_carga(carga_id)

        return True

    def obtener_guias_carga(self, carga_id: str, filtros: FiltrosCarga = None) -> List[GuiaCarga]:
        """Obtener guías de una carga con filtros opcionales"""
        query = self.db.query(GuiaCarga).filter(GuiaCarga.carga_id == carga_id)

        if filtros:
            if filtros.busqueda:
                busqueda = f"%{filtros.busqueda}%"
                query = query.filter(or_(
                    GuiaCarga.numero_guia.ilike(busqueda),
                    GuiaCarga.nombre_cliente.ilike(busqueda),
                    GuiaCarga.telefono.ilike(busqueda),
                    GuiaCarga.ciudad_destino.ilike(busqueda)
                ))

            if filtros.transportadora:
                query = query.filter(GuiaCarga.transportadora == filtros.transportadora)

            if filtros.ciudad_destino:
                query = query.filter(GuiaCarga.ciudad_destino.ilike(f"%{filtros.ciudad_destino}%"))

            if filtros.solo_con_novedad:
                query = query.filter(GuiaCarga.tiene_novedad == True)

        return query.order_by(GuiaCarga.created_at.desc()).all()

    # ==================== CONSULTAS ====================

    def obtener_cargas_del_dia(self, fecha: date, usuario_id: str = None) -> List[Carga]:
        """Obtener cargas de un día específico"""
        query = self.db.query(Carga).filter(Carga.fecha == fecha)

        if usuario_id:
            query = query.filter(Carga.usuario_id == usuario_id)

        return query.order_by(Carga.numero_carga).all()

    def obtener_historial(self, filtros: FiltrosCarga = None, limite_dias: int = 30) -> HistorialResponse:
        """Obtener historial de cargas agrupado por día"""
        query = self.db.query(Carga)

        # Filtro por defecto: últimos N días
        fecha_desde = filtros.fecha_desde if filtros and filtros.fecha_desde else date.today() - timedelta(days=limite_dias)
        query = query.filter(Carga.fecha >= fecha_desde)

        if filtros:
            if filtros.fecha_hasta:
                query = query.filter(Carga.fecha <= filtros.fecha_hasta)
            if filtros.usuario_id:
                query = query.filter(Carga.usuario_id == filtros.usuario_id)
            if filtros.estado and filtros.estado != "todas":
                query = query.filter(Carga.estado == filtros.estado)

        cargas = query.order_by(desc(Carga.fecha), Carga.numero_carga).all()

        # Agrupar por fecha
        por_fecha: Dict[date, List[Carga]] = {}
        for carga in cargas:
            if carga.fecha not in por_fecha:
                por_fecha[carga.fecha] = []
            por_fecha[carga.fecha].append(carga)

        # Construir respuesta
        fechas = []
        total_guias = 0

        for fecha, cargas_dia in sorted(por_fecha.items(), reverse=True):
            cargas_list = []
            guias_dia = 0

            for carga in cargas_dia:
                # Obtener nombre del usuario
                usuario = self.db.query(Usuario).filter(Usuario.id == carga.usuario_id).first()

                cargas_list.append(CargaListResponse(
                    id=carga.id,
                    fecha=carga.fecha,
                    numero_carga=carga.numero_carga,
                    nombre=carga.nombre,
                    usuario_nombre=usuario.nombre if usuario else "Desconocido",
                    total_guias=carga.total_guias,
                    entregadas=carga.entregadas,
                    con_novedad=carga.con_novedad,
                    estado=carga.estado,
                    created_at=carga.created_at
                ))
                guias_dia += carga.total_guias

            fechas.append(CargaDiaResponse(
                fecha=fecha,
                cargas=cargas_list,
                total_guias=guias_dia,
                total_cargas=len(cargas_list)
            ))
            total_guias += guias_dia

        return HistorialResponse(
            fechas=fechas,
            total_cargas=len(cargas),
            total_guias=total_guias
        )

    def buscar_guia(self, numero_guia: str) -> List[Dict[str, Any]]:
        """Buscar una guía en todas las cargas"""
        guias = self.db.query(GuiaCarga).filter(
            GuiaCarga.numero_guia.ilike(f"%{numero_guia}%")
        ).all()

        resultados = []
        for guia in guias:
            carga = self.obtener_carga(guia.carga_id)
            if carga:
                usuario = self.db.query(Usuario).filter(Usuario.id == carga.usuario_id).first()
                resultados.append({
                    "guia": guia,
                    "carga": {
                        "id": carga.id,
                        "nombre": carga.nombre,
                        "fecha": carga.fecha,
                        "usuario_nombre": usuario.nombre if usuario else "Desconocido"
                    }
                })

        return resultados

    # ==================== UTILIDADES ====================

    def _actualizar_stats_carga(self, carga_id: str):
        """Actualizar estadísticas de una carga"""
        carga = self.obtener_carga(carga_id)
        if not carga:
            return

        guias = self.db.query(GuiaCarga).filter(GuiaCarga.carga_id == carga_id).all()

        stats = {
            "total": len(guias),
            "entregadas": 0,
            "en_transito": 0,
            "con_novedad": 0,
            "devueltas": 0,
            "transportadoras": {},
            "ciudades": {},
            "total_dias": 0
        }

        for guia in guias:
            estado = guia.estado.lower()

            if "entregado" in estado:
                stats["entregadas"] += 1
            elif "tránsito" in estado or "transito" in estado:
                stats["en_transito"] += 1
            elif guia.tiene_novedad or "novedad" in estado:
                stats["con_novedad"] += 1
            elif "devuelto" in estado or "retorno" in estado:
                stats["devueltas"] += 1

            stats["total_dias"] += guia.dias_transito or 0

            if guia.transportadora:
                stats["transportadoras"][guia.transportadora] = \
                    stats["transportadoras"].get(guia.transportadora, 0) + 1

            if guia.ciudad_destino:
                stats["ciudades"][guia.ciudad_destino] = \
                    stats["ciudades"].get(guia.ciudad_destino, 0) + 1

        # Actualizar carga
        carga.total_guias = stats["total"]
        carga.entregadas = stats["entregadas"]
        carga.en_transito = stats["en_transito"]
        carga.con_novedad = stats["con_novedad"]
        carga.devueltas = stats["devueltas"]
        carga.porcentaje_entrega = (stats["entregadas"] / stats["total"] * 100) if stats["total"] > 0 else 0
        carga.dias_promedio_transito = (stats["total_dias"] / stats["total"]) if stats["total"] > 0 else 0
        carga.stats_transportadoras = stats["transportadoras"]
        carga.stats_ciudades = stats["ciudades"]

        self.db.commit()

    def _registrar_actividad(self, usuario_id: str, tipo: str, descripcion: str, metadata: Dict = None):
        """Registrar actividad de usuario"""
        actividad = ActividadUsuario(
            usuario_id=usuario_id,
            tipo=tipo,
            descripcion=descripcion,
            metadata=metadata or {}
        )
        self.db.add(actividad)
        self.db.commit()

    def obtener_o_crear_carga_hoy(self, usuario_id: str) -> Carga:
        """Obtener carga activa de hoy o crear una nueva"""
        hoy = date.today()

        # Buscar carga activa del usuario hoy
        carga = self.db.query(Carga).filter(
            and_(
                Carga.fecha == hoy,
                Carga.usuario_id == usuario_id,
                Carga.estado == "activa"
            )
        ).first()

        if carga:
            return carga

        # Crear nueva
        return self.crear_carga(usuario_id)

    def limpiar_cargas_antiguas(self, dias_maximos: int = 90) -> int:
        """Eliminar cargas más antiguas que X días"""
        fecha_limite = date.today() - timedelta(days=dias_maximos)

        eliminadas = self.db.query(Carga).filter(Carga.fecha < fecha_limite).delete()
        self.db.commit()

        return eliminadas
