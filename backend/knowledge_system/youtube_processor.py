"""
PROCESADOR DE VIDEOS YOUTUBE
=============================

Extrae transcripciones de videos de YouTube para incorporar
el conocimiento a la base de datos.

Dependencias:
    pip install youtube-transcript-api pytube

Autor: Litper IA System
Versión: 1.0.0
"""

import re
import asyncio
from typing import Dict, List, Optional
from loguru import logger

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    TRANSCRIPT_API_AVAILABLE = True
except ImportError:
    logger.warning("youtube-transcript-api no instalado")
    TRANSCRIPT_API_AVAILABLE = False

try:
    from pytube import YouTube
    PYTUBE_AVAILABLE = True
except ImportError:
    logger.warning("pytube no instalado")
    PYTUBE_AVAILABLE = False


class YouTubeProcessor:
    """
    Extrae transcripciones de videos de YouTube.

    Soporta:
    - URLs completas de YouTube
    - URLs cortas (youtu.be)
    - IDs de video directos
    - Múltiples idiomas (español, inglés, portugués)

    Ejemplo de uso:
        processor = YouTubeProcessor()

        # Con URL
        contenido = await processor.extraer_transcripcion(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        )

        # Con ID
        contenido = await processor.extraer_transcripcion("dQw4w9WgXcQ")

    Tip: Solo funcionan videos que tengan subtítulos/transcripción.
    Los videos sin subtítulos no se pueden procesar.
    """

    def __init__(self):
        """Inicializa el procesador de YouTube."""
        # Idiomas preferidos en orden de prioridad
        self.idiomas_preferidos = ['es', 'es-419', 'es-ES', 'en', 'en-US', 'pt', 'pt-BR']

    async def extraer_transcripcion(self, url_o_id: str) -> str:
        """
        Extrae transcripción completa de un video de YouTube.

        Args:
            url_o_id: URL completa o ID del video
                Formatos soportados:
                - https://www.youtube.com/watch?v=VIDEO_ID
                - https://youtu.be/VIDEO_ID
                - https://www.youtube.com/embed/VIDEO_ID
                - VIDEO_ID (11 caracteres)

        Returns:
            Transcripción completa con metadata del video

        Tip: La transcripción incluye timestamps cada minuto
        para facilitar la navegación.
        """

        if not TRANSCRIPT_API_AVAILABLE:
            raise ImportError("youtube-transcript-api no está instalado")

        # Extraer ID del video
        video_id = self._extraer_video_id(url_o_id)
        logger.info(f"📺 Extrayendo transcripción de video: {video_id}")

        try:
            # PASO 1: Obtener metadata del video
            metadata = await self._obtener_metadata(video_id)

            # PASO 2: Obtener transcripción
            transcripcion = await self._obtener_transcripcion_texto(video_id)

            # PASO 3: Formatear todo junto
            contenido_completo = self._formatear_contenido(
                metadata=metadata,
                transcripcion=transcripcion,
                video_id=video_id
            )

            logger.success(f"✅ Transcripción extraída ({len(contenido_completo)} chars)")
            return contenido_completo

        except Exception as e:
            logger.error(f"❌ Error extrayendo video: {str(e)}")
            raise

    def _extraer_video_id(self, url_o_id: str) -> str:
        """
        Extrae ID de video de una URL de YouTube.

        Soporta múltiples formatos de URL.

        Tip: Si pegas una URL incorrecta, el sistema
        intentará extraer el ID de todas formas.
        """

        url_o_id = url_o_id.strip()

        # Si ya es solo el ID (11 caracteres alfanuméricos)
        if re.match(r'^[a-zA-Z0-9_-]{11}$', url_o_id):
            return url_o_id

        # Patrones de URL de YouTube
        patterns = [
            # youtube.com/watch?v=
            r'(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})',
            # youtu.be/
            r'(?:youtu\.be\/)([a-zA-Z0-9_-]{11})',
            # youtube.com/embed/
            r'(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            # youtube.com/v/
            r'(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
            # youtube.com/shorts/
            r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
            # Patrón genérico
            r'(?:v=|\/|vi\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})',
        ]

        for pattern in patterns:
            match = re.search(pattern, url_o_id)
            if match:
                return match.group(1)

        raise ValueError(
            f"No se pudo extraer ID de video de: {url_o_id}\n"
            "Formatos soportados:\n"
            "- https://www.youtube.com/watch?v=VIDEO_ID\n"
            "- https://youtu.be/VIDEO_ID\n"
            "- VIDEO_ID (11 caracteres)"
        )

    async def _obtener_metadata(self, video_id: str) -> Dict:
        """
        Obtiene metadata del video usando pytube.

        Información extraída:
        - Título
        - Canal/Autor
        - Duración
        - Vistas
        - Fecha de publicación
        - Descripción

        Tip: Si pytube falla, se usan valores por defecto.
        """

        if not PYTUBE_AVAILABLE:
            logger.debug("pytube no disponible, usando metadata mínima")
            return self._metadata_minima(video_id)

        try:
            # Ejecutar en thread para no bloquear
            loop = asyncio.get_event_loop()
            yt = await loop.run_in_executor(
                None,
                lambda: YouTube(f'https://www.youtube.com/watch?v={video_id}')
            )

            # Formatear duración
            minutos = yt.length // 60
            segundos = yt.length % 60
            duracion = f"{minutos}:{segundos:02d}"

            # Formatear vistas
            vistas = f"{yt.views:,}".replace(',', '.') if yt.views else 'N/A'

            # Fecha de publicación
            fecha = yt.publish_date.strftime('%Y-%m-%d') if yt.publish_date else 'N/A'

            # Descripción (truncar si es muy larga)
            descripcion = yt.description or ''
            if len(descripcion) > 500:
                descripcion = descripcion[:500] + '...'

            return {
                'titulo': yt.title or f'Video {video_id}',
                'canal': yt.author or 'Desconocido',
                'duracion': duracion,
                'duracion_segundos': yt.length,
                'vistas': vistas,
                'fecha_publicacion': fecha,
                'descripcion': descripcion,
                'thumbnail': yt.thumbnail_url if hasattr(yt, 'thumbnail_url') else None
            }

        except Exception as e:
            logger.warning(f"Error obteniendo metadata con pytube: {e}")
            return self._metadata_minima(video_id)

    def _metadata_minima(self, video_id: str) -> Dict:
        """Retorna metadata mínima cuando pytube falla."""
        return {
            'titulo': f'Video de YouTube ({video_id})',
            'canal': 'Desconocido',
            'duracion': 'N/A',
            'duracion_segundos': 0,
            'vistas': 'N/A',
            'fecha_publicacion': 'N/A',
            'descripcion': '',
            'thumbnail': f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'
        }

    async def _obtener_transcripcion_texto(self, video_id: str) -> str:
        """
        Obtiene transcripción y la formatea como texto fluido.

        Proceso:
        1. Intenta obtener transcripción en idiomas preferidos
        2. Si no hay, intenta cualquier idioma disponible
        3. Formatea con timestamps cada minuto

        Tip: Los timestamps ayudan a localizar partes específicas
        del video al revisar la transcripción.
        """

        # Ejecutar API en thread
        loop = asyncio.get_event_loop()

        # Intentar con idiomas preferidos
        transcript_list = None
        idioma_usado = None

        for idioma in self.idiomas_preferidos:
            try:
                transcript_list = await loop.run_in_executor(
                    None,
                    lambda lang=idioma: YouTubeTranscriptApi.get_transcript(
                        video_id,
                        languages=[lang]
                    )
                )
                idioma_usado = idioma
                logger.debug(f"Transcripción obtenida en: {idioma}")
                break
            except Exception:
                continue

        # Si no hay en idiomas preferidos, intentar cualquiera
        if not transcript_list:
            try:
                # Obtener lista de transcripciones disponibles
                transcripts = await loop.run_in_executor(
                    None,
                    lambda: YouTubeTranscriptApi.list_transcripts(video_id)
                )

                # Intentar obtener cualquiera
                for transcript in transcripts:
                    try:
                        transcript_list = await loop.run_in_executor(
                            None,
                            transcript.fetch
                        )
                        idioma_usado = transcript.language_code
                        logger.debug(f"Transcripción obtenida en: {idioma_usado}")
                        break
                    except:
                        continue

            except Exception:
                pass

        if not transcript_list:
            raise ValueError(
                f"No hay transcripción disponible para el video {video_id}.\n"
                "Posibles causas:\n"
                "- El video no tiene subtítulos\n"
                "- Los subtítulos están deshabilitados\n"
                "- El video es privado o restringido"
            )

        # Formatear transcripción con timestamps
        return self._formatear_transcripcion(transcript_list, idioma_usado)

    def _formatear_transcripcion(
        self,
        transcript_list: List[Dict],
        idioma: Optional[str] = None
    ) -> str:
        """
        Formatea la transcripción como texto legible.

        Incluye timestamps cada minuto para fácil navegación.

        Formato:
            [0:00]
            Texto del primer minuto...

            [1:00]
            Texto del segundo minuto...
        """

        texto_formateado = []
        ultimo_minuto = -1

        if idioma:
            texto_formateado.append(f"[Idioma: {idioma}]\n")

        for entry in transcript_list:
            texto = entry.get('text', '').strip()
            start_seconds = int(entry.get('start', 0))
            minuto_actual = start_seconds // 60

            # Agregar timestamp cada nuevo minuto
            if minuto_actual > ultimo_minuto:
                segundos_display = start_seconds % 60
                texto_formateado.append(
                    f"\n[{minuto_actual}:{segundos_display:02d}]\n"
                )
                ultimo_minuto = minuto_actual

            # Agregar texto
            if texto:
                texto_formateado.append(texto + ' ')

        return ''.join(texto_formateado).strip()

    def _formatear_contenido(
        self,
        metadata: Dict,
        transcripcion: str,
        video_id: str
    ) -> str:
        """
        Combina metadata y transcripción en un documento completo.

        El formato está diseñado para ser fácil de procesar
        tanto por humanos como por sistemas de IA.
        """

        separador = "━" * 50

        contenido = f"""
{'═' * 50}
VIDEO DE YOUTUBE
{'═' * 50}

TÍTULO: {metadata['titulo']}
CANAL: {metadata['canal']}
DURACIÓN: {metadata['duracion']}
VISTAS: {metadata['vistas']}
FECHA: {metadata['fecha_publicacion']}
URL: https://www.youtube.com/watch?v={video_id}

{separador}
DESCRIPCIÓN
{separador}

{metadata['descripcion']}

{separador}
TRANSCRIPCIÓN
{separador}

{transcripcion}

{'═' * 50}
FIN DEL VIDEO
{'═' * 50}
"""

        return contenido.strip()

    async def obtener_info_video(self, url_o_id: str) -> Dict:
        """
        Obtiene solo la información del video (sin transcripción).

        Útil para verificar si un video existe y tiene subtítulos
        antes de procesarlo completamente.

        Returns:
            {
                'video_id': str,
                'titulo': str,
                'canal': str,
                'duracion': str,
                'tiene_transcripcion': bool,
                'idiomas_disponibles': list
            }

        Tip: Usa esto para validar videos antes de cargarlos.
        """

        video_id = self._extraer_video_id(url_o_id)
        metadata = await self._obtener_metadata(video_id)

        # Verificar transcripción
        idiomas_disponibles = []
        tiene_transcripcion = False

        if TRANSCRIPT_API_AVAILABLE:
            try:
                loop = asyncio.get_event_loop()
                transcripts = await loop.run_in_executor(
                    None,
                    lambda: YouTubeTranscriptApi.list_transcripts(video_id)
                )

                for t in transcripts:
                    idiomas_disponibles.append(t.language_code)
                    tiene_transcripcion = True

            except Exception:
                pass

        return {
            'video_id': video_id,
            'titulo': metadata['titulo'],
            'canal': metadata['canal'],
            'duracion': metadata['duracion'],
            'duracion_segundos': metadata['duracion_segundos'],
            'thumbnail': metadata.get('thumbnail'),
            'tiene_transcripcion': tiene_transcripcion,
            'idiomas_disponibles': idiomas_disponibles
        }

    async def extraer_multiples(
        self,
        urls: List[str],
        max_concurrent: int = 3
    ) -> Dict[str, str]:
        """
        Extrae transcripciones de múltiples videos.

        Args:
            urls: Lista de URLs de YouTube
            max_concurrent: Máximo de extracciones simultáneas

        Returns:
            Dict {url: contenido o error}

        Tip: Los videos se procesan en paralelo para mayor velocidad.
        """

        resultados = {}
        semaforo = asyncio.Semaphore(max_concurrent)

        async def extraer_uno(url: str):
            async with semaforo:
                try:
                    contenido = await self.extraer_transcripcion(url)
                    resultados[url] = contenido
                except Exception as e:
                    logger.warning(f"Error con {url}: {e}")
                    resultados[url] = f"ERROR: {str(e)}"

        await asyncio.gather(*[extraer_uno(url) for url in urls])

        return resultados


# ==================== PARA TESTING ====================

if __name__ == "__main__":
    async def test():
        processor = YouTubeProcessor()

        # Test con un video de ejemplo
        print("Obteniendo info de video...")
        try:
            info = await processor.obtener_info_video(
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            )
            print(f"Título: {info['titulo']}")
            print(f"Tiene transcripción: {info['tiene_transcripcion']}")
            print(f"Idiomas: {info['idiomas_disponibles']}")
        except Exception as e:
            print(f"Error: {e}")

    asyncio.run(test())
