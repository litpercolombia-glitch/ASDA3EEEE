-- ============================================================
-- SCRIPT SQL EXTENDIDO PARA SISTEMA DE CONOCIMIENTO LITPER
-- ============================================================
-- Extiende el sistema de conocimiento con tablas para:
-- - Procesos estructurados
-- - Pasos de procesos
-- - Reglas de negocio
-- - Plantillas de mensajes
-- - Fuentes procesadas
-- - Conversaciones del asistente
-- - Historial financiero
-- ============================================================

-- ============================================================
-- TABLA: knowledge_procesos
-- Almacena procesos estructurados con pasos
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_procesos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id INTEGER REFERENCES conocimiento(id) ON DELETE CASCADE,

    -- Identificacion
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    objetivo TEXT,

    -- Trigger del proceso
    trigger_descripcion TEXT,
    trigger_condiciones JSONB,

    -- Herramientas usadas
    herramientas TEXT[],

    -- Metricas
    metricas JSONB,

    -- Control
    activo BOOLEAN DEFAULT true,
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: knowledge_pasos
-- Pasos de cada proceso
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_pasos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proceso_id UUID REFERENCES knowledge_procesos(id) ON DELETE CASCADE,

    orden INTEGER NOT NULL,
    accion TEXT NOT NULL,

    -- Decision
    es_decision BOOLEAN DEFAULT false,
    pregunta TEXT,
    accion_si TEXT,
    accion_no TEXT,

    -- Notas
    notas TEXT,

    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: knowledge_reglas
-- Reglas de cada proceso
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_reglas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proceso_id UUID REFERENCES knowledge_procesos(id) ON DELETE CASCADE,

    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('siempre', 'nunca')),
    descripcion TEXT NOT NULL,
    importancia VARCHAR(20) CHECK (importancia IN ('critica', 'alta', 'media', 'baja')),

    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: knowledge_plantillas
-- Plantillas de mensaje
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proceso_id UUID REFERENCES knowledge_procesos(id) ON DELETE CASCADE,

    nombre VARCHAR(100) NOT NULL,
    contenido TEXT NOT NULL,
    cuando_usar TEXT,
    variables TEXT[],

    categoria VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    veces_usada INTEGER DEFAULT 0,

    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: knowledge_fuentes
-- Historial de fuentes procesadas
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_fuentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('documento', 'url', 'video', 'youtube', 'web', 'texto')),
    nombre TEXT,
    url TEXT,

    -- Contenido
    contenido_raw TEXT,
    contenido_procesado JSONB,

    -- Estado
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completado', 'error', 'pendiente_revision')),
    error_mensaje TEXT,

    -- Conocimiento generado
    knowledge_ids UUID[],

    -- Metadata
    metadata JSONB DEFAULT '{}',

    procesado_at TIMESTAMP WITH TIME ZONE,
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: assistant_conversaciones
-- Conversaciones del asistente
-- ============================================================
CREATE TABLE IF NOT EXISTS assistant_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,

    -- Metadata
    contexto VARCHAR(100),
    pantalla_actual VARCHAR(100),

    -- Resumen
    titulo TEXT,
    resumen TEXT,

    -- Estado
    activa BOOLEAN DEFAULT true,
    total_mensajes INTEGER DEFAULT 0,

    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: assistant_mensajes
-- Mensajes de conversacion
-- ============================================================
CREATE TABLE IF NOT EXISTS assistant_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID REFERENCES assistant_conversaciones(id) ON DELETE CASCADE,

    rol VARCHAR(20) NOT NULL CHECK (rol IN ('user', 'assistant', 'system')),
    contenido TEXT NOT NULL,

    -- Conocimiento usado
    knowledge_usado UUID[],

    -- Metadata
    metadata JSONB DEFAULT '{}',

    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: historial_financiero
-- Reportes financieros guardados
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_financiero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Periodo analizado
    fecha_analisis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    periodo_inicio DATE,
    periodo_fin DATE,

    -- Resumen
    resumen JSONB NOT NULL,
    reporte_completo JSONB NOT NULL,

    -- Metricas clave
    total_ventas DECIMAL(15,2),
    ganancia_bruta DECIMAL(15,2),
    ganancia_neta DECIMAL(15,2),
    margen_neto DECIMAL(5,2),

    -- Fuente de datos
    fuente_id UUID REFERENCES knowledge_fuentes(id),
    archivo_nombre TEXT,

    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: admin_configuracion
-- Configuracion del sistema de administracion
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    descripcion TEXT,
    actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_procesos_codigo ON knowledge_procesos(codigo);
