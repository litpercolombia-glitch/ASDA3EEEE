"""
GESTOR PRINCIPAL DE CONOCIMIENTO
================================

Este módulo coordina la carga, procesamiento y clasificación
de conocimiento desde múltiples fuentes.

FUNCIONALIDADES:
- Cargar archivos (PDF, DOCX, TXT, etc)
- Procesar enlaces web
- Extraer transcripciones de YouTube
- Clasificar contenido automáticamente
- Almacenar en base de datos con embeddings

Autor: Litper IA System
Versión: 1.0.0
"""

import os
import sys
import json
import hashlib
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from loguru import logger

# Añadir el path del proyecto
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from anthropic import Anthropic
except ImportError:
    logger.warning("anthropic no instalado, usando modo simulado")
    Anthropic = None

try:
    import openai
except ImportError:
    logger.warning("openai no instalado para embeddings")
    openai = None

from dotenv import load_dotenv

load_dotenv()


class KnowledgeManager:
    """
    Gestor principal del sistema de conocimiento.

    Coordina todos los procesadores y gestiona el almacenamiento
    de conocimiento con búsqueda semántica.

    Ejemplo de uso:
        km = KnowledgeManager()
        resultado = await km.cargar_conocimiento(
            fuente="https://docs.ejemplo.com/api",
            tipo="web"
        )
        print(resultado['titulo'], resultado['categoria'])
    """

    def __init__(self):
        """Inicializa el gestor de conocimiento y sus componentes."""
        # Inicializar cliente Claude
        api_key = os.getenv('CLAUDE_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
        if Anthropic and api_key:
            self.claude = Anthropic(api_key=api_key)
        else:
            self.claude = None
            logger.warning("Claude API no disponible")

        # Inicializar procesadores (lazy loading)
        self._file_processor = None
        self._web_scraper = None
        self._youtube_processor = None
        self._document_parser = None
        self._classifier = None

        # Configuración de base de datos
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://litper_user:litper_pass@localhost:5432/litper_ml_db')
        self._engine = None

        # Configuración de embeddings
        self.embedding_model = "text-embedding-ada-002"
        self.embedding_dimension = 1536

        logger.info("KnowledgeManager inicializado")

    # ==================== PROPIEDADES LAZY ====================

    @property
    def web_scraper(self):
        """Carga el web scraper bajo demanda."""
        if self._web_scraper is None:
            from .web_scraper import WebScraper
            self._web_scraper = WebScraper()
        return self._web_scraper

    @property
    def youtube_processor(self):
        """Carga el procesador de YouTube bajo demanda."""
        if self._youtube_processor is None:
            from .youtube_processor import YouTubeProcessor
            self._youtube_processor = YouTubeProcessor()
        return self._youtube_processor

    @property
    def document_parser(self):
        """Carga el parser de documentos bajo demanda."""
        if self._document_parser is None:
            from .document_parser import DocumentParser
            self._document_parser = DocumentParser()
        return self._document_parser

    @property
    def classifier(self):
        """Carga el clasificador bajo demanda."""
        if self._classifier is None:
            from .classifier import ContentClassifier
            self._classifier = ContentClassifier()
        return self._classifier

    @property
    def engine(self):
        """Conexión a base de datos bajo demanda."""
        if self._engine is None:
            try:
                from sqlalchemy import create_engine
                self._engine = create_engine(
                    self.db_url,
                    pool_size=5,
                    max_overflow=10,
                    pool_pre_ping=True
                )
                logger.info("Conexión a BD de conocimiento establecida")
            except Exception as e:
                logger.error(f"Error conectando a BD: {e}")
                self._engine = None
        return self._engine

    # ==================== MÉTODOS PRINCIPALES ====================

    async def cargar_conocimiento(
        self,
        fuente: str,
        tipo: str,
        metadata: Optional[Dict] = None,
        opciones: Optional[Dict] = None
    ) -> Dict:
        """
        Punto de entrada principal para cargar conocimiento.

        Args:
            fuente: URL, ruta archivo, o ID de video
            tipo: 'archivo', 'web', 'youtube', 'documento'
            metadata: Información adicional opcional
            opciones: Configuración adicional del procesador

        Returns:
            {
                'success': True/False,
                'id': ID en base de datos,
                'titulo': Título extraído,
                'categoria': Categoría asignada,
                'subcategoria': Subcategoría,
                'tags': Lista de tags,
                'resumen': Resumen del contenido,
                'tokens': Cantidad de tokens procesados
            }

        Ejemplo:
            # Cargar página web
            resultado = await km.cargar_conocimiento(
                fuente="https://docs.coordinadora.com/api",
                tipo="web"
            )

            # Cargar video de YouTube
            resultado = await km.cargar_conocimiento(
                fuente="https://youtube.com/watch?v=abc123",
                tipo="youtube"
            )
        """

        logger.info(f"📥 Cargando conocimiento desde: {fuente} (tipo: {tipo})")
        opciones = opciones or {}

        try:
            # PASO 1: Verificar si ya existe (evitar duplicados)
            hash_fuente = self._generar_hash(fuente)
            if await self._existe_en_db(hash_fuente):
                logger.info(f"⚠️ Contenido ya existe en BD: {fuente}")
                return {
                    'success': False,
                    'error': 'El contenido ya existe en la base de conocimiento',
                    'duplicado': True
                }

            # PASO 2: Procesar según tipo de fuente
            contenido = await self._procesar_fuente(fuente, tipo, opciones)

            if not contenido or len(contenido.strip()) < 50:
                raise ValueError("Contenido extraído muy corto o vacío")

            # PASO 3: Extraer información con Claude
            info_extraida = await self._extraer_informacion(contenido, fuente)

            # PASO 4: Clasificar automáticamente
            clasificacion = await self.classifier.clasificar(
                titulo=info_extraida['titulo'],
                contenido=info_extraida['contenido']
            )

            # PASO 5: Generar embedding para búsqueda semántica
            embedding = await self._generar_embedding(info_extraida['contenido'])

            # PASO 6: Guardar en base de datos
            id_guardado = await self._guardar_en_db(
                hash_fuente=hash_fuente,
                fuente_tipo=tipo,
                fuente_url=fuente,
                titulo=info_extraida['titulo'],
                contenido=info_extraida['contenido'],
                resumen=info_extraida['resumen'],
                embedding=embedding,
                categoria=clasificacion['categoria'],
                subcategoria=clasificacion['subcategoria'],
                tags=clasificacion['tags'],
                metadata=metadata or {}
            )

            logger.success(f"✅ Conocimiento guardado con ID: {id_guardado}")

            return {
                'success': True,
                'id': id_guardado,
                'hash': hash_fuente,
                'titulo': info_extraida['titulo'],
                'categoria': clasificacion['categoria'],
                'subcategoria': clasificacion['subcategoria'],
                'tags': clasificacion['tags'],
                'resumen': info_extraida['resumen'],
                'puntos_clave': info_extraida.get('puntos_clave', []),
                'tokens': len(info_extraida['contenido'].split()),
                'confianza_clasificacion': clasificacion.get('confianza', 0.5)
            }

        except Exception as e:
            logger.error(f"❌ Error cargando conocimiento: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'fuente': fuente,
                'tipo': tipo
            }

    async def _procesar_fuente(
        self,
        fuente: str,
        tipo: str,
        opciones: Dict
    ) -> str:
        """
        Procesa la fuente según su tipo y extrae contenido.

        Tip: Cada procesador está optimizado para su tipo de fuente.
        Web: Usa Playwright para JavaScript, YouTube: Extrae subtítulos.
        """
        if tipo == 'archivo':
            return await self.document_parser.parsear_archivo(fuente)

        elif tipo == 'web':
            credenciales = opciones.get('credenciales')
            if credenciales:
                return await self.web_scraper.extraer(
                    fuente,
                    con_login=True,
                    credenciales=credenciales
                )
            return await self.web_scraper.extraer(fuente)

        elif tipo == 'youtube':
            return await self.youtube_processor.extraer_transcripcion(fuente)

        elif tipo == 'documento':
            return await self.document_parser.parsear(fuente)

        elif tipo == 'texto':
            # Texto directo (sin procesamiento)
            return fuente

        else:
            raise ValueError(f"Tipo de fuente no soportado: {tipo}")

    async def _extraer_informacion(self, contenido: str, fuente: str) -> Dict:
        """
        Usa Claude para extraer información estructurada del contenido.

        Extrae:
        - Título apropiado
        - Resumen ejecutivo
        - Puntos clave
        - Información relevante para Litper

        Tip: El contenido se trunca a 10K caracteres para eficiencia.
        """

        if not self.claude:
            # Modo fallback sin Claude
            return {
                'titulo': self._extraer_titulo_simple(contenido, fuente),
                'resumen': contenido[:500] + '...' if len(contenido) > 500 else contenido,
                'puntos_clave': [],
                'contenido': contenido
            }

        try:
            response = self.claude.messages.create(
                model=os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-20250514'),
                max_tokens=4000,
                system="""
                Eres un experto en analizar y estructurar información para
                Litper, plataforma de logística dropshipping que opera en
                Colombia, Chile y Ecuador.

                Tu trabajo es extraer información útil del contenido que te dan,
                enfocándote en lo que puede ser relevante para:
                - Operaciones logísticas
                - Tracking de envíos
                - Gestión de novedades
                - Optimización de entregas
                - Relación con transportadoras

                Responde SIEMPRE en formato JSON válido.
                """,
                messages=[{
                    "role": "user",
                    "content": f"""
                    Analiza este contenido y extrae información estructurada:

                    FUENTE: {fuente}

                    CONTENIDO (primeros 10000 caracteres):
                    {contenido[:10000]}

                    Responde en JSON con esta estructura exacta:
                    {{
                        "titulo": "título descriptivo (max 100 chars)",
                        "resumen": "resumen ejecutivo (200-300 palabras)",
                        "puntos_clave": ["punto 1", "punto 2", "punto 3"],
                        "relevancia_litper": 0-10,
                        "tipo_contenido": "tutorial|documentacion|caso_estudio|referencia|noticia|otro",
                        "aplicaciones": ["aplicación 1 para Litper", "aplicación 2"],
                        "contenido_limpio": "contenido sin basura HTML, bien formateado (max 5000 chars)"
                    }}
                    """
                }]
            )

            texto = response.content[0].text

            # Intentar parsear JSON
            import re
            json_match = re.search(r'\{[\s\S]*\}', texto)
            if json_match:
                info = json.loads(json_match.group())
            else:
                raise ValueError("No se encontró JSON en la respuesta")

            return {
                'titulo': info.get('titulo', 'Sin título')[:100],
                'resumen': info.get('resumen', '')[:1000],
                'puntos_clave': info.get('puntos_clave', [])[:10],
                'contenido': info.get('contenido_limpio', contenido)[:50000],
                'relevancia': info.get('relevancia_litper', 5),
                'tipo': info.get('tipo_contenido', 'otro'),
                'aplicaciones': info.get('aplicaciones', [])
            }

        except Exception as e:
            logger.warning(f"Error extrayendo info con Claude: {e}")
            return {
                'titulo': self._extraer_titulo_simple(contenido, fuente),
                'resumen': contenido[:500] + '...' if len(contenido) > 500 else contenido,
                'puntos_clave': [],
                'contenido': contenido
            }

    def _extraer_titulo_simple(self, contenido: str, fuente: str) -> str:
        """Extrae un título simple cuando Claude no está disponible."""
        # Intentar extraer de la primera línea
        primera_linea = contenido.split('\n')[0].strip()
        if len(primera_linea) > 10 and len(primera_linea) < 100:
            return primera_linea

        # Usar parte de la URL
        from urllib.parse import urlparse
        try:
            parsed = urlparse(fuente)
            path = parsed.path.strip('/').replace('-', ' ').replace('_', ' ')
            if path:
                return path[:100].title()
        except:
            pass

        return f"Contenido de {fuente[:50]}"

    async def _generar_embedding(self, texto: str) -> List[float]:
        """
        Genera embedding vectorial para búsqueda semántica.

        Usa OpenAI embeddings (text-embedding-ada-002) que son
        eficientes y de bajo costo para este propósito.

        Tip: El texto se trunca a ~8K tokens (30000 chars) automáticamente.
        """

        if not openai:
            logger.warning("OpenAI no disponible, retornando embedding vacío")
            return [0.0] * self.embedding_dimension

        try:
            # Configurar API key
            openai.api_key = os.getenv('OPENAI_API_KEY')

            if not openai.api_key:
                logger.warning("OPENAI_API_KEY no configurada")
                return [0.0] * self.embedding_dimension

            # Truncar si es muy largo
            texto_truncado = texto[:30000]

            # Generar embedding
            response = openai.Embedding.create(
                model=self.embedding_model,
                input=texto_truncado
            )

            return response['data'][0]['embedding']

        except Exception as e:
            logger.warning(f"Error generando embedding: {e}")
            return [0.0] * self.embedding_dimension

    def _generar_hash(self, fuente: str) -> str:
        """Genera hash único para la fuente."""
        return hashlib.sha256(fuente.encode()).hexdigest()[:32]

    async def _existe_en_db(self, hash_fuente: str) -> bool:
        """Verifica si el contenido ya existe en la base de datos."""
        if not self.engine:
            return False

        try:
            from sqlalchemy import text
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("SELECT id FROM conocimiento WHERE hash_fuente = :hash"),
                    {"hash": hash_fuente}
                )
                return result.fetchone() is not None
        except Exception as e:
            logger.debug(f"Error verificando existencia: {e}")
            return False

    async def _guardar_en_db(self, **kwargs) -> int:
        """
        Guarda el conocimiento en PostgreSQL con pgvector.

        La tabla 'conocimiento' debe existir con la extensión pgvector.
        Ver instrucciones de creación en la documentación.
        """

        if not self.engine:
            logger.warning("BD no disponible, guardando en memoria")
            return -1

        try:
            from sqlalchemy import text

            query = text("""
                INSERT INTO conocimiento (
                    hash_fuente, fuente_tipo, fuente_url, titulo, contenido,
                    resumen, contenido_embedding, categoria, subcategoria,
                    tags, metadata, fecha_carga
                ) VALUES (
                    :hash_fuente, :fuente_tipo, :fuente_url, :titulo, :contenido,
                    :resumen, :embedding::vector, :categoria, :subcategoria,
                    :tags, :metadata::jsonb, NOW()
                )
                RETURNING id
            """)

            with self.engine.connect() as conn:
                result = conn.execute(query, {
                    'hash_fuente': kwargs['hash_fuente'],
                    'fuente_tipo': kwargs['fuente_tipo'],
                    'fuente_url': kwargs['fuente_url'],
                    'titulo': kwargs['titulo'],
                    'contenido': kwargs['contenido'],
                    'resumen': kwargs['resumen'],
                    'embedding': str(kwargs['embedding']),
                    'categoria': kwargs['categoria'],
                    'subcategoria': kwargs['subcategoria'],
                    'tags': kwargs['tags'],
                    'metadata': json.dumps(kwargs.get('metadata', {}))
                })
                conn.commit()
                row = result.fetchone()
                return row[0] if row else -1

        except Exception as e:
            logger.error(f"Error guardando en BD: {e}")
            return -1

    # ==================== BÚSQUEDA ====================

    async def buscar_conocimiento(
        self,
        query: str,
        limite: int = 10,
        categoria: Optional[str] = None,
        umbral_similitud: float = 0.5
    ) -> List[Dict]:
        """
        Búsqueda semántica en la base de conocimiento.

        Args:
            query: Texto de búsqueda en lenguaje natural
            limite: Máximo de resultados
            categoria: Filtrar por categoría (opcional)
            umbral_similitud: Mínima similitud requerida (0-1)

        Returns:
            Lista de resultados ordenados por relevancia

        Ejemplo:
            resultados = await km.buscar_conocimiento(
                query="cómo rastrear envíos con Coordinadora",
                limite=5
            )
            for r in resultados:
                print(f"{r['titulo']} - Similitud: {r['similitud']}")

        Tip: Usa frases completas para mejor búsqueda semántica.
        """

        if not self.engine:
            logger.warning("BD no disponible para búsqueda")
            return []

        try:
            # Generar embedding de la query
            query_embedding = await self._generar_embedding(query)

            from sqlalchemy import text

            # Construir query SQL
            sql = """
                SELECT
                    id, titulo, resumen, categoria, subcategoria, tags,
                    fuente_tipo, fuente_url, fecha_carga,
                    1 - (contenido_embedding <=> :query_embedding::vector) as similitud
                FROM conocimiento
                WHERE 1=1
            """

            params = {
                'query_embedding': str(query_embedding),
                'limite': limite
            }

            if categoria:
                sql += " AND categoria = :categoria"
                params['categoria'] = categoria

            sql += """
                ORDER BY contenido_embedding <=> :query_embedding::vector
                LIMIT :limite
            """

            with self.engine.connect() as conn:
                result = conn.execute(text(sql), params)

                resultados = []
                for row in result:
                    similitud = float(row[9]) if row[9] else 0

                    if similitud >= umbral_similitud:
                        resultados.append({
                            'id': row[0],
                            'titulo': row[1],
                            'resumen': row[2],
                            'categoria': row[3],
                            'subcategoria': row[4],
                            'tags': row[5],
                            'fuente_tipo': row[6],
                            'fuente_url': row[7],
                            'fecha_carga': row[8].isoformat() if row[8] else None,
                            'similitud': round(similitud, 3)
                        })

                return resultados

        except Exception as e:
            logger.error(f"Error en búsqueda: {e}")
            return []

    async def obtener_conocimiento(self, id: int) -> Optional[Dict]:
        """
        Obtiene un conocimiento específico por ID.

        Tip: Incluye el contenido completo, ideal para usar con agentes IA.
        """

        if not self.engine:
            return None

        try:
            from sqlalchemy import text

            sql = text("""
                SELECT
                    id, titulo, contenido, resumen, categoria, subcategoria,
                    tags, fuente_tipo, fuente_url, metadata, fecha_carga
                FROM conocimiento
                WHERE id = :id
            """)

            with self.engine.connect() as conn:
                result = conn.execute(sql, {'id': id})
                row = result.fetchone()

                if row:
                    return {
                        'id': row[0],
                        'titulo': row[1],
                        'contenido': row[2],
                        'resumen': row[3],
                        'categoria': row[4],
                        'subcategoria': row[5],
                        'tags': row[6],
                        'fuente_tipo': row[7],
                        'fuente_url': row[8],
                        'metadata': row[9],
                        'fecha_carga': row[10].isoformat() if row[10] else None
                    }
                return None

        except Exception as e:
            logger.error(f"Error obteniendo conocimiento: {e}")
            return None

    async def listar_conocimiento(
        self,
        limite: int = 50,
        offset: int = 0,
        categoria: Optional[str] = None,
        orden: str = 'fecha_desc'
    ) -> Dict:
        """
        Lista conocimiento con paginación.

        Args:
            limite: Resultados por página
            offset: Saltar N resultados
            categoria: Filtrar por categoría
            orden: 'fecha_desc', 'fecha_asc', 'titulo_asc'

        Returns:
            {
                'items': [...],
                'total': N,
                'pagina': X,
                'paginas_totales': Y
            }

        Tip: Usa paginación para grandes volúmenes de conocimiento.
        """

        if not self.engine:
            return {'items': [], 'total': 0, 'pagina': 1, 'paginas_totales': 0}

        try:
            from sqlalchemy import text

            # Ordenamiento
            orden_sql = {
                'fecha_desc': 'fecha_carga DESC',
                'fecha_asc': 'fecha_carga ASC',
                'titulo_asc': 'titulo ASC'
            }.get(orden, 'fecha_carga DESC')

            # Query base
            where_clause = "WHERE 1=1"
            params = {'limite': limite, 'offset': offset}

            if categoria:
                where_clause += " AND categoria = :categoria"
                params['categoria'] = categoria

            # Contar total
            count_sql = text(f"SELECT COUNT(*) FROM conocimiento {where_clause}")
            with self.engine.connect() as conn:
                total = conn.execute(count_sql, params).scalar() or 0

            # Obtener items
            sql = text(f"""
                SELECT
                    id, titulo, resumen, categoria, subcategoria,
                    tags, fuente_tipo, fecha_carga
                FROM conocimiento
                {where_clause}
                ORDER BY {orden_sql}
                LIMIT :limite OFFSET :offset
            """)

            with self.engine.connect() as conn:
                result = conn.execute(sql, params)

                items = []
                for row in result:
                    items.append({
                        'id': row[0],
                        'titulo': row[1],
                        'resumen': row[2][:200] + '...' if row[2] and len(row[2]) > 200 else row[2],
                        'categoria': row[3],
                        'subcategoria': row[4],
                        'tags': row[5],
                        'fuente_tipo': row[6],
                        'fecha_carga': row[7].isoformat() if row[7] else None
                    })

            paginas_totales = (total + limite - 1) // limite
            pagina_actual = (offset // limite) + 1

            return {
                'items': items,
                'total': total,
                'pagina': pagina_actual,
                'paginas_totales': paginas_totales,
                'limite': limite
            }

        except Exception as e:
            logger.error(f"Error listando conocimiento: {e}")
            return {'items': [], 'total': 0, 'pagina': 1, 'paginas_totales': 0}

    async def eliminar_conocimiento(self, id: int) -> bool:
        """
        Elimina un conocimiento por ID.

        Precaución: Esta acción es irreversible.
        """

        if not self.engine:
            return False

        try:
            from sqlalchemy import text

            sql = text("DELETE FROM conocimiento WHERE id = :id")

            with self.engine.connect() as conn:
                result = conn.execute(sql, {'id': id})
                conn.commit()
                return result.rowcount > 0

        except Exception as e:
            logger.error(f"Error eliminando conocimiento: {e}")
            return False

    async def obtener_estadisticas(self) -> Dict:
        """
        Obtiene estadísticas del sistema de conocimiento.

        Returns:
            {
                'total_documentos': N,
                'por_categoria': {...},
                'por_tipo': {...},
                'ultimo_cargado': {...}
            }

        Tip: Usa estas estadísticas para monitorear el crecimiento
        de la base de conocimiento.
        """

        if not self.engine:
            return {
                'total_documentos': 0,
                'por_categoria': {},
                'por_tipo': {},
                'ultimo_cargado': None
            }

        try:
            from sqlalchemy import text

            stats = {}

            with self.engine.connect() as conn:
                # Total documentos
                stats['total_documentos'] = conn.execute(
                    text("SELECT COUNT(*) FROM conocimiento")
                ).scalar() or 0

                # Por categoría
                result = conn.execute(text("""
                    SELECT categoria, COUNT(*)
                    FROM conocimiento
                    WHERE categoria IS NOT NULL
                    GROUP BY categoria
                """))
                stats['por_categoria'] = {row[0]: row[1] for row in result}

                # Por tipo
                result = conn.execute(text("""
                    SELECT fuente_tipo, COUNT(*)
                    FROM conocimiento
                    WHERE fuente_tipo IS NOT NULL
                    GROUP BY fuente_tipo
                """))
                stats['por_tipo'] = {row[0]: row[1] for row in result}

                # Último cargado
                result = conn.execute(text("""
                    SELECT titulo, categoria, fecha_carga
                    FROM conocimiento
                    ORDER BY fecha_carga DESC
                    LIMIT 1
                """))
                row = result.fetchone()
                if row:
                    stats['ultimo_cargado'] = {
                        'titulo': row[0],
                        'categoria': row[1],
                        'fecha': row[2].isoformat() if row[2] else None
                    }
                else:
                    stats['ultimo_cargado'] = None

            return stats

        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {e}")
            return {
                'total_documentos': 0,
                'por_categoria': {},
                'por_tipo': {},
                'ultimo_cargado': None
            }


# ==================== SINGLETON ====================

_knowledge_manager_instance = None

def get_knowledge_manager() -> KnowledgeManager:
    """Obtiene instancia singleton del gestor de conocimiento."""
    global _knowledge_manager_instance
    if _knowledge_manager_instance is None:
        _knowledge_manager_instance = KnowledgeManager()
    return _knowledge_manager_instance


# ==================== PARA TESTING ====================

if __name__ == "__main__":
    import asyncio

    async def test():
        km = get_knowledge_manager()

        # Test carga de texto
        resultado = await km.cargar_conocimiento(
            fuente="Este es un texto de prueba sobre logística dropshipping",
            tipo="texto",
            metadata={"test": True}
        )

        print(f"Resultado: {resultado}")

        # Test búsqueda
        resultados = await km.buscar_conocimiento("logística")
        print(f"Búsqueda: {resultados}")

        # Test estadísticas
        stats = await km.obtener_estadisticas()
        print(f"Estadísticas: {stats}")

    asyncio.run(test())
