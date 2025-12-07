-- ============================================================
-- SCRIPT SQL PARA SISTEMA DE CONOCIMIENTO LITPER
-- ============================================================
--
-- Este script crea la tabla principal para almacenar conocimiento
-- con soporte para búsqueda semántica usando pgvector.
--
-- REQUISITOS:
-- 1. PostgreSQL 14+ instalado
-- 2. Extensión pgvector instalada
--
-- INSTALACIÓN DE PGVECTOR:
-- sudo apt install postgresql-14-pgvector  (Ubuntu/Debian)
-- brew install pgvector                     (macOS)
--
-- EJECUCIÓN:
-- psql -U litper_user -d litper_ml_db -f create_tables.sql
--
-- ============================================================

-- Habilitar extensión pgvector (si no existe)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLA PRINCIPAL: conocimiento
-- ============================================================
--
-- Almacena todo el conocimiento cargado desde múltiples fuentes.
-- Incluye embeddings vectoriales para búsqueda semántica.
--
-- TIP: Los embeddings son de dimensión 1536 (OpenAI ada-002)
-- ============================================================

CREATE TABLE IF NOT EXISTS conocimiento (
    -- Identificador único
    id SERIAL PRIMARY KEY,

    -- Hash único de la fuente (evita duplicados)
    hash_fuente VARCHAR(64) UNIQUE NOT NULL,

    -- Tipo de fuente: 'archivo', 'web', 'youtube', 'texto'
    fuente_tipo VARCHAR(50) NOT NULL,

    -- URL o ruta de la fuente original
    fuente_url TEXT,

    -- Título extraído o asignado
    titulo TEXT NOT NULL,

    -- Contenido completo procesado
    contenido TEXT,

    -- Resumen ejecutivo generado por IA
    resumen TEXT,

    -- Vector embedding para búsqueda semántica (1536 dimensiones)
    contenido_embedding VECTOR(1536),

    -- Clasificación automática
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),

    -- Tags/etiquetas (array de texto)
    tags TEXT[],

    -- Metadata adicional en formato JSON
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE,

    -- Control
    esta_activo BOOLEAN DEFAULT TRUE,
    veces_consultado INTEGER DEFAULT 0
);

-- ============================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================

-- Índice para búsqueda por hash (evitar duplicados)
CREATE INDEX IF NOT EXISTS idx_conocimiento_hash
ON conocimiento(hash_fuente);

