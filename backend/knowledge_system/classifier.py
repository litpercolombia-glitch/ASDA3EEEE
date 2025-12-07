"""
CLASIFICADOR AUTOMÁTICO DE CONTENIDO
=====================================

Usa Claude para clasificar automáticamente contenido en categorías
relevantes para Litper (logística dropshipping).

El clasificador asigna:
- Categoría principal
- Subcategoría
- Tags relevantes
- Nivel de relevancia para Litper

Autor: Litper IA System
Versión: 1.0.0
"""

import os
import json
import re
from typing import Dict, List, Optional
from loguru import logger

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    logger.warning("anthropic no instalado, clasificador usará reglas")
    ANTHROPIC_AVAILABLE = False

from dotenv import load_dotenv

load_dotenv()


class ContentClassifier:
    """
    Clasificador automático de contenido usando IA.

    Taxonomía predefinida para Litper:
    - Logística: Transportadoras, Tracking, Novedades, etc.
    - Dropshipping: Proveedores, E-commerce, Marketing, etc.
    - Tecnología: APIs, Integraciones, IA, etc.
    - Operaciones: Procesos, Calidad, KPIs, etc.
    - Legal: Regulaciones, Contratos, Aduanas, etc.
    - Mercados: Colombia, Chile, Ecuador, etc.

    Ejemplo de uso:
        classifier = ContentClassifier()

        resultado = await classifier.clasificar(
            titulo="Guía de integración API Coordinadora",
            contenido="Este documento explica cómo integrar..."
        )

        print(resultado['categoria'])     # "Tecnología"
        print(resultado['subcategoria'])  # "APIs"
        print(resultado['tags'])          # ["coordinadora", "integración", "REST"]

    Tip: El clasificador usa IA si está disponible, sino reglas básicas.
    """

    def __init__(self):
        """Inicializa el clasificador con la taxonomía de Litper."""

        # Cliente Claude
        api_key = os.getenv('CLAUDE_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
        if ANTHROPIC_AVAILABLE and api_key:
            self.claude = Anthropic(api_key=api_key)
        else:
            self.claude = None
            logger.info("Clasificador usando modo reglas (sin IA)")

        # Taxonomía de categorías para Litper
        self.taxonomia = {
            "Logística": {
                "descripcion": "Todo sobre transporte, envíos y operaciones logísticas",
                "subcategorias": [
                    "Transportadoras",
                    "Tracking y Rastreo",
                    "Novedades y Problemas",
                    "Fulfillment",
                    "Last Mile",
                    "Rutas y Optimización",
                    "Tiempos de Entrega"
                ],
                "keywords": [
                    "envío", "transporte", "entrega", "guía", "paquete",
                    "tracking", "rastreo", "novedad", "retraso", "fulfillment",
                    "coordinadora", "servientrega", "interrapidisimo", "envia",
                    "deprisa", "tcc", "fedex", "dhl", "última milla"
                ]
            },
            "Dropshipping": {
                "descripcion": "Modelo de negocio y operaciones de dropshipping",
                "subcategorias": [
                    "Proveedores",
                    "E-commerce",
                    "Marketing Digital",
                    "Productos",
                    "Clientes y CRM",
                    "Precios y Márgenes",
                    "Plataformas"
                ],
                "keywords": [
                    "dropshipping", "proveedor", "producto", "tienda",
                    "shopify", "woocommerce", "mercado libre", "e-commerce",
                    "cliente", "pedido", "orden", "inventario", "catálogo",
                    "margen", "precio", "marketing", "ventas"
                ]
            },
            "Tecnología": {
                "descripcion": "Aspectos técnicos, desarrollo e integraciones",
                "subcategorias": [
                    "APIs y Webhooks",
                    "Integraciones",
                    "IA y Machine Learning",
                    "Automatización",
                    "Desarrollo Web",
                    "Base de Datos",
                    "Seguridad"
                ],
                "keywords": [
                    "api", "webhook", "integración", "código", "desarrollo",
                    "python", "javascript", "react", "fastapi", "base de datos",
                    "automatización", "bot", "ia", "machine learning", "modelo",
                    "endpoint", "rest", "json", "token", "autenticación"
                ]
            },
            "Operaciones": {
                "descripcion": "Procesos operativos y gestión del negocio",
                "subcategorias": [
                    "Procesos y SOP",
                    "Calidad",
                    "Mejora Continua",
                    "KPIs y Métricas",
                    "Gestión de Equipos",
                    "Atención al Cliente",
                    "Reportes"
                ],
                "keywords": [
                    "proceso", "procedimiento", "sop", "calidad", "mejora",
                    "kpi", "métrica", "indicador", "reporte", "dashboard",
                    "equipo", "gestión", "soporte", "ticket", "escalamiento",
                    "eficiencia", "productividad", "objetivo"
                ]
            },
            "Legal y Compliance": {
                "descripcion": "Aspectos legales, regulatorios y cumplimiento",
                "subcategorias": [
                    "Regulaciones",
                    "Contratos",
                    "Privacidad y Datos",
                    "Aduanas",
                    "Impuestos",
                    "Términos de Servicio",
                    "Políticas"
                ],
                "keywords": [
                    "legal", "contrato", "regulación", "ley", "norma",
                    "aduana", "importación", "exportación", "impuesto", "iva",
                    "privacidad", "datos personales", "habeas data", "gdpr",
                    "términos", "política", "devolución", "garantía"
                ]
            },
            "Mercados": {
                "descripcion": "Análisis por país y mercado específico",
                "subcategorias": [
                    "Colombia",
                    "Chile",
                    "Ecuador",
                    "Análisis de Mercado",
                    "Competencia",
                    "Tendencias",
                    "Expansión"
                ],
                "keywords": [
                    "colombia", "chile", "ecuador", "bogotá", "medellín",
                    "santiago", "quito", "guayaquil", "mercado", "competencia",
                    "tendencia", "análisis", "expansión", "latinoamérica",
                    "región", "ciudad", "cobertura"
                ]
            }
        }

    async def clasificar(
        self,
        titulo: str,
        contenido: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Clasifica contenido en categoría y subcategoría.

        Args:
            titulo: Título del contenido
            contenido: Texto completo a clasificar
            metadata: Información adicional (opcional)

        Returns:
            {
                'categoria': str,
                'subcategoria': str,
                'tags': list,
                'confianza': float (0-1),
                'razonamiento': str,
                'relevancia_litper': int (0-10)
            }

        Tip: El sistema usa IA para clasificación precisa.
        Si Claude no está disponible, usa reglas basadas en keywords.
        """

        logger.debug(f"Clasificando: {titulo[:50]}...")

        if self.claude:
            return await self._clasificar_con_ia(titulo, contenido, metadata)
        else:
            return self._clasificar_con_reglas(titulo, contenido)

    async def _clasificar_con_ia(
        self,
        titulo: str,
        contenido: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Clasificación usando Claude para mejor precisión.

        El modelo analiza el contenido en contexto de Litper
        y asigna la categoría más apropiada.
        """

        # Preparar taxonomía para el prompt
        taxonomia_str = self._formatear_taxonomia()

        try:
            response = self.claude.messages.create(
                model=os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-20250514'),
                max_tokens=1000,
                system=f"""
                Eres un experto clasificador de contenido para Litper,
                una plataforma de logística dropshipping que opera en
                Colombia, Chile y Ecuador.

                Tu trabajo es clasificar contenido en la categoría y
                subcategoría más apropiadas de la taxonomía.

                TAXONOMÍA DISPONIBLE:
                {taxonomia_str}

                REGLAS:
                1. Elige la categoría que MEJOR representa el tema principal
                2. La subcategoría debe ser específica al contenido
                3. Los tags deben ser palabras clave relevantes (5-8 tags)
                4. La confianza refleja qué tan seguro estás (0.0-1.0)
                5. La relevancia para Litper es del 0-10

                Responde SIEMPRE en JSON válido.
                """,
                messages=[{
                    "role": "user",
                    "content": f"""
                    Clasifica este contenido:

                    TÍTULO: {titulo}

                    CONTENIDO (primeros 2500 caracteres):
                    {contenido[:2500]}

                    {f"METADATA ADICIONAL: {json.dumps(metadata)}" if metadata else ""}

                    Responde SOLO en JSON con esta estructura exacta:
                    {{
                        "categoria": "una de las categorías principales",
                        "subcategoria": "subcategoría específica de esa categoría",
                        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
                        "confianza": 0.0-1.0,
                        "razonamiento": "breve explicación de por qué esta categoría",
                        "relevancia_litper": 0-10,
                        "aplicaciones": ["cómo Litper puede usar esto"]
                    }}
                    """
                }]
            )

            texto = response.content[0].text

            # Extraer JSON
            json_match = re.search(r'\{[\s\S]*\}', texto)
            if json_match:
                clasificacion = json.loads(json_match.group())
            else:
                raise ValueError("No se encontró JSON en respuesta")

            # Validar categoría
            clasificacion = self._validar_clasificacion(clasificacion)

            logger.success(
                f"✅ Clasificado: {clasificacion['categoria']} > "
                f"{clasificacion['subcategoria']} (conf: {clasificacion['confianza']})"
            )

            return clasificacion

        except Exception as e:
            logger.warning(f"Error con IA, usando reglas: {e}")
            return self._clasificar_con_reglas(titulo, contenido)

    def _clasificar_con_reglas(self, titulo: str, contenido: str) -> Dict:
        """
        Clasificación basada en reglas cuando IA no está disponible.

        Usa matching de keywords para determinar la categoría.

        Tip: Menos preciso que IA pero funciona sin conexión.
        """

        texto_completo = f"{titulo} {contenido}".lower()

        # Contar matches por categoría
        scores = {}

        for categoria, info in self.taxonomia.items():
            keywords = info.get('keywords', [])
            score = sum(1 for kw in keywords if kw.lower() in texto_completo)
            scores[categoria] = score

        # Categoría con más matches
        if max(scores.values()) > 0:
            categoria = max(scores, key=scores.get)
            max_score = scores[categoria]
        else:
            categoria = "Operaciones"  # Default
            max_score = 0

        # Determinar subcategoría
        subcategorias = self.taxonomia[categoria]['subcategorias']
        subcategoria = subcategorias[0]  # Primera por defecto

        # Buscar subcategoría por keywords
        for sub in subcategorias:
            if sub.lower() in texto_completo:
                subcategoria = sub
                break

        # Extraer tags (palabras frecuentes relevantes)
        tags = self._extraer_tags_simples(texto_completo)

        # Calcular confianza basada en matches
        total_keywords = sum(len(info.get('keywords', [])) for info in self.taxonomia.values())
        confianza = min(0.8, max_score / (total_keywords * 0.1)) if total_keywords > 0 else 0.3

        return {
            'categoria': categoria,
            'subcategoria': subcategoria,
            'tags': tags[:8],
            'confianza': round(confianza, 2),
            'razonamiento': f"Clasificado por {max_score} keywords coincidentes",
            'relevancia_litper': 5,  # Default medio
            'aplicaciones': []
        }

    def _extraer_tags_simples(self, texto: str) -> List[str]:
        """Extrae tags simples basado en palabras relevantes."""

        # Palabras a ignorar
        stopwords = {
            'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con',
            'para', 'por', 'que', 'se', 'al', 'es', 'son', 'como', 'más',
            'este', 'esta', 'estos', 'estas', 'su', 'sus', 'y', 'o', 'a'
        }

        # Extraer palabras
        palabras = re.findall(r'\b\w{4,}\b', texto.lower())

        # Contar frecuencia
        frecuencia = {}
        for palabra in palabras:
            if palabra not in stopwords:
                frecuencia[palabra] = frecuencia.get(palabra, 0) + 1

        # Top palabras
        tags = sorted(frecuencia.keys(), key=lambda x: frecuencia[x], reverse=True)

        return tags[:10]

    def _validar_clasificacion(self, clasificacion: Dict) -> Dict:
        """Valida y corrige la clasificación si es necesario."""

        # Verificar categoría existe
        if clasificacion.get('categoria') not in self.taxonomia:
            logger.warning(f"Categoría inválida: {clasificacion.get('categoria')}")
            clasificacion['categoria'] = 'Operaciones'

        # Verificar subcategoría
        subcats_validas = self.taxonomia[clasificacion['categoria']]['subcategorias']
        if clasificacion.get('subcategoria') not in subcats_validas:
            clasificacion['subcategoria'] = subcats_validas[0]

        # Asegurar campos requeridos
        clasificacion.setdefault('tags', [])
        clasificacion.setdefault('confianza', 0.5)
        clasificacion.setdefault('razonamiento', '')
        clasificacion.setdefault('relevancia_litper', 5)
        clasificacion.setdefault('aplicaciones', [])

        # Limitar tags
        clasificacion['tags'] = clasificacion['tags'][:10]

        # Rango de confianza
        clasificacion['confianza'] = max(0, min(1, float(clasificacion['confianza'])))

        # Rango de relevancia
        clasificacion['relevancia_litper'] = max(0, min(10, int(clasificacion['relevancia_litper'])))

        return clasificacion

    def _formatear_taxonomia(self) -> str:
        """Formatea la taxonomía para incluir en el prompt."""

        lineas = []

        for categoria, info in self.taxonomia.items():
            subcats = ', '.join(info['subcategorias'])
            lineas.append(f"- {categoria}: {subcats}")
            lineas.append(f"  ({info['descripcion']})")

        return '\n'.join(lineas)

    def get_categorias(self) -> List[str]:
        """Retorna lista de categorías disponibles."""
        return list(self.taxonomia.keys())

    def get_subcategorias(self, categoria: str) -> List[str]:
        """Retorna subcategorías de una categoría específica."""
        if categoria in self.taxonomia:
            return self.taxonomia[categoria]['subcategorias']
        return []

    def get_taxonomia_completa(self) -> Dict:
        """
        Retorna la taxonomía completa.

        Útil para mostrar opciones al usuario en la UI.
        """
        return {
            cat: {
                'descripcion': info['descripcion'],
                'subcategorias': info['subcategorias']
            }
            for cat, info in self.taxonomia.items()
        }

    async def sugerir_categoria(self, texto: str, n: int = 3) -> List[Dict]:
        """
        Sugiere las N categorías más probables para un texto.

        Args:
            texto: Fragmento de texto a analizar
            n: Número de sugerencias

        Returns:
            Lista de {categoria, subcategoria, probabilidad}

        Tip: Útil para autocompletar mientras el usuario escribe.
        """

        texto_lower = texto.lower()
        sugerencias = []

        for categoria, info in self.taxonomia.items():
            keywords = info.get('keywords', [])
            matches = sum(1 for kw in keywords if kw.lower() in texto_lower)

            if matches > 0:
                prob = min(0.95, matches * 0.15)
                subcategoria = info['subcategorias'][0]

                # Buscar subcategoría más específica
                for sub in info['subcategorias']:
                    if sub.lower() in texto_lower:
                        subcategoria = sub
                        prob = min(0.98, prob + 0.1)
                        break

                sugerencias.append({
                    'categoria': categoria,
                    'subcategoria': subcategoria,
                    'probabilidad': round(prob, 2),
                    'matches': matches
                })

        # Ordenar por probabilidad
        sugerencias.sort(key=lambda x: x['probabilidad'], reverse=True)

        return sugerencias[:n]


# ==================== PARA TESTING ====================

if __name__ == "__main__":
    import asyncio

    async def test():
        classifier = ContentClassifier()

        # Test clasificación
        resultado = await classifier.clasificar(
            titulo="Cómo integrar API de Coordinadora",
            contenido="""
            Este documento explica paso a paso cómo integrar la API REST
            de Coordinadora para automatizar el tracking de envíos.
            Incluye ejemplos de código en Python y manejo de webhooks.
            """
        )

        print("Resultado:")
        print(f"  Categoría: {resultado['categoria']}")
        print(f"  Subcategoría: {resultado['subcategoria']}")
        print(f"  Tags: {resultado['tags']}")
        print(f"  Confianza: {resultado['confianza']}")

        # Test sugerencias
        sugerencias = await classifier.sugerir_categoria("envío tracking coordinadora")
        print("\nSugerencias:")
        for s in sugerencias:
            print(f"  {s['categoria']} > {s['subcategoria']} ({s['probabilidad']})")

    asyncio.run(test())
