"""
PROCESADOR DE PÁGINAS WEB
=========================

Extrae contenido de páginas web, incluyendo sitios con login
y páginas que requieren JavaScript para renderizar.

Dependencias:
    pip install playwright beautifulsoup4 requests httpx
    playwright install

Autor: Litper IA System
Versión: 1.0.0
"""

import asyncio
from typing import Dict, Optional
from loguru import logger

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    logger.warning("playwright no instalado, funcionalidad reducida")
    PLAYWRIGHT_AVAILABLE = False

try:
    from bs4 import BeautifulSoup
except ImportError:
    logger.error("beautifulsoup4 no instalado")
    BeautifulSoup = None

try:
    import httpx
except ImportError:
    try:
        import requests as httpx
    except ImportError:
        logger.error("ni httpx ni requests instalados")
        httpx = None


class WebScraper:
    """
    Extrae contenido de páginas web.

    Soporta:
    - Páginas estáticas (requests simple)
    - Páginas dinámicas con JavaScript (Playwright)
    - Sitios con autenticación

    Ejemplo de uso:
        scraper = WebScraper()

        # Página simple
        contenido = await scraper.extraer("https://docs.ejemplo.com")

        # Página con login
        contenido = await scraper.extraer(
            "https://panel.ejemplo.com/dashboard",
            con_login=True,
            credenciales={
                'login_url': 'https://panel.ejemplo.com/login',
                'username': 'usuario',
                'password': 'contraseña'
            }
        )

    Tip: El scraper intenta primero con requests (más rápido).
    Si falla, usa Playwright para renderizar JavaScript.
    """

    def __init__(self):
        """Inicializa el scraper con configuración por defecto."""
        self.user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
        self.timeout = 30  # segundos

    async def extraer(
        self,
        url: str,
        con_login: bool = False,
        credenciales: Optional[Dict] = None
    ) -> str:
        """
        Extrae contenido de una URL.

        Args:
            url: URL a extraer
            con_login: Si requiere autenticación
            credenciales: Dict con datos de login:
                {
                    'login_url': URL del formulario de login,
                    'username': nombre de usuario,
                    'password': contraseña,
                    'username_selector': selector CSS (opcional),
                    'password_selector': selector CSS (opcional),
                    'submit_selector': selector CSS (opcional)
                }

        Returns:
            Contenido de texto limpio de la página

        Tip: Para sitios dinámicos, el sistema detecta automáticamente
        si necesita usar Playwright.
        """

        logger.info(f"🌐 Extrayendo contenido de: {url}")

        if con_login and credenciales:
            return await self._extraer_con_login(url, credenciales)
        else:
            return await self._extraer_simple(url)

    async def _extraer_simple(self, url: str) -> str:
        """
        Extracción simple sin autenticación.

        Intenta primero con requests (más rápido).
        Si el contenido parece incompleto, usa Playwright.

        Tip: Páginas SPA (React, Vue) requieren Playwright.
        """

        try:
            # INTENTO 1: Requests simple (más rápido)
            logger.debug(f"Intentando extracción simple de {url}")

            if httpx:
                if hasattr(httpx, 'AsyncClient'):
                    # httpx async
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        response = await client.get(
                            url,
                            headers={'User-Agent': self.user_agent},
                            follow_redirects=True
                        )
                        response.raise_for_status()
                        html = response.text
                else:
                    # requests sync
                    response = httpx.get(
                        url,
                        headers={'User-Agent': self.user_agent},
                        timeout=self.timeout
                    )
                    response.raise_for_status()
                    html = response.text
            else:
                raise Exception("No hay cliente HTTP disponible")

            # Parsear HTML
            if BeautifulSoup:
                soup = BeautifulSoup(html, 'html.parser')
                contenido = self._limpiar_html(soup)

                # Verificar si el contenido parece completo
                if len(contenido) > 100:
                    logger.success(f"✅ Contenido extraído ({len(contenido)} chars)")
                    return contenido
                else:
                    logger.debug("Contenido muy corto, intentando con Playwright")
                    raise Exception("Contenido incompleto")
            else:
                return html

        except Exception as e:
            logger.debug(f"Requests falló: {e}")

            if PLAYWRIGHT_AVAILABLE:
                logger.info("🎭 Intentando con Playwright (JavaScript)")
                return await self._extraer_con_playwright(url)
            else:
                raise Exception(f"No se pudo extraer {url}: {e}")

    async def _extraer_con_playwright(self, url: str) -> str:
        """
        Extracción con Playwright para páginas con JavaScript.

        Renderiza completamente la página antes de extraer.

        Tip: Útil para SPAs, dashboards y contenido dinámico.
        """

        if not PLAYWRIGHT_AVAILABLE:
            raise Exception("Playwright no está instalado")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )

            try:
                page = await browser.new_page(
                    user_agent=self.user_agent
                )

                # Navegar y esperar
                await page.goto(url, wait_until='networkidle', timeout=self.timeout * 1000)

                # Esperar un poco más para contenido dinámico
                await page.wait_for_timeout(2000)

                # Scroll para cargar contenido lazy
                await self._scroll_page(page)

                # Extraer HTML
                html = await page.content()

                if BeautifulSoup:
                    soup = BeautifulSoup(html, 'html.parser')
                    contenido = self._limpiar_html(soup)
                    logger.success(f"✅ Contenido Playwright ({len(contenido)} chars)")
                    return contenido
                else:
                    return html

            finally:
                await browser.close()

    async def _extraer_con_login(
        self,
        url: str,
        credenciales: Dict
    ) -> str:
        """
        Extracción de sitios que requieren login.

        Proceso:
        1. Navega a página de login
        2. Llena formulario
        3. Hace submit
        4. Navega a URL objetivo
        5. Extrae contenido

        Tip: Asegúrate de proporcionar selectores correctos
        para el formulario de tu sitio específico.
        """

        if not PLAYWRIGHT_AVAILABLE:
            raise Exception("Playwright requerido para login")

        logger.info(f"🔐 Extrayendo {url} con autenticación")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox']
            )

            try:
                context = await browser.new_context(
                    user_agent=self.user_agent
                )
                page = await context.new_page()

                # PASO 1: Ir a página de login
                login_url = credenciales.get('login_url')
                if not login_url:
                    raise ValueError("login_url es requerido en credenciales")

                logger.debug(f"Navegando a login: {login_url}")
                await page.goto(login_url, wait_until='networkidle')

                # PASO 2: Selectores de formulario
                username_selector = credenciales.get(
                    'username_selector',
                    'input[name="username"], input[name="email"], input[type="email"], #username, #email'
                )
                password_selector = credenciales.get(
                    'password_selector',
                    'input[name="password"], input[type="password"], #password'
                )
                submit_selector = credenciales.get(
                    'submit_selector',
                    'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Iniciar")'
                )

                # PASO 3: Llenar formulario
                username = credenciales.get('username')
                password = credenciales.get('password')

                if not username or not password:
                    raise ValueError("username y password son requeridos")

                await page.fill(username_selector, username)
                await page.fill(password_selector, password)

                # PASO 4: Submit
                await page.click(submit_selector)
                await page.wait_for_load_state('networkidle')
                await page.wait_for_timeout(2000)

                # Verificar si el login fue exitoso
                current_url = page.url
                if 'login' in current_url.lower() or 'error' in current_url.lower():
                    logger.warning("Login posiblemente falló")

                # PASO 5: Navegar a URL objetivo
                logger.debug(f"Navegando a: {url}")
                await page.goto(url, wait_until='networkidle')
                await page.wait_for_timeout(2000)

                # PASO 6: Extraer contenido
                html = await page.content()

                if BeautifulSoup:
                    soup = BeautifulSoup(html, 'html.parser')
                    contenido = self._limpiar_html(soup)
                    logger.success(f"✅ Contenido con login ({len(contenido)} chars)")
                    return contenido
                else:
                    return html

            finally:
                await browser.close()

    async def _scroll_page(self, page) -> None:
        """
        Hace scroll en la página para cargar contenido lazy.

        Tip: Muchos sitios cargan contenido al hacer scroll.
        """
        try:
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await page.wait_for_timeout(500)

            # Volver arriba
            await page.evaluate("window.scrollTo(0, 0)")
        except:
            pass

    def _limpiar_html(self, soup) -> str:
        """
        Limpia HTML y extrae solo texto relevante.

        Elimina:
        - Scripts y estilos
        - Navegación y footer
        - Elementos ocultos

        Extrae:
        - Contenido principal (main, article)
        - Encabezados
        - Párrafos
        - Listas

        Tip: El texto se formatea para fácil lectura.
        """

        if not soup:
            return ""

        # Eliminar elementos no deseados
        elementos_eliminar = [
            'script', 'style', 'noscript', 'iframe',
            'nav', 'footer', 'header', 'aside',
            'form', 'button', 'input', 'select',
            '[hidden]', '[aria-hidden="true"]',
            '.ad', '.advertisement', '.sidebar',
            '#cookie-banner', '.popup', '.modal'
        ]

        for selector in elementos_eliminar:
            try:
                for elem in soup.select(selector):
                    elem.decompose()
            except:
                pass

        # Intentar encontrar contenido principal
        contenido_principal = (
            soup.find('main') or
            soup.find('article') or
            soup.find('[role="main"]') or
            soup.find(class_='content') or
            soup.find(class_='main-content') or
            soup.find(id='content') or
            soup.find('body')
        )

        if contenido_principal:
            # Extraer texto con separadores
            texto = contenido_principal.get_text(separator='\n', strip=True)

            # Limpiar líneas vacías múltiples
            lineas = []
            linea_anterior_vacia = False

            for linea in texto.split('\n'):
                linea = linea.strip()

                if linea:
                    lineas.append(linea)
                    linea_anterior_vacia = False
                elif not linea_anterior_vacia:
                    lineas.append('')
                    linea_anterior_vacia = True

            texto_limpio = '\n'.join(lineas)

            # Limitar longitud máxima
            if len(texto_limpio) > 100000:
                texto_limpio = texto_limpio[:100000] + "\n\n[Contenido truncado...]"

            return texto_limpio

        return ""

    async def extraer_multiples(
        self,
        urls: list,
        max_concurrent: int = 5
    ) -> Dict[str, str]:
        """
        Extrae contenido de múltiples URLs concurrentemente.

        Args:
            urls: Lista de URLs a extraer
            max_concurrent: Máximo de extracciones simultáneas

        Returns:
            Dict {url: contenido}

        Tip: Útil para extraer documentación completa de un sitio.
        """

        resultados = {}
        semaforo = asyncio.Semaphore(max_concurrent)

        async def extraer_una(url: str):
            async with semaforo:
                try:
                    contenido = await self.extraer(url)
                    resultados[url] = contenido
                except Exception as e:
                    logger.warning(f"Error extrayendo {url}: {e}")
                    resultados[url] = f"ERROR: {str(e)}"

        await asyncio.gather(*[extraer_una(url) for url in urls])

        return resultados


# ==================== PARA TESTING ====================

if __name__ == "__main__":
    async def test():
        scraper = WebScraper()

        # Test simple
        print("Testing simple extraction...")
        try:
            contenido = await scraper.extraer("https://example.com")
            print(f"Contenido: {contenido[:500]}...")
        except Exception as e:
            print(f"Error: {e}")

    asyncio.run(test())
