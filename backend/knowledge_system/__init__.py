"""
SISTEMA DE CONOCIMIENTO MULTI-FUENTE
=====================================

Este paquete gestiona la carga, procesamiento y clasificación automática
de conocimiento desde múltiples fuentes para los agentes IA de Litper.

Módulos:
- knowledge_manager: Gestor principal del sistema
- web_scraper: Extracción de contenido web
- youtube_processor: Procesamiento de videos YouTube
- document_parser: Parser de documentos (PDF, DOCX, TXT)
- classifier: Clasificación automática con IA

Uso:
    from knowledge_system import KnowledgeManager

    km = KnowledgeManager()
    resultado = await km.cargar_conocimiento(
        fuente="https://ejemplo.com",
        tipo="web"
    )
"""

from .knowledge_manager import KnowledgeManager
from .web_scraper import WebScraper
from .youtube_processor import YouTubeProcessor
from .document_parser import DocumentParser
from .classifier import ContentClassifier

__all__ = [
    'KnowledgeManager',
    'WebScraper',
    'YouTubeProcessor',
    'DocumentParser',
    'ContentClassifier'
]

__version__ = "1.0.0"
