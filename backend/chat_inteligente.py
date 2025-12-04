"""
Sistema de Chat Inteligente con Claude API para Litper Logística.
Permite consultas en lenguaje natural sobre datos de logística.
"""

import os
import re
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum

from anthropic import Anthropic
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from loguru import logger
from dotenv import load_dotenv

from database.models import (
    GuiaHistorica,
    ConversacionChat,
    MetricaModelo,
)

load_dotenv()


# ==================== CONFIGURACIÓN ====================

class TipoConsulta(Enum):
    """Tipos de consulta detectables"""
    BUSCAR_GUIA = "buscar_guia"
    CONSULTAR_TRANSPORTADORA = "consultar_transportadora"
    CONSULTAR_CIUDAD = "consultar_ciudad"
    CONSULTAR_PERIODO = "consultar_periodo"
    ESTADISTICAS_GENERALES = "estadisticas_generales"
    LISTAR_GUIAS = "listar_guias"
    COMPARAR_TRANSPORTADORAS = "comparar_transportadoras"
    ANALISIS_RETRASOS = "analisis_retrasos"
    PREDICCION = "prediccion"
    EJECUTAR_ACCION = "ejecutar_accion"
    GENERAL = "general"


# System prompt para Claude
SYSTEM_PROMPT = """Eres un asistente virtual experto en logística de Litper Colombia. Tu rol es:

1. ANALIZAR datos de envíos y guías con precisión
2. RESPONDER preguntas sobre estadísticas, retrasos, transportadoras y ciudades
3. EJECUTAR acciones cuando el usuario lo solicite (filtrar, exportar, alertar)
4. RECOMENDAR acciones basadas en los datos

REGLAS IMPORTANTES:
- Usa SOLO los datos proporcionados en el contexto
- Sé específico con números, porcentajes y fechas
- Habla en español profesional colombiano
- Si no tienes datos suficientes, indícalo claramente
- Cuando menciones estadísticas, incluye el período de tiempo
- Sugiere acciones proactivamente cuando detectes problemas

FORMATO DE RESPUESTA:
- Usa viñetas para listas
- Destaca números importantes
- Incluye conclusiones y recomendaciones al final

ACCIONES DISPONIBLES QUE PUEDES SUGERIR:
- Filtrar guías por criterios específicos
- Generar reportes de rendimiento
- Crear alertas para guías problemáticas
- Ejecutar predicciones ML
- Exportar datos a Excel/PDF
- Contactar clientes con retrasos

Cuando el usuario pida una acción, confirma que entiendes y describe qué se ejecutará."""