-- Índice para búsqueda vectorial (coseno)
-- Usa IVFFlat para mejor rendimiento en datasets grandes
CREATE INDEX IF NOT EXISTS idx_conocimiento_embedding
ON conocimiento
USING ivfflat (contenido_embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para filtrar por categoría
CREATE INDEX IF NOT EXISTS idx_conocimiento_categoria
ON conocimiento(categoria);

-- Índice para filtrar por subcategoría
CREATE INDEX IF NOT EXISTS idx_conocimiento_subcategoria
ON conocimiento(subcategoria);

-- Índice para búsqueda por tipo de fuente
CREATE INDEX IF NOT EXISTS idx_conocimiento_tipo
ON conocimiento(fuente_tipo);

-- Índice GIN para búsqueda en tags (array)
CREATE INDEX IF NOT EXISTS idx_conocimiento_tags
ON conocimiento USING GIN(tags);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_conocimiento_fecha
ON conocimiento(fecha_carga DESC);

-- Índice para búsqueda en metadata JSON
CREATE INDEX IF NOT EXISTS idx_conocimiento_metadata
ON conocimiento USING GIN(metadata);

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para actualizar fecha de actualización
CREATE OR REPLACE FUNCTION actualizar_fecha_conocimiento()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar fecha
DROP TRIGGER IF EXISTS trigger_actualizar_conocimiento ON conocimiento;
CREATE TRIGGER trigger_actualizar_conocimiento
BEFORE UPDATE ON conocimiento
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_conocimiento();

-- Función para incrementar contador de consultas
CREATE OR REPLACE FUNCTION incrementar_consultas(conocimiento_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE conocimiento
    SET veces_consultado = veces_consultado + 1
    WHERE id = conocimiento_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista de estadísticas por categoría
CREATE OR REPLACE VIEW v_conocimiento_stats AS
SELECT
    categoria,
    subcategoria,
    COUNT(*) as total_documentos,
    SUM(veces_consultado) as total_consultas,
    MAX(fecha_carga) as ultima_carga
FROM conocimiento
WHERE esta_activo = TRUE
GROUP BY categoria, subcategoria
ORDER BY total_documentos DESC;

-- Vista de documentos más consultados
CREATE OR REPLACE VIEW v_conocimiento_popular AS
SELECT
    id,
    titulo,
    categoria,
    fuente_tipo,
    veces_consultado,
    fecha_carga
FROM conocimiento
WHERE esta_activo = TRUE
ORDER BY veces_consultado DESC
LIMIT 50;

-- Vista de documentos recientes
CREATE OR REPLACE VIEW v_conocimiento_reciente AS
SELECT
    id,
    titulo,
    categoria,
    subcategoria,
    fuente_tipo,
    LEFT(resumen, 200) as resumen_corto,
    fecha_carga
FROM conocimiento
WHERE esta_activo = TRUE
ORDER BY fecha_carga DESC
LIMIT 20;

-- ============================================================
-- DATOS INICIALES (CATEGORÍAS DE EJEMPLO)
-- ============================================================

-- Insertar un documento de ejemplo/bienvenida
INSERT INTO conocimiento (
    hash_fuente,
    fuente_tipo,
    fuente_url,
    titulo,
    contenido,
    resumen,
    categoria,
    subcategoria,
    tags,
    metadata
) VALUES (
    'bienvenida_sistema_conocimiento_litper',
    'texto',
    NULL,
    'Bienvenido al Sistema de Conocimiento Litper',
    'Este es el sistema de gestión de conocimiento de Litper.
    Aquí puedes cargar documentos, páginas web y videos de YouTube
    para que los agentes de IA aprendan y te ayuden mejor.

    FUNCIONALIDADES:
    - Carga de archivos (PDF, DOCX, TXT, etc.)
    - Extracción de páginas web
    - Transcripción de videos YouTube
    - Clasificación automática con IA
    - Búsqueda semántica

    CATEGORÍAS DISPONIBLES:
    - Logística: Envíos, tracking, novedades
    - Dropshipping: Proveedores, productos, clientes
    - Tecnología: APIs, integraciones, desarrollo
    - Operaciones: Procesos, KPIs, calidad
    - Legal: Regulaciones, contratos, aduanas
    - Mercados: Colombia, Chile, Ecuador',
    'Sistema de conocimiento para gestionar documentación y entrenar agentes IA de Litper.',
    'Operaciones',
    'Procesos y SOP',
    ARRAY['bienvenida', 'sistema', 'conocimiento', 'litper', 'ayuda'],
    '{"version": "1.0.0", "tipo": "sistema"}'::jsonb
) ON CONFLICT (hash_fuente) DO NOTHING;

-- ============================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE conocimiento IS 'Almacena conocimiento de múltiples fuentes para agentes IA de Litper';
COMMENT ON COLUMN conocimiento.hash_fuente IS 'Hash SHA256 de la fuente original para evitar duplicados';
COMMENT ON COLUMN conocimiento.contenido_embedding IS 'Vector de 1536 dimensiones para búsqueda semántica (OpenAI ada-002)';
COMMENT ON COLUMN conocimiento.tags IS 'Array de etiquetas para clasificación y filtrado';
COMMENT ON COLUMN conocimiento.metadata IS 'Información adicional en formato JSON';

-- ============================================================
-- GRANT PERMISOS
-- ============================================================

-- Asegurar que el usuario de la aplicación tenga permisos
GRANT ALL PRIVILEGES ON conocimiento TO litper_user;
GRANT ALL PRIVILEGES ON SEQUENCE conocimiento_id_seq TO litper_user;
GRANT SELECT ON v_conocimiento_stats TO litper_user;
GRANT SELECT ON v_conocimiento_popular TO litper_user;
GRANT SELECT ON v_conocimiento_reciente TO litper_user;

-- ============================================================
-- MENSAJE FINAL
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'TABLA DE CONOCIMIENTO CREADA EXITOSAMENTE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - conocimiento (principal)';
    RAISE NOTICE '';
    RAISE NOTICE 'Vistas creadas:';
    RAISE NOTICE '  - v_conocimiento_stats';
    RAISE NOTICE '  - v_conocimiento_popular';
    RAISE NOTICE '  - v_conocimiento_reciente';
    RAISE NOTICE '';
    RAISE NOTICE 'Índices creados:';
    RAISE NOTICE '  - idx_conocimiento_hash';
    RAISE NOTICE '  - idx_conocimiento_embedding (IVFFlat)';
    RAISE NOTICE '  - idx_conocimiento_categoria';
    RAISE NOTICE '  - idx_conocimiento_tags (GIN)';
    RAISE NOTICE '';
    RAISE NOTICE 'Para verificar: SELECT * FROM v_conocimiento_stats;';
    RAISE NOTICE '============================================================';
END $$;
