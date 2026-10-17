// Oferta y datos de la landing — 17-oct-2026.
// Precios: investigación de 14 competidores (US$0,10–0,20 por prueba en planes de entrada) y TRM 3.170,46 del 16-oct-2026.
export const PLANS = [
  { id: 'basico', name: 'Básico', who: 'Para probar el canal con tus productos estrella', cop: 59900, usd: 19, items: ['300 pruebas con IA al mes', 'Botón en todos tus productos que se pueden probar', 'Cama, ventanas, comedor y ropa', 'Panel con pruebas y clics en comprar', 'Lleva el sello «Probador por Zynex»'], cta: 'Empezar gratis' },
  { id: 'crecimiento', rec: true, name: 'Crecimiento', who: 'Para tiendas que pautan todos los días', cop: 154900, usd: 49, items: ['1.500 pruebas con IA al mes', 'Todo lo de Básico, sin el sello de Zynex', '«Completa tu cama»: venta cruzada dentro del probador', 'Link del probador por producto para vender por WhatsApp', 'Soporte por WhatsApp el mismo día'], cta: 'Empezar gratis' },
  { id: 'escala', name: 'Escala', who: 'Para marcas con varias tiendas o países', cop: 469900, usd: 149, items: ['6.000 pruebas con IA al mes', 'Todo lo de Crecimiento', 'Hasta 3 tiendas o países', 'Instalación y ajustes hechos por nosotros', 'Soporte prioritario e informe mensual'], cta: 'Hablar con nosotros' },
];
export const OFFER = {
  lead: 'Empieza gratis 14 días con 100 pruebas. Sin tarjeta. Si no sigues, tu tienda queda con 30 pruebas gratis al mes.',
  garT: 'Vende o te devolvemos la plata',
  garS: 'Si en 60 días las ventas que llegan por el probador no suman 5 veces lo que pagaste, te devolvemos el 100 %. Solo pedimos que el botón esté activo en tus 10 productos más vendidos. Y si en los primeros 30 días no te gusta, te devolvemos el mes sin preguntas.',
  founderT: 'Precio de fundador: primeros 20 negocios, hasta el 27 de noviembre de 2026',
  founderS: 'Plan Crecimiento a $91.900 al mes (US$29) congelado para siempre mientras sigas activo, en vez de $154.900. Incluye la instalación hecha por nosotros en 48 horas, 500 pruebas extra el primer mes y un informe mensual con tus pruebas, clics en «Comprar» y los pedidos que cruzamos contigo.',
};
// Primero estudios independientes y retailers grandes (regla de la investigación); siempre con quién lo midió y cuándo.
// Referencias de la industria (realidad aumentada y 3D de otras empresas): se rotulan así en la landing, separadas de los resultados propios.
export const STATS = [
  { n: 'Casi 20 %', t: 'más alta fue la tasa de compra de quienes usaron realidad aumentada antes de comprar (160.400 clientes, app de cosméticos).', src: 'Tan, Chandukala y Reddy, Journal of Marketing (2022), estudio independiente', url: 'https://insight.kellogg.northwestern.edu/article/selling-niche-products-augmented-reality' },
  { n: 'Hasta −40 %', t: 'de devoluciones en los pilotos del probador 3D de Zalando; sus herramientas de talla evitaron el 8 % de las devoluciones por talla en 2025.', src: 'Zalando (2026), dato propio de Zalando', url: 'https://corporate.zalando.com/en/node/11013' },
  { n: '−36,9 %', t: 'de devoluciones en zapatos comprados con medición desde el celular (ZOZOMAT, feb–oct 2020).', src: 'ZOZO, Japón (2021), dato propio de ZOZO', url: 'https://corp.zozo.com/en/initiative/20211019-7006/' },
];