CREATE INDEX IF NOT EXISTS idx_procesos_knowledge ON knowledge_procesos(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_pasos_proceso ON knowledge_pasos(proceso_id, orden);
CREATE INDEX IF NOT EXISTS idx_reglas_proceso ON knowledge_reglas(proceso_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_proceso ON knowledge_plantillas(proceso_id);
CREATE INDEX IF NOT EXISTS idx_fuentes_estado ON knowledge_fuentes(estado);
CREATE INDEX IF NOT EXISTS idx_fuentes_tipo ON knowledge_fuentes(tipo);
CREATE INDEX IF NOT EXISTS idx_fuentes_fecha ON knowledge_fuentes(creado_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversaciones_usuario ON assistant_conversaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_fecha ON assistant_conversaciones(creado_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON assistant_mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_financiero_fecha ON historial_financiero(fecha_analisis DESC);
CREATE INDEX IF NOT EXISTS idx_financiero_periodo ON historial_financiero(periodo_inicio, periodo_fin);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger para actualizar fecha en procesos
CREATE OR REPLACE FUNCTION update_procesos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_procesos_update
BEFORE UPDATE ON knowledge_procesos
FOR EACH ROW EXECUTE FUNCTION update_procesos_timestamp();

-- Trigger para actualizar contador de mensajes en conversacion
CREATE OR REPLACE FUNCTION update_conversacion_contador()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE assistant_conversaciones
    SET total_mensajes = total_mensajes + 1,
        actualizado_at = NOW()
    WHERE id = NEW.conversacion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mensaje_nuevo
AFTER INSERT ON assistant_mensajes
FOR EACH ROW EXECUTE FUNCTION update_conversacion_contador();

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Configuracion inicial del admin
INSERT INTO admin_configuracion (clave, valor, tipo, descripcion) VALUES
('admin_password_hash', 'pbkdf2:sha256:260000$salt$hash', 'password', 'Hash de la contrasena admin'),
('email_reportes', 'litpercolombia@gmail.com', 'email', 'Email para enviar reportes'),
('margen_bruto_meta', '40', 'number', 'Meta de margen bruto (%)'),
('tasa_entrega_meta', '85', 'number', 'Meta de tasa de entrega (%)'),
('costo_logistico_max', '15', 'number', 'Costo logistico maximo (%)'),
('roas_minimo', '3', 'number', 'ROAS minimo aceptable')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- VISTAS
-- ============================================================

-- Vista de procesos con estadisticas
CREATE OR REPLACE VIEW v_procesos_completos AS
SELECT
    p.id,
    p.codigo,
    p.nombre,
    p.objetivo,
    p.herramientas,
    p.activo,
    p.creado_at,
    COUNT(DISTINCT pa.id) as total_pasos,
    COUNT(DISTINCT r.id) as total_reglas,
    COUNT(DISTINCT pl.id) as total_plantillas
FROM knowledge_procesos p
LEFT JOIN knowledge_pasos pa ON pa.proceso_id = p.id
LEFT JOIN knowledge_reglas r ON r.proceso_id = p.id
LEFT JOIN knowledge_plantillas pl ON pl.proceso_id = p.id
GROUP BY p.id, p.codigo, p.nombre, p.objetivo, p.herramientas, p.activo, p.creado_at;

-- Vista de fuentes recientes
CREATE OR REPLACE VIEW v_fuentes_recientes AS
SELECT
    id,
    tipo,
    nombre,
    url,
    estado,
    creado_at,
    procesado_at
FROM knowledge_fuentes
ORDER BY creado_at DESC
LIMIT 50;

-- Vista de resumen financiero
CREATE OR REPLACE VIEW v_resumen_financiero AS
SELECT
    id,
    fecha_analisis,
    periodo_inicio,
    periodo_fin,
    total_ventas,
    ganancia_neta,
    margen_neto,
    archivo_nombre
FROM historial_financiero
ORDER BY fecha_analisis DESC
LIMIT 20;

-- ============================================================
-- FUNCIONES UTILES
-- ============================================================

-- Funcion para buscar conocimiento relevante
CREATE OR REPLACE FUNCTION buscar_conocimiento_relevante(
    query_text TEXT,
    limite INTEGER DEFAULT 5
)
RETURNS TABLE (
    id INTEGER,
    titulo TEXT,
    resumen TEXT,
    categoria VARCHAR,
    relevancia REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.titulo,
        c.resumen,
        c.categoria,
        ts_rank(
            to_tsvector('spanish', COALESCE(c.titulo, '') || ' ' || COALESCE(c.contenido, '')),
            plainto_tsquery('spanish', query_text)
        ) as relevancia
    FROM conocimiento c
    WHERE c.esta_activo = true
    AND to_tsvector('spanish', COALESCE(c.titulo, '') || ' ' || COALESCE(c.contenido, ''))
        @@ plainto_tsquery('spanish', query_text)
    ORDER BY relevancia DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Funcion para obtener contexto del asistente
CREATE OR REPLACE FUNCTION obtener_contexto_asistente(
    query_text TEXT,
    limite INTEGER DEFAULT 5
)
RETURNS TEXT AS $$
DECLARE
    contexto TEXT := '';
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT titulo, resumen, categoria
        FROM buscar_conocimiento_relevante(query_text, limite)
    LOOP
        contexto := contexto || E'\n---\n';
        contexto := contexto || '[' || UPPER(rec.categoria) || '] ' || rec.titulo || E'\n';
        contexto := contexto || rec.resumen || E'\n';
    END LOOP;

    RETURN contexto;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MENSAJE FINAL
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'TABLAS EXTENDIDAS CREADAS EXITOSAMENTE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Nuevas tablas:';
    RAISE NOTICE '  - knowledge_procesos';
    RAISE NOTICE '  - knowledge_pasos';
    RAISE NOTICE '  - knowledge_reglas';
    RAISE NOTICE '  - knowledge_plantillas';
    RAISE NOTICE '  - knowledge_fuentes';
    RAISE NOTICE '  - assistant_conversaciones';
    RAISE NOTICE '  - assistant_mensajes';
    RAISE NOTICE '  - historial_financiero';
    RAISE NOTICE '  - admin_configuracion';
    RAISE NOTICE '============================================================';
END $$;