class ChatInteligente:
    """
    Sistema de chat inteligente que usa Claude API para responder
    preguntas sobre logística y ejecutar acciones.
    """

    def __init__(self):
        """Inicializa el cliente de Anthropic"""
        self.api_key = os.getenv('CLAUDE_API_KEY') or os.getenv('ANTHROPIC_API_KEY')

        if not self.api_key:
            logger.warning("CLAUDE_API_KEY no configurada - Chat IA no disponible")
            self.client = None
        else:
            self.client = Anthropic(api_key=self.api_key)
            logger.info("Cliente Claude inicializado correctamente")

        self.model = os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-20250514')
        self.max_tokens = int(os.getenv('CHAT_MAX_TOKENS', '2000'))

        # Patrones para detectar tipo de consulta
        self.patrones = {
            TipoConsulta.BUSCAR_GUIA: [
                r'guía?\s*(?:número|#|n[uú]mero)?\s*(\d{8,15})',
                r'busca(?:r)?\s*(?:la\s*)?guía?\s*(\d{8,15})',
                r'información\s*(?:de\s*)?(?:la\s*)?guía?\s*(\d{8,15})',
                r'estado\s*(?:de\s*)?(?:la\s*)?guía?\s*(\d{8,15})',
            ],
            TipoConsulta.CONSULTAR_TRANSPORTADORA: [
                r'(?:de\s*)?(interrapidisimo|envía?|coordinadora|tcc|servientrega|deprisa)',
                r'transportadora\s+(\w+)',
            ],
            TipoConsulta.CONSULTAR_CIUDAD: [
                r'(?:en|de|hacia|a)\s+(bogot[aá]|medell[ií]n|cali|barranquilla|bucaramanga|cartagena)',
                r'ciudad\s+(?:de\s+)?(\w+)',
            ],
            TipoConsulta.CONSULTAR_PERIODO: [
                r'(?:esta|la)\s*semana',
                r'(?:este|el)\s*mes',
                r'últimos?\s*(\d+)\s*días?',
                r'hoy',
                r'ayer',
            ],
            TipoConsulta.LISTAR_GUIAS: [
                r'(?:lista|muestra|dame|ver|mostrar)\s*(?:las|los)?\s*(?:guías?|envíos?)',
                r'(?:cuáles|cuántas)\s*guías?',
            ],
            TipoConsulta.COMPARAR_TRANSPORTADORAS: [
                r'compara(?:r)?(?:ción)?',
                r'(?:vs|versus|contra)',
                r'mejor\s*transportadora',
            ],
            TipoConsulta.ANALISIS_RETRASOS: [
                r'retrasos?',
                r'demorad[ao]s?',
                r'atrasad[ao]s?',
                r'tard[eí]os?',
                r'sin\s*movimiento',
            ],
            TipoConsulta.PREDICCION: [
                r'predice',
                r'predicción',
                r'probabilidad',
                r'va\s*a\s*(?:llegar|demorar|retrasar)',
            ],
            TipoConsulta.EJECUTAR_ACCION: [
                r'exporta(?:r)?',
                r'genera(?:r)?\s*(?:reporte|informe)',
                r'descarga(?:r)?',
                r'enví?a(?:r)?\s*(?:notificación|email|mensaje)',
                r'crea(?:r)?\s*alerta',
            ],
        }

    def _es_disponible(self) -> bool:
        """Verifica si el chat está disponible"""
        return self.client is not None

    def analizar_pregunta(self, pregunta: str) -> Tuple[TipoConsulta, Dict[str, Any]]:
        """
        Analiza la pregunta para determinar el tipo de consulta y extraer parámetros.

        Args:
            pregunta: Texto de la pregunta del usuario.

        Returns:
            Tupla con el tipo de consulta y parámetros extraídos.
        """
        pregunta_lower = pregunta.lower()
        parametros = {}

        # Buscar patrones en orden de prioridad
        for tipo, patrones in self.patrones.items():
            for patron in patrones:
                match = re.search(patron, pregunta_lower)
                if match:
                    # Extraer grupos capturados
                    if match.groups():
                        if tipo == TipoConsulta.BUSCAR_GUIA:
                            parametros['numero_guia'] = match.group(1)
                        elif tipo == TipoConsulta.CONSULTAR_TRANSPORTADORA:
                            parametros['transportadora'] = match.group(1).upper()
                        elif tipo == TipoConsulta.CONSULTAR_CIUDAD:
                            parametros['ciudad'] = match.group(1).title()
                        elif tipo == TipoConsulta.CONSULTAR_PERIODO:
                            if 'días' in pregunta_lower or 'dias' in pregunta_lower:
                                parametros['dias'] = int(match.group(1))

                    # Detectar período implícito
                    if 'hoy' in pregunta_lower:
                        parametros['periodo'] = 'hoy'
                    elif 'ayer' in pregunta_lower:
                        parametros['periodo'] = 'ayer'
                    elif 'semana' in pregunta_lower:
                        parametros['periodo'] = 'semana'
                    elif 'mes' in pregunta_lower:
                        parametros['periodo'] = 'mes'

                    return tipo, parametros

        # Por defecto, estadísticas generales
        return TipoConsulta.ESTADISTICAS_GENERALES, parametros

    def preparar_contexto(
        self,
        tipo_consulta: TipoConsulta,
        parametros: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """
        Prepara el contexto de datos para la consulta.

        Args:
            tipo_consulta: Tipo de consulta detectado.
            parametros: Parámetros extraídos.
            session: Sesión de base de datos.

        Returns:
            Diccionario con datos relevantes para el contexto.
        """
        contexto = {
            'tipo_consulta': tipo_consulta.value,
            'parametros': parametros,
            'datos': {},
        }

        try:
            if tipo_consulta == TipoConsulta.BUSCAR_GUIA:
                contexto['datos'] = self._buscar_guia(
                    parametros.get('numero_guia'), session
                )

            elif tipo_consulta == TipoConsulta.CONSULTAR_TRANSPORTADORA:
                contexto['datos'] = self._consultar_transportadora(
                    parametros.get('transportadora'), session
                )

            elif tipo_consulta == TipoConsulta.CONSULTAR_CIUDAD:
                contexto['datos'] = self._consultar_ciudad(
                    parametros.get('ciudad'), session
                )

            elif tipo_consulta in [TipoConsulta.ESTADISTICAS_GENERALES, TipoConsulta.GENERAL]:
                contexto['datos'] = self._obtener_estadisticas_generales(session)

            elif tipo_consulta == TipoConsulta.LISTAR_GUIAS:
                contexto['datos'] = self._listar_guias_filtradas(parametros, session)

            elif tipo_consulta == TipoConsulta.COMPARAR_TRANSPORTADORAS:
                contexto['datos'] = self._comparar_transportadoras(session)

            elif tipo_consulta == TipoConsulta.ANALISIS_RETRASOS:
                contexto['datos'] = self._analizar_retrasos(parametros, session)

        except Exception as e:
            logger.error(f"Error preparando contexto: {e}")
            contexto['error'] = str(e)

        return contexto

    def _obtener_estadisticas_generales(self, session: Session) -> Dict[str, Any]:
        """Obtiene estadísticas generales del sistema"""
        try:
            # Total de guías
            total_guias = session.query(func.count(GuiaHistorica.id)).scalar() or 0

            # Guías por estado
            guias_entregadas = session.query(func.count(GuiaHistorica.id)).filter(
                GuiaHistorica.estatus.ilike('%entregad%')
            ).scalar() or 0

            guias_retraso = session.query(func.count(GuiaHistorica.id)).filter(
                GuiaHistorica.tiene_retraso == True
            ).scalar() or 0

            guias_novedad = session.query(func.count(GuiaHistorica.id)).filter(
                GuiaHistorica.tiene_novedad == True
            ).scalar() or 0

            # Top transportadoras
            top_transportadoras = session.query(
                GuiaHistorica.transportadora,
                func.count(GuiaHistorica.id).label('total')
            ).filter(
                GuiaHistorica.transportadora.isnot(None)
            ).group_by(
                GuiaHistorica.transportadora
            ).order_by(
                func.count(GuiaHistorica.id).desc()
            ).limit(5).all()

            # Top ciudades
            top_ciudades = session.query(
                GuiaHistorica.ciudad_destino,
                func.count(GuiaHistorica.id).label('total')
            ).filter(
                GuiaHistorica.ciudad_destino.isnot(None)
            ).group_by(
                GuiaHistorica.ciudad_destino
            ).order_by(
                func.count(GuiaHistorica.id).desc()
            ).limit(5).all()

            # Promedio días tránsito
            avg_dias = session.query(
                func.avg(GuiaHistorica.dias_transito)
            ).filter(
                GuiaHistorica.dias_transito.isnot(None)
            ).scalar() or 0

            return {
                'total_guias': total_guias,
                'guias_entregadas': guias_entregadas,
                'guias_en_retraso': guias_retraso,
                'guias_con_novedad': guias_novedad,
                'tasa_entrega': round(guias_entregadas / total_guias * 100, 1) if total_guias > 0 else 0,
                'tasa_retraso': round(guias_retraso / total_guias * 100, 1) if total_guias > 0 else 0,
                'promedio_dias_transito': round(avg_dias, 1),
                'top_transportadoras': [
                    {'nombre': t[0], 'total': t[1]} for t in top_transportadoras
                ],
                'top_ciudades': [
                    {'ciudad': c[0], 'total': c[1]} for c in top_ciudades
                ],
            }

        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {e}")
            return {'error': str(e)}

    def _buscar_guia(self, numero_guia: str, session: Session) -> Dict[str, Any]:
        """Busca información de una guía específica"""
        if not numero_guia:
            return {'error': 'Número de guía no proporcionado'}

        guia = session.query(GuiaHistorica).filter(
            GuiaHistorica.numero_guia == numero_guia
        ).first()

        if not guia:
            return {
                'encontrada': False,
                'mensaje': f'No se encontró la guía {numero_guia}'
            }

        return {
            'encontrada': True,
            'guia': guia.to_dict(),
        }

    def _consultar_transportadora(self, nombre: str, session: Session) -> Dict[str, Any]:
        """Obtiene estadísticas de una transportadora"""
        if not nombre:
            return {'error': 'Transportadora no especificada'}

        # Buscar con LIKE para ser flexible
        filtro = GuiaHistorica.transportadora.ilike(f'%{nombre}%')

        total = session.query(func.count(GuiaHistorica.id)).filter(filtro).scalar() or 0
        entregas = session.query(func.count(GuiaHistorica.id)).filter(
            and_(filtro, GuiaHistorica.estatus.ilike('%entregad%'))
        ).scalar() or 0
        retrasos = session.query(func.count(GuiaHistorica.id)).filter(
            and_(filtro, GuiaHistorica.tiene_retraso == True)
        ).scalar() or 0
        novedades = session.query(func.count(GuiaHistorica.id)).filter(
            and_(filtro, GuiaHistorica.tiene_novedad == True)
        ).scalar() or 0

        avg_dias = session.query(func.avg(GuiaHistorica.dias_transito)).filter(
            and_(filtro, GuiaHistorica.dias_transito.isnot(None))
        ).scalar() or 0

        return {
            'transportadora': nombre,
            'total_guias': total,
            'entregas_exitosas': entregas,
            'guias_retraso': retrasos,
            'guias_novedad': novedades,
            'tasa_entrega': round(entregas / total * 100, 1) if total > 0 else 0,
            'tasa_retraso': round(retrasos / total * 100, 1) if total > 0 else 0,
            'promedio_dias': round(avg_dias, 1),
        }

    def _consultar_ciudad(self, ciudad: str, session: Session) -> Dict[str, Any]:
        """Obtiene estadísticas de una ciudad"""
        if not ciudad:
            return {'error': 'Ciudad no especificada'}

        filtro = GuiaHistorica.ciudad_destino.ilike(f'%{ciudad}%')

        total = session.query(func.count(GuiaHistorica.id)).filter(filtro).scalar() or 0
        entregas = session.query(func.count(GuiaHistorica.id)).filter(
            and_(filtro, GuiaHistorica.estatus.ilike('%entregad%'))
        ).scalar() or 0
        retrasos = session.query(func.count(GuiaHistorica.id)).filter(
            and_(filtro, GuiaHistorica.tiene_retraso == True)
        ).scalar() or 0

        # Por transportadora en esta ciudad
        por_transportadora = session.query(
            GuiaHistorica.transportadora,
            func.count(GuiaHistorica.id).label('total')
        ).filter(
            and_(filtro, GuiaHistorica.transportadora.isnot(None))
        ).group_by(
            GuiaHistorica.transportadora
        ).all()

        return {
            'ciudad': ciudad,
            'total_guias': total,
            'entregas_exitosas': entregas,
            'guias_retraso': retrasos,
            'tasa_entrega': round(entregas / total * 100, 1) if total > 0 else 0,
            'por_transportadora': [
                {'nombre': t[0], 'total': t[1]} for t in por_transportadora
            ],
        }

    def _listar_guias_filtradas(self, parametros: Dict, session: Session) -> Dict[str, Any]:
        """Lista guías según filtros"""
        query = session.query(GuiaHistorica)

        if parametros.get('transportadora'):
            query = query.filter(
                GuiaHistorica.transportadora.ilike(f"%{parametros['transportadora']}%")
            )

        if parametros.get('ciudad'):
            query = query.filter(
                GuiaHistorica.ciudad_destino.ilike(f"%{parametros['ciudad']}%")
            )

        if parametros.get('periodo') == 'hoy':
            hoy = datetime.now().date()
            query = query.filter(
                func.date(GuiaHistorica.fecha_generacion_guia) == hoy
            )
        elif parametros.get('periodo') == 'semana':
            hace_7_dias = datetime.now() - timedelta(days=7)
            query = query.filter(
                GuiaHistorica.fecha_generacion_guia >= hace_7_dias
            )

        # Limitar resultados
        guias = query.limit(20).all()

        return {
            'total_encontradas': query.count(),
            'mostrando': len(guias),
            'guias': [g.to_dict() for g in guias],
        }

    def _comparar_transportadoras(self, session: Session) -> Dict[str, Any]:
        """Compara rendimiento de todas las transportadoras"""
        comparativa = session.query(
            GuiaHistorica.transportadora,
            func.count(GuiaHistorica.id).label('total'),
            func.sum(
                func.cast(GuiaHistorica.tiene_retraso, Integer)
            ).label('retrasos'),
            func.avg(GuiaHistorica.dias_transito).label('avg_dias')
        ).filter(
            GuiaHistorica.transportadora.isnot(None)
        ).group_by(
            GuiaHistorica.transportadora
        ).all()

        from sqlalchemy import Integer

        resultados = []
        for t in comparativa:
            total = t[1] or 0
            retrasos = t[2] or 0
            tasa = round(retrasos / total * 100, 1) if total > 0 else 0

            resultados.append({
                'transportadora': t[0],
                'total_guias': total,
                'retrasos': retrasos,
                'tasa_retraso': tasa,
                'promedio_dias': round(t[3] or 0, 1),
                'calificacion': 'EXCELENTE' if tasa < 5 else 'BUENO' if tasa < 15 else 'REGULAR' if tasa < 25 else 'MALO'
            })

        # Ordenar por tasa de retraso
        resultados.sort(key=lambda x: x['tasa_retraso'])

        return {
            'comparativa': resultados,
            'mejor_transportadora': resultados[0] if resultados else None,
            'peor_transportadora': resultados[-1] if resultados else None,
        }

    def _analizar_retrasos(self, parametros: Dict, session: Session) -> Dict[str, Any]:
        """Analiza guías con retrasos"""
        query = session.query(GuiaHistorica).filter(
            GuiaHistorica.tiene_retraso == True
        )

        total_retrasos = query.count()

        # Por transportadora
        retrasos_por_transp = session.query(
            GuiaHistorica.transportadora,
            func.count(GuiaHistorica.id).label('total')
        ).filter(
            and_(
                GuiaHistorica.tiene_retraso == True,
                GuiaHistorica.transportadora.isnot(None)
            )
        ).group_by(
            GuiaHistorica.transportadora
        ).order_by(
            func.count(GuiaHistorica.id).desc()
        ).all()

        # Por ciudad
        retrasos_por_ciudad = session.query(
            GuiaHistorica.ciudad_destino,
            func.count(GuiaHistorica.id).label('total')
        ).filter(
            and_(
                GuiaHistorica.tiene_retraso == True,
                GuiaHistorica.ciudad_destino.isnot(None)
            )
        ).group_by(
            GuiaHistorica.ciudad_destino
        ).order_by(
            func.count(GuiaHistorica.id).desc()
        ).limit(10).all()

        # Guías críticas (más de 10 días)
        criticos = query.filter(GuiaHistorica.dias_retraso > 10).count()

        return {
            'total_retrasos': total_retrasos,
            'criticos': criticos,
            'por_transportadora': [
                {'nombre': t[0], 'total': t[1]} for t in retrasos_por_transp
            ],
            'por_ciudad': [
                {'ciudad': c[0], 'total': c[1]} for c in retrasos_por_ciudad
            ],
        }

    async def responder(
        self,
        pregunta: str,
        session: Session,
        usar_contexto: bool = True,
        session_id: Optional[str] = None,
        usuario: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Genera una respuesta para la pregunta del usuario.

        Args:
            pregunta: Texto de la pregunta.
            session: Sesión de base de datos.
            usar_contexto: Si debe consultar datos de la BD.
            session_id: ID de sesión para historial.
            usuario: Usuario que hace la pregunta.

        Returns:
            Diccionario con la respuesta y metadatos.
        """
        inicio = time.time()

        if not self._es_disponible():
            return {
                'respuesta': "El chat IA no está disponible. Por favor configura la API key de Claude.",
                'tipo_consulta': 'error',
                'datos_consultados': {},
                'sugerencias': [],
                'tokens_usados': 0,
                'tiempo_respuesta_ms': 0,
            }

        try:
            # Analizar pregunta
            tipo_consulta, parametros = self.analizar_pregunta(pregunta)
            logger.info(f"Tipo de consulta detectado: {tipo_consulta.value}")

            # Preparar contexto
            contexto = {}
            if usar_contexto:
                contexto = self.preparar_contexto(tipo_consulta, parametros, session)

            # Construir mensaje con contexto
            mensaje_usuario = f"""Pregunta del usuario: {pregunta}

DATOS DEL SISTEMA (usa estos datos para responder):
```json
{json.dumps(contexto, indent=2, default=str, ensure_ascii=False)}
```

Responde de forma clara, específica y profesional. Si detectas problemas, sugiere acciones."""

            # Llamar a Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": mensaje_usuario}
                ]
            )

            respuesta_texto = response.content[0].text
            tokens_usados = response.usage.input_tokens + response.usage.output_tokens

            tiempo_respuesta = (time.time() - inicio) * 1000  # en ms

            # Guardar conversación en BD
            conversacion = ConversacionChat(
                session_id=session_id,
                usuario=usuario or 'anonimo',
                pregunta_usuario=pregunta,
                respuesta_ia=respuesta_texto,
                tipo_consulta=tipo_consulta.value,
                metricas_usadas=contexto.get('datos', {}),
                tiempo_respuesta_segundos=tiempo_respuesta / 1000,
                tokens_usados=tokens_usados,
            )
            session.add(conversacion)
            session.commit()

            # Generar sugerencias de seguimiento
            sugerencias = self._generar_sugerencias(tipo_consulta, contexto)

            return {
                'respuesta': respuesta_texto,
                'tipo_consulta': tipo_consulta.value,
                'datos_consultados': contexto.get('datos', {}),
                'sugerencias': sugerencias,
                'tokens_usados': tokens_usados,
                'tiempo_respuesta_ms': round(tiempo_respuesta),
            }

        except Exception as e:
            logger.error(f"Error en chat: {e}")
            return {
                'respuesta': f"Ocurrió un error procesando tu consulta: {str(e)}",
                'tipo_consulta': 'error',
                'datos_consultados': {},
                'sugerencias': ['Intenta reformular tu pregunta', 'Verifica la conexión'],
                'tokens_usados': 0,
                'tiempo_respuesta_ms': (time.time() - inicio) * 1000,
            }

    def _generar_sugerencias(
        self,
        tipo_consulta: TipoConsulta,
        contexto: Dict
    ) -> List[str]:
        """Genera sugerencias de seguimiento basadas en el tipo de consulta"""
        sugerencias_base = {
            TipoConsulta.ESTADISTICAS_GENERALES: [
                "Muéstrame las guías con retraso",
                "Compara transportadoras",
                "¿Cuál es la mejor transportadora?",
            ],
            TipoConsulta.BUSCAR_GUIA: [
                "Muéstrame guías similares",
                "¿Cuántas guías tiene esta transportadora?",
                "Ver historial de esta ciudad",
            ],
            TipoConsulta.CONSULTAR_TRANSPORTADORA: [
                "Compara con otras transportadoras",
                "Muéstrame sus guías con retraso",
                "¿Cuál es su rendimiento esta semana?",
            ],
            TipoConsulta.CONSULTAR_CIUDAD: [
                "¿Cuál transportadora es mejor para esta ciudad?",
                "Muéstrame los retrasos en esta ciudad",
                "Compara con otras ciudades",
            ],
            TipoConsulta.ANALISIS_RETRASOS: [
                "Genera reporte de retrasos",
                "¿Cuáles guías son críticas?",
                "¿Qué transportadora tiene más retrasos?",
            ],
        }

        return sugerencias_base.get(tipo_consulta, [
            "Muéstrame estadísticas generales",
            "¿Cuántas guías tengo?",
            "Analiza los retrasos",
        ])


# Instancia global
chat_inteligente = ChatInteligente()
