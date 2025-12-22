# backend/routes/tracking_ordenes_routes.py
"""
API Routes para el Sistema de Tracking de Órdenes de Transportadoras.
Maneja la carga de Excel, cruce de historial, alertas inteligentes y análisis con IA.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from loguru import logger

# Imports de base de datos
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import (
    get_session,
    TrackingOrden,
    HistorialTrackingOrden,
    SesionTrackingTransportadora,
    AlertaTracking
)

router = APIRouter(prefix="/tracking-ordenes", tags=["Tracking Órdenes"])


# ==================== MODELOS PYDANTIC ====================

class OrdenInput(BaseModel):
    """Modelo para recibir una orden desde el frontend"""
    hora: Optional[str] = None
    fecha: Optional[str] = None
    nombreCliente: Optional[str] = None
    telefono: Optional[str] = None
    numeroGuia: str
    estatus: Optional[str] = None
    ciudadDestino: Optional[str] = None
    transportadora: Optional[str] = None
    novedad: Optional[str] = None
    ultimoMovimiento: Optional[str] = None
    fechaUltimoMovimiento: Optional[str] = None
    horaUltimoMovimiento: Optional[str] = None
    fechaGeneracionGuia: Optional[str] = None


class SesionInput(BaseModel):
    """Modelo para crear una sesión de carga"""
    nombreSesion: str
    nombreArchivo: Optional[str] = None
    ordenes: List[OrdenInput]


class FiltrosOrdenes(BaseModel):
    """Filtros para buscar órdenes"""
    busqueda: Optional[str] = None
    estatus: Optional[str] = None
    ciudad: Optional[str] = None
    transportadora: Optional[str] = None
    conNovedad: Optional[bool] = None
    esCritica: Optional[bool] = None
    nivelRiesgo: Optional[str] = None
    fechaDesde: Optional[str] = None
    fechaHasta: Optional[str] = None


class AlertaInput(BaseModel):
    """Modelo para crear una alerta manualmente"""
    tipo: str
    severidad: str
    titulo: str
    descripcion: Optional[str] = None
    guiasAfectadas: Optional[List[str]] = None
    accionRecomendada: Optional[str] = None


# ==================== UTILIDADES ====================

def parse_fecha(fecha_str: Optional[str]) -> Optional[datetime]:
    """Parsea una fecha string a datetime"""
    if not fecha_str:
        return None

    formatos = [
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%d-%m-%Y',
        '%Y/%m/%d',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%fZ',
    ]

    for formato in formatos:
        try:
            return datetime.strptime(fecha_str.strip(), formato)
        except ValueError:
            continue

    return None


def calcular_dias_transito(fecha_generacion: Optional[datetime]) -> int:
    """Calcula los días en tránsito desde la generación de la guía"""
    if not fecha_generacion:
        return 0
    return (datetime.now() - fecha_generacion).days


def calcular_dias_sin_movimiento(fecha_ultimo_mov: Optional[datetime]) -> int:
    """Calcula los días sin movimiento"""
    if not fecha_ultimo_mov:
        return 0
    return (datetime.now() - fecha_ultimo_mov).days


def determinar_nivel_riesgo(orden: TrackingOrden) -> str:
    """Determina el nivel de riesgo de una orden basado en múltiples factores"""
    puntos = 0

    # Días sin movimiento
    if orden.dias_sin_movimiento >= 7:
        puntos += 4
    elif orden.dias_sin_movimiento >= 5:
        puntos += 3
    elif orden.dias_sin_movimiento >= 3:
        puntos += 2
    elif orden.dias_sin_movimiento >= 2:
        puntos += 1

    # Novedad activa
    if orden.tiene_novedad:
        puntos += 2

    # Historial de novedades
    if orden.veces_con_novedad >= 3:
        puntos += 3
    elif orden.veces_con_novedad >= 2:
        puntos += 2
    elif orden.veces_con_novedad >= 1:
        puntos += 1

    # Estatus problemático
    estatus_lower = (orden.estatus or '').lower()
    if 'devolucion' in estatus_lower or 'devuelto' in estatus_lower:
        puntos += 4
    elif 'novedad' in estatus_lower or 'incidente' in estatus_lower:
        puntos += 3
    elif 'retenido' in estatus_lower or 'pendiente' in estatus_lower:
        puntos += 2

    # Clasificación
    if puntos >= 8:
        return 'CRITICO'
    elif puntos >= 5:
        return 'ALTO'
    elif puntos >= 3:
        return 'MEDIO'
    else:
        return 'BAJO'


# ==================== ENDPOINTS PRINCIPALES ====================

@router.post("/sesion")
async def crear_sesion_tracking(
    data: SesionInput,
    db: Session = Depends(get_session)
):
    """
    Crear una nueva sesión de tracking con órdenes.
    Cruza automáticamente con el historial existente.
    """
    try:
        # Crear sesión
        sesion = SesionTrackingTransportadora(
            nombre_sesion=data.nombreSesion,
            nombre_archivo=data.nombreArchivo,
            fecha_sesion=datetime.now(),
            total_ordenes=len(data.ordenes)
        )
        db.add(sesion)
        db.flush()  # Para obtener el ID

        # Estadísticas
        ordenes_nuevas = 0
        ordenes_actualizadas = 0
        ordenes_entregadas = 0
        ordenes_devolucion = 0
        ordenes_con_novedad = 0
        ordenes_en_proceso = 0

        cambios_detectados = []

        for orden_data in data.ordenes:
            # Parsear fechas
            fecha = parse_fecha(orden_data.fecha)
            fecha_ult_mov = parse_fecha(orden_data.fechaUltimoMovimiento)
            fecha_gen = parse_fecha(orden_data.fechaGeneracionGuia)

            # Buscar si la guía ya existe
            orden_existente = db.query(TrackingOrden).filter(
                TrackingOrden.numero_guia == orden_data.numeroGuia
            ).first()

            if orden_existente:
                # Actualizar orden existente
                ordenes_actualizadas += 1

                # Detectar cambio de estatus
                if orden_existente.estatus != orden_data.estatus:
                    # Registrar en historial
                    historial = HistorialTrackingOrden(
                        orden_id=orden_existente.id,
                        numero_guia=orden_existente.numero_guia,
                        estatus=orden_existente.estatus,
                        novedad=orden_existente.novedad,
                        ultimo_movimiento=orden_existente.ultimo_movimiento,
                        fecha_movimiento=orden_existente.fecha_ultimo_movimiento,
                        cambio_estatus=True,
                        estatus_anterior=orden_existente.estatus,
                        nueva_novedad=bool(orden_data.novedad and not orden_existente.novedad),
                        sesion_id=sesion.id
                    )
                    db.add(historial)

                    cambios_detectados.append({
                        'guia': orden_data.numeroGuia,
                        'estatusAnterior': orden_existente.estatus,
                        'estatusNuevo': orden_data.estatus,
                        'cliente': orden_data.nombreCliente
                    })

                # Actualizar campos
                orden_existente.hora = orden_data.hora
                orden_existente.fecha = fecha
                orden_existente.nombre_cliente = orden_data.nombreCliente
                orden_existente.telefono = orden_data.telefono
                orden_existente.estado_anterior = orden_existente.estatus
                orden_existente.estatus = orden_data.estatus
                orden_existente.ciudad_destino = orden_data.ciudadDestino
                orden_existente.transportadora = orden_data.transportadora
                orden_existente.ultimo_movimiento = orden_data.ultimoMovimiento
                orden_existente.fecha_ultimo_movimiento = fecha_ult_mov
                orden_existente.hora_ultimo_movimiento = orden_data.horaUltimoMovimiento
                orden_existente.total_actualizaciones += 1
                orden_existente.sesion_id = sesion.id

                # Actualizar novedad
                if orden_data.novedad:
                    if not orden_existente.novedad:
                        orden_existente.veces_con_novedad += 1
                    orden_existente.novedad = orden_data.novedad
                    orden_existente.tiene_novedad = True
                else:
                    orden_existente.novedad = None
                    orden_existente.tiene_novedad = False

                # Recalcular métricas
                orden_existente.dias_en_transito = calcular_dias_transito(fecha_gen or orden_existente.fecha_generacion_guia)
                orden_existente.dias_sin_movimiento = calcular_dias_sin_movimiento(fecha_ult_mov)
                orden_existente.es_critica = orden_existente.dias_sin_movimiento >= 5
                orden_existente.nivel_riesgo = determinar_nivel_riesgo(orden_existente)

                orden = orden_existente
            else:
                # Crear nueva orden
                ordenes_nuevas += 1

                orden = TrackingOrden(
                    hora=orden_data.hora,
                    fecha=fecha,
                    nombre_cliente=orden_data.nombreCliente,
                    telefono=orden_data.telefono,
                    numero_guia=orden_data.numeroGuia,
                    estatus=orden_data.estatus,
                    ciudad_destino=orden_data.ciudadDestino,
                    transportadora=orden_data.transportadora,
                    novedad=orden_data.novedad,
                    tiene_novedad=bool(orden_data.novedad),
                    ultimo_movimiento=orden_data.ultimoMovimiento,
                    fecha_ultimo_movimiento=fecha_ult_mov,
                    hora_ultimo_movimiento=orden_data.horaUltimoMovimiento,
                    fecha_generacion_guia=fecha_gen,
                    sesion_id=sesion.id,
                    veces_con_novedad=1 if orden_data.novedad else 0
                )

                # Calcular métricas
                orden.dias_en_transito = calcular_dias_transito(fecha_gen)
                orden.dias_sin_movimiento = calcular_dias_sin_movimiento(fecha_ult_mov)
                orden.es_critica = orden.dias_sin_movimiento >= 5

                db.add(orden)
                db.flush()

                orden.nivel_riesgo = determinar_nivel_riesgo(orden)

            # Contar por estatus
            estatus_lower = (orden_data.estatus or '').lower()
            if 'entregado' in estatus_lower or 'delivered' in estatus_lower:
                ordenes_entregadas += 1
            elif 'devolucion' in estatus_lower or 'devuelto' in estatus_lower:
                ordenes_devolucion += 1
            else:
                ordenes_en_proceso += 1

            if orden_data.novedad:
                ordenes_con_novedad += 1

        # Actualizar estadísticas de sesión
        sesion.ordenes_nuevas = ordenes_nuevas
        sesion.ordenes_actualizadas = ordenes_actualizadas
        sesion.ordenes_entregadas = ordenes_entregadas
        sesion.ordenes_devolucion = ordenes_devolucion
        sesion.ordenes_con_novedad = ordenes_con_novedad
        sesion.ordenes_en_proceso = ordenes_en_proceso

        # Generar alertas automáticas
        alertas_generadas = await generar_alertas_automaticas(db, sesion.id)
        sesion.alertas_generadas = [a.to_dict() for a in alertas_generadas]

        db.commit()

        logger.info(f"Sesión de tracking creada: {sesion.id} con {len(data.ordenes)} órdenes")

        return {
            'success': True,
            'sesionId': sesion.id,
            'estadisticas': {
                'total': len(data.ordenes),
                'nuevas': ordenes_nuevas,
                'actualizadas': ordenes_actualizadas,
                'entregadas': ordenes_entregadas,
                'devolucion': ordenes_devolucion,
                'conNovedad': ordenes_con_novedad,
                'enProceso': ordenes_en_proceso
            },
            'cambiosDetectados': cambios_detectados,
            'alertasGeneradas': len(alertas_generadas)
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear sesión de tracking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ordenes")
async def obtener_ordenes(
    busqueda: Optional[str] = None,
    estatus: Optional[str] = None,
    ciudad: Optional[str] = None,
    transportadora: Optional[str] = None,
    conNovedad: Optional[bool] = None,
    esCritica: Optional[bool] = None,
    nivelRiesgo: Optional[str] = None,
    fechaDesde: Optional[str] = None,
    fechaHasta: Optional[str] = None,
    pagina: int = Query(1, ge=1),
    porPagina: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_session)
):
    """Obtener órdenes con filtros y paginación"""
    try:
        query = db.query(TrackingOrden)

        # Aplicar filtros
        if busqueda:
            query = query.filter(
                or_(
                    TrackingOrden.numero_guia.ilike(f'%{busqueda}%'),
                    TrackingOrden.nombre_cliente.ilike(f'%{busqueda}%'),
                    TrackingOrden.telefono.ilike(f'%{busqueda}%')
                )
            )

        if estatus:
            query = query.filter(TrackingOrden.estatus.ilike(f'%{estatus}%'))

        if ciudad:
            query = query.filter(TrackingOrden.ciudad_destino.ilike(f'%{ciudad}%'))

        if transportadora:
            query = query.filter(TrackingOrden.transportadora.ilike(f'%{transportadora}%'))

        if conNovedad is not None:
            query = query.filter(TrackingOrden.tiene_novedad == conNovedad)

        if esCritica is not None:
            query = query.filter(TrackingOrden.es_critica == esCritica)

        if nivelRiesgo:
            query = query.filter(TrackingOrden.nivel_riesgo == nivelRiesgo)

        if fechaDesde:
            fecha_desde = parse_fecha(fechaDesde)
            if fecha_desde:
                query = query.filter(TrackingOrden.fecha >= fecha_desde)

        if fechaHasta:
            fecha_hasta = parse_fecha(fechaHasta)
            if fecha_hasta:
                query = query.filter(TrackingOrden.fecha <= fecha_hasta)

        # Contar total
        total = query.count()

        # Ordenar y paginar
        query = query.order_by(desc(TrackingOrden.fecha_ultima_actualizacion))
        offset = (pagina - 1) * porPagina
        ordenes = query.offset(offset).limit(porPagina).all()

        return {
            'success': True,
            'ordenes': [o.to_dict() for o in ordenes],
            'total': total,
            'pagina': pagina,
            'porPagina': porPagina,
            'totalPaginas': (total + porPagina - 1) // porPagina
        }

    except Exception as e:
        logger.error(f"Error al obtener órdenes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ordenes/{numero_guia}")
async def obtener_orden_detalle(
    numero_guia: str,
    db: Session = Depends(get_session)
):
    """Obtener detalle de una orden incluyendo su historial"""
    try:
        orden = db.query(TrackingOrden).filter(
            TrackingOrden.numero_guia == numero_guia
        ).first()

        if not orden:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        # Obtener historial
        historial = db.query(HistorialTrackingOrden).filter(
            HistorialTrackingOrden.numero_guia == numero_guia
        ).order_by(desc(HistorialTrackingOrden.fecha_registro)).all()

        return {
            'success': True,
            'orden': orden.to_dict(),
            'historial': [
                {
                    'id': h.id,
                    'estatus': h.estatus,
                    'estatusAnterior': h.estatus_anterior,
                    'novedad': h.novedad,
                    'ultimoMovimiento': h.ultimo_movimiento,
                    'fechaMovimiento': h.fecha_movimiento.isoformat() if h.fecha_movimiento else None,
                    'fechaRegistro': h.fecha_registro.isoformat() if h.fecha_registro else None,
                    'cambioEstatus': h.cambio_estatus,
                    'nuevaNovedad': h.nueva_novedad
                }
                for h in historial
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener detalle de orden: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metricas")
async def obtener_metricas(
    db: Session = Depends(get_session)
):
    """Obtener métricas generales del tracking"""
    try:
        # Total de órdenes
        total = db.query(TrackingOrden).count()

        # Por estatus
        entregadas = db.query(TrackingOrden).filter(
            TrackingOrden.estatus.ilike('%entregado%')
        ).count()

        devoluciones = db.query(TrackingOrden).filter(
            or_(
                TrackingOrden.estatus.ilike('%devolucion%'),
                TrackingOrden.estatus.ilike('%devuelto%')
            )
        ).count()

        con_novedad = db.query(TrackingOrden).filter(
            TrackingOrden.tiene_novedad == True
        ).count()

        criticas = db.query(TrackingOrden).filter(
            TrackingOrden.es_critica == True
        ).count()

        # Por nivel de riesgo
        por_riesgo = {}
        for nivel in ['BAJO', 'MEDIO', 'ALTO', 'CRITICO']:
            por_riesgo[nivel] = db.query(TrackingOrden).filter(
                TrackingOrden.nivel_riesgo == nivel
            ).count()

        # Por transportadora
        transportadoras = db.query(
            TrackingOrden.transportadora,
            func.count(TrackingOrden.id).label('total')
        ).group_by(TrackingOrden.transportadora).all()

        # Por ciudad (top 10)
        ciudades = db.query(
            TrackingOrden.ciudad_destino,
            func.count(TrackingOrden.id).label('total')
        ).group_by(TrackingOrden.ciudad_destino).order_by(
            desc('total')
        ).limit(10).all()

        # Promedio días sin movimiento
        promedio_dias = db.query(
            func.avg(TrackingOrden.dias_sin_movimiento)
        ).scalar() or 0

        return {
            'success': True,
            'metricas': {
                'total': total,
                'entregadas': entregadas,
                'devoluciones': devoluciones,
                'conNovedad': con_novedad,
                'criticas': criticas,
                'enProceso': total - entregadas - devoluciones,
                'tasaEntrega': round((entregadas / total * 100) if total > 0 else 0, 1),
                'tasaDevolucion': round((devoluciones / total * 100) if total > 0 else 0, 1),
                'porRiesgo': por_riesgo,
                'porTransportadora': [
                    {'nombre': t[0] or 'Sin asignar', 'total': t[1]}
                    for t in transportadoras
                ],
                'porCiudad': [
                    {'nombre': c[0] or 'Sin asignar', 'total': c[1]}
                    for c in ciudades
                ],
                'promedioDiasSinMovimiento': round(promedio_dias, 1)
            }
        }

    except Exception as e:
        logger.error(f"Error al obtener métricas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alertas")
async def obtener_alertas(
    activas: Optional[bool] = True,
    tipo: Optional[str] = None,
    severidad: Optional[str] = None,
    limite: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_session)
):
    """Obtener alertas de tracking"""
    try:
        query = db.query(AlertaTracking)

        if activas is not None:
            query = query.filter(AlertaTracking.esta_activa == activas)

        if tipo:
            query = query.filter(AlertaTracking.tipo == tipo)

        if severidad:
            query = query.filter(AlertaTracking.severidad == severidad)

        alertas = query.order_by(desc(AlertaTracking.fecha_creacion)).limit(limite).all()

        return {
            'success': True,
            'alertas': [a.to_dict() for a in alertas],
            'total': len(alertas)
        }

    except Exception as e:
        logger.error(f"Error al obtener alertas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alertas/{alerta_id}/resolver")
async def resolver_alerta(
    alerta_id: int,
    comentario: Optional[str] = Body(None),
    db: Session = Depends(get_session)
):
    """Marcar una alerta como resuelta"""
    try:
        alerta = db.query(AlertaTracking).filter(AlertaTracking.id == alerta_id).first()

        if not alerta:
            raise HTTPException(status_code=404, detail="Alerta no encontrada")

        alerta.esta_activa = False
        alerta.fue_resuelta = True
        alerta.fecha_resolucion = datetime.now()
        alerta.comentario_resolucion = comentario

        db.commit()

        return {'success': True, 'message': 'Alerta resuelta'}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al resolver alerta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sesiones")
async def obtener_sesiones(
    limite: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_session)
):
    """Obtener historial de sesiones de carga"""
    try:
        sesiones = db.query(SesionTrackingTransportadora).order_by(
            desc(SesionTrackingTransportadora.fecha_sesion)
        ).limit(limite).all()

        return {
            'success': True,
            'sesiones': [
                {
                    'id': s.id,
                    'nombre': s.nombre_sesion,
                    'fecha': s.fecha_sesion.isoformat() if s.fecha_sesion else None,
                    'archivo': s.nombre_archivo,
                    'totalOrdenes': s.total_ordenes,
                    'nuevas': s.ordenes_nuevas,
                    'actualizadas': s.ordenes_actualizadas,
                    'entregadas': s.ordenes_entregadas,
                    'devolucion': s.ordenes_devolucion,
                    'conNovedad': s.ordenes_con_novedad,
                    'enProceso': s.ordenes_en_proceso
                }
                for s in sesiones
            ]
        }

    except Exception as e:
        logger.error(f"Error al obtener sesiones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/comparar-sesiones/{sesion_id_1}/{sesion_id_2}")
async def comparar_sesiones(
    sesion_id_1: int,
    sesion_id_2: int,
    db: Session = Depends(get_session)
):
    """Comparar dos sesiones de carga"""
    try:
        sesion1 = db.query(SesionTrackingTransportadora).filter(
            SesionTrackingTransportadora.id == sesion_id_1
        ).first()
        sesion2 = db.query(SesionTrackingTransportadora).filter(
            SesionTrackingTransportadora.id == sesion_id_2
        ).first()

        if not sesion1 or not sesion2:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        # Obtener guías de cada sesión desde el historial
        historial1 = db.query(HistorialTrackingOrden).filter(
            HistorialTrackingOrden.sesion_id == sesion_id_1
        ).all()
        historial2 = db.query(HistorialTrackingOrden).filter(
            HistorialTrackingOrden.sesion_id == sesion_id_2
        ).all()

        guias1 = {h.numero_guia: h for h in historial1}
        guias2 = {h.numero_guia: h for h in historial2}

        # Calcular diferencias
        guias_nuevas = set(guias2.keys()) - set(guias1.keys())
        guias_desaparecidas = set(guias1.keys()) - set(guias2.keys())
        guias_comunes = set(guias1.keys()) & set(guias2.keys())

        cambios_estatus = []
        for guia in guias_comunes:
            if guias1[guia].estatus != guias2[guia].estatus:
                cambios_estatus.append({
                    'guia': guia,
                    'estatusAnterior': guias1[guia].estatus,
                    'estatusNuevo': guias2[guia].estatus
                })

        return {
            'success': True,
            'comparacion': {
                'sesion1': {
                    'id': sesion1.id,
                    'nombre': sesion1.nombre_sesion,
                    'fecha': sesion1.fecha_sesion.isoformat() if sesion1.fecha_sesion else None,
                    'totalOrdenes': sesion1.total_ordenes
                },
                'sesion2': {
                    'id': sesion2.id,
                    'nombre': sesion2.nombre_sesion,
                    'fecha': sesion2.fecha_sesion.isoformat() if sesion2.fecha_sesion else None,
                    'totalOrdenes': sesion2.total_ordenes
                },
                'guiasNuevas': list(guias_nuevas),
                'guiasDesaparecidas': list(guias_desaparecidas),
                'cambiosEstatus': cambios_estatus,
                'resumen': {
                    'nuevas': len(guias_nuevas),
                    'desaparecidas': len(guias_desaparecidas),
                    'cambiosEstatus': len(cambios_estatus),
                    'sinCambios': len(guias_comunes) - len(cambios_estatus)
                }
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al comparar sesiones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ALERTAS AUTOMÁTICAS ====================

async def generar_alertas_automaticas(db: Session, sesion_id: int) -> List[AlertaTracking]:
    """Genera alertas automáticas basadas en el análisis de las órdenes"""
    alertas = []

    try:
        # 1. Guías estancadas (más de 5 días sin movimiento)
        estancadas = db.query(TrackingOrden).filter(
            TrackingOrden.dias_sin_movimiento >= 5,
            ~TrackingOrden.estatus.ilike('%entregado%'),
            ~TrackingOrden.estatus.ilike('%devolucion%')
        ).all()

        if estancadas:
            alerta = AlertaTracking(
                tipo='ESTANCADA',
                severidad='CRITICAL' if len(estancadas) > 10 else 'URGENT',
                titulo=f'{len(estancadas)} guías estancadas (5+ días sin movimiento)',
                descripcion=f'Se detectaron {len(estancadas)} guías que llevan más de 5 días sin actualizaciones. Requieren atención inmediata.',
                guias_afectadas=[g.numero_guia for g in estancadas[:50]],
                cantidad_afectadas=len(estancadas),
                accion_recomendada='Contactar a las transportadoras para solicitar actualización de estado. Priorizar guías con mayor antigüedad.',
                sesion_id=sesion_id
            )
            db.add(alerta)
            alertas.append(alerta)

        # 2. Guías con novedades recurrentes (3+ veces)
        novedades_recurrentes = db.query(TrackingOrden).filter(
            TrackingOrden.veces_con_novedad >= 3
        ).all()

        if novedades_recurrentes:
            alerta = AlertaTracking(
                tipo='NOVEDAD_RECURRENTE',
                severidad='WARNING',
                titulo=f'{len(novedades_recurrentes)} guías con novedades recurrentes',
                descripcion=f'Estas guías han tenido 3 o más novedades. Pueden requerir gestión especial o contacto directo con el cliente.',
                guias_afectadas=[g.numero_guia for g in novedades_recurrentes[:50]],
                cantidad_afectadas=len(novedades_recurrentes),
                accion_recomendada='Revisar el historial de cada guía para identificar patrones. Considerar contacto directo con el cliente para confirmar datos.',
                sesion_id=sesion_id
            )
            db.add(alerta)
            alertas.append(alerta)

        # 3. Posibles devoluciones (guías críticas con novedades)
        posibles_devoluciones = db.query(TrackingOrden).filter(
            TrackingOrden.es_critica == True,
            TrackingOrden.tiene_novedad == True,
            ~TrackingOrden.estatus.ilike('%entregado%')
        ).all()

        if posibles_devoluciones:
            alerta = AlertaTracking(
                tipo='DEVOLUCION_PROBABLE',
                severidad='URGENT',
                titulo=f'{len(posibles_devoluciones)} guías en riesgo de devolución',
                descripcion=f'Estas guías tienen alta probabilidad de terminar en devolución debido a novedades y tiempo estancado.',
                guias_afectadas=[g.numero_guia for g in posibles_devoluciones[:50]],
                cantidad_afectadas=len(posibles_devoluciones),
                accion_recomendada='Contactar al cliente inmediatamente para confirmar disponibilidad. Coordinar nueva entrega si es posible.',
                sesion_id=sesion_id
            )
            db.add(alerta)
            alertas.append(alerta)

        # 4. Transportadoras con alto porcentaje de problemas
        transportadoras_problematicas = db.query(
            TrackingOrden.transportadora,
            func.count(TrackingOrden.id).label('total'),
            func.sum(func.cast(TrackingOrden.es_critica, Integer)).label('criticas')
        ).filter(
            TrackingOrden.transportadora.isnot(None)
        ).group_by(TrackingOrden.transportadora).having(
            func.count(TrackingOrden.id) >= 10
        ).all()

        for t in transportadoras_problematicas:
            if t.total > 0 and t.criticas / t.total > 0.3:  # Más del 30% críticas
                alerta = AlertaTracking(
                    tipo='DEMORA_TRANSPORTADORA',
                    severidad='WARNING',
                    titulo=f'Alto porcentaje de problemas con {t.transportadora}',
                    descripcion=f'{t.criticas} de {t.total} guías ({round(t.criticas/t.total*100, 1)}%) de {t.transportadora} están en estado crítico.',
                    transportadora=t.transportadora,
                    cantidad_afectadas=t.criticas,
                    accion_recomendada=f'Evaluar el rendimiento de {t.transportadora}. Considerar renegociar términos o buscar alternativas para ciertas rutas.',
                    sesion_id=sesion_id
                )
                db.add(alerta)
                alertas.append(alerta)

        db.flush()

    except Exception as e:
        logger.error(f"Error generando alertas automáticas: {str(e)}")

    return alertas


# ==================== ANÁLISIS CON IA ====================

@router.post("/analisis-ia")
async def generar_analisis_ia(
    db: Session = Depends(get_session)
):
    """
    Genera un análisis completo con IA basado en las métricas actuales.
    Retorna recomendaciones, predicciones y alertas inteligentes.
    """
    try:
        # Obtener métricas
        total = db.query(TrackingOrden).count()

        if total == 0:
            return {
                'success': True,
                'analisis': {
                    'resumen': 'No hay órdenes para analizar.',
                    'recomendaciones': [],
                    'alertas': []
                }
            }

        # Calcular estadísticas
        entregadas = db.query(TrackingOrden).filter(
            TrackingOrden.estatus.ilike('%entregado%')
        ).count()

        devoluciones = db.query(TrackingOrden).filter(
            or_(
                TrackingOrden.estatus.ilike('%devolucion%'),
                TrackingOrden.estatus.ilike('%devuelto%')
            )
        ).count()

        con_novedad = db.query(TrackingOrden).filter(
            TrackingOrden.tiene_novedad == True
        ).count()

        criticas = db.query(TrackingOrden).filter(
            TrackingOrden.es_critica == True
        ).count()

        # Calcular promedios
        promedio_dias = db.query(
            func.avg(TrackingOrden.dias_sin_movimiento)
        ).scalar() or 0

        # Transportadoras con más problemas
        transportadoras_problemas = db.query(
            TrackingOrden.transportadora,
            func.count(TrackingOrden.id).label('total'),
            func.sum(func.cast(TrackingOrden.es_critica, Integer)).label('criticas')
        ).filter(
            TrackingOrden.transportadora.isnot(None)
        ).group_by(TrackingOrden.transportadora).order_by(
            desc('criticas')
        ).limit(5).all()

        # Ciudades con más problemas
        ciudades_problemas = db.query(
            TrackingOrden.ciudad_destino,
            func.count(TrackingOrden.id).label('total'),
            func.sum(func.cast(TrackingOrden.es_critica, Integer)).label('criticas')
        ).filter(
            TrackingOrden.ciudad_destino.isnot(None)
        ).group_by(TrackingOrden.ciudad_destino).order_by(
            desc('criticas')
        ).limit(5).all()

        # Generar análisis y recomendaciones
        recomendaciones = []

        # Tasa de entrega
        tasa_entrega = (entregadas / total * 100) if total > 0 else 0
        if tasa_entrega < 70:
            recomendaciones.append({
                'tipo': 'CRITICO',
                'titulo': 'Tasa de entrega baja',
                'descripcion': f'La tasa de entrega es del {round(tasa_entrega, 1)}%, muy por debajo del objetivo del 85%. Se requieren acciones inmediatas.',
                'acciones': [
                    'Revisar las guías estancadas y contactar a transportadoras',
                    'Implementar seguimiento proactivo con clientes',
                    'Evaluar cambio de transportadora en rutas problemáticas'
                ]
            })
        elif tasa_entrega < 85:
            recomendaciones.append({
                'tipo': 'ALERTA',
                'titulo': 'Tasa de entrega mejorable',
                'descripcion': f'La tasa de entrega es del {round(tasa_entrega, 1)}%. Hay oportunidad de mejora.',
                'acciones': [
                    'Identificar cuellos de botella en las rutas más lentas',
                    'Mejorar la comunicación con clientes sobre horarios de entrega'
                ]
            })

        # Novedades
        tasa_novedad = (con_novedad / total * 100) if total > 0 else 0
        if tasa_novedad > 20:
            recomendaciones.append({
                'tipo': 'ALERTA',
                'titulo': 'Alto porcentaje de novedades',
                'descripcion': f'El {round(tasa_novedad, 1)}% de las guías tienen novedades activas.',
                'acciones': [
                    'Analizar las novedades más comunes para identificar patrones',
                    'Mejorar la validación de datos del cliente antes del envío',
                    'Implementar confirmación de dirección por WhatsApp'
                ]
            })

        # Críticas
        tasa_critica = (criticas / total * 100) if total > 0 else 0
        if tasa_critica > 10:
            recomendaciones.append({
                'tipo': 'CRITICO',
                'titulo': 'Demasiadas guías críticas',
                'descripcion': f'Hay {criticas} guías en estado crítico ({round(tasa_critica, 1)}% del total).',
                'acciones': [
                    'Priorizar contacto con las guías más antiguas',
                    'Escalar a supervisores las guías con más de 7 días sin movimiento',
                    'Considerar rescate de mercancía en bodega de transportadora'
                ]
            })

        # Transportadoras problemáticas
        for t in transportadoras_problemas:
            if t.total > 10 and t.criticas / t.total > 0.25:
                recomendaciones.append({
                    'tipo': 'ALERTA',
                    'titulo': f'Revisar rendimiento de {t.transportadora}',
                    'descripcion': f'{t.transportadora} tiene {round(t.criticas/t.total*100, 1)}% de guías críticas.',
                    'acciones': [
                        f'Programar reunión con {t.transportadora} para revisar métricas',
                        'Evaluar rutas alternativas para destinos problemáticos',
                        'Solicitar plan de mejora formal'
                    ]
                })

        return {
            'success': True,
            'analisis': {
                'resumen': f'Se analizaron {total} órdenes. Tasa de entrega: {round(tasa_entrega, 1)}%, Devoluciones: {round(devoluciones/total*100 if total > 0 else 0, 1)}%, Críticas: {criticas}.',
                'metricas': {
                    'total': total,
                    'entregadas': entregadas,
                    'devoluciones': devoluciones,
                    'conNovedad': con_novedad,
                    'criticas': criticas,
                    'tasaEntrega': round(tasa_entrega, 1),
                    'promedioDiasSinMovimiento': round(promedio_dias, 1)
                },
                'recomendaciones': recomendaciones,
                'transportadorasProblematicas': [
                    {
                        'nombre': t.transportadora,
                        'total': t.total,
                        'criticas': t.criticas or 0,
                        'porcentajeCriticas': round((t.criticas or 0) / t.total * 100, 1) if t.total > 0 else 0
                    }
                    for t in transportadoras_problemas
                ],
                'ciudadesProblematicas': [
                    {
                        'nombre': c.ciudad_destino,
                        'total': c.total,
                        'criticas': c.criticas or 0,
                        'porcentajeCriticas': round((c.criticas or 0) / c.total * 100, 1) if c.total > 0 else 0
                    }
                    for c in ciudades_problemas
                ]
            }
        }

    except Exception as e:
        logger.error(f"Error en análisis IA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
