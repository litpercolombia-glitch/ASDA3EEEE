/**
 * 🎓 CENTRO DE APRENDIZAJE IA - TAB
 * Sistema de aprendizaje autónomo que procesa cursos, videos y documentos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  Upload,
  Link,
  Video,
  FileText,
  Headphones,
  Mic,
  Book,
  Brain,
  Lightbulb,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Eye,
  Star,
  BarChart3,
  Folder,
  FolderOpen,
  ExternalLink,
  AlertCircle,
  Sparkles,
  BookOpen,
  Library,
  Award,
  Layers,
  Database,
  Bot,
  MessageSquare,
} from 'lucide-react';

import {
  getContenidos,
  getContenidosEnProceso,
  getConceptos,
  getRecomendaciones,
  getRecomendacionesPorPrioridad,
  getReportes,
  getAgentesAprendizaje,
  getBaseConocimiento,
  getEstadisticasAprendizaje,
  agregarContenido,
  procesarContenido,
  implementarRecomendacion,
  buscarEnConocimiento,
} from '../../services/learningSystemService';

import {
  ContenidoAprendizaje,
  TipoContenido,
  PlataformaOrigen,
  EstadoProcesamiento,
  CategoriaConocimiento,
  NivelPrioridadRecomendacion,
  EstadoRecomendacion,
  ConceptoClave,
  RecomendacionLitper,
  AgenteAprendiz,
  EstadisticasAprendizaje,
} from '../../types/learning';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════════

interface AprendizajeIATabProps {
  selectedCountry?: string;
}

type VistaActiva = 'dashboard' | 'agregar' | 'biblioteca' | 'recomendaciones' | 'agentes';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const AprendizajeIATab: React.FC<AprendizajeIATabProps> = ({ selectedCountry }) => {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('dashboard');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaConocimiento | null>(
    null
  );
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);

  // Datos
  const [contenidos, setContenidos] = useState<ContenidoAprendizaje[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoClave[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionLitper[]>([]);
  const [agentes, setAgentes] = useState<AgenteAprendiz[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAprendizaje | null>(null);

  const [cargando, setCargando] = useState(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR DATOS
  // ═══════════════════════════════════════════════════════════════════════════

  const cargarDatos = useCallback(() => {
    setCargando(true);
    try {
      setContenidos(getContenidos());
      setConceptos(getConceptos());
      setRecomendaciones(getRecomendaciones());
      setAgentes(getAgentesAprendizaje());
      setEstadisticas(getEstadisticasAprendizaje());
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 30000);
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 rounded-2xl p-6 mb-6 shadow-2xl border border-emerald-500/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl border border-white/20">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-white">Centro de Aprendizaje IA</h1>
                <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-sm font-bold rounded-full shadow-lg">
                  ACTIVO
                </span>
              </div>
              <p className="text-emerald-200/80 text-lg">
                Sistema que estudia cursos, videos y documentos automáticamente
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-emerald-300/70">
                <span className="flex items-center gap-1">
                  <Brain className="w-4 h-4 text-pink-400" />
                  {estadisticas?.conceptosTotales || 0} conceptos aprendidos
                </span>
                <span className="flex items-center gap-1">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  {estadisticas?.recomendacionesTotales || 0} recomendaciones
                </span>
              </div>
            </div>
          </div>

          {/* Botón agregar contenido */}
          <button
            onClick={() => setMostrarModalAgregar(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg"
          >
            <Upload className="w-5 h-5" />
            Agregar Contenido
          </button>
        </div>

        {/* Métricas */}
        {estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
            <MetricaCompacta
              icono={<Book className="w-5 h-5" />}
              valor={estadisticas.contenidosTotales}
              label="Contenidos"
              color="from-emerald-400 to-emerald-600"
            />
            <MetricaCompacta
              icono={<CheckCircle2 className="w-5 h-5" />}
              valor={estadisticas.contenidosCompletados}
              label="Procesados"
              color="from-green-400 to-green-600"
            />
            <MetricaCompacta
              icono={<RefreshCw className="w-5 h-5" />}
              valor={estadisticas.contenidosEnProceso}
              label="En Proceso"
              color="from-blue-400 to-blue-600"
            />
            <MetricaCompacta
              icono={<Clock className="w-5 h-5" />}
              valor={`${estadisticas.horasTotalesProcesadas.toFixed(0)}h`}
              label="Horas"
              color="from-purple-400 to-purple-600"
            />
            <MetricaCompacta
              icono={<Brain className="w-5 h-5" />}
              valor={estadisticas.conceptosTotales}
              label="Conceptos"
              color="from-pink-400 to-pink-600"
            />
            <MetricaCompacta
              icono={<Target className="w-5 h-5" />}
              valor={`${estadisticas.porcentajeAplicabilidad}%`}
              label="Aplicables"
              color="from-cyan-400 to-cyan-600"
            />
            <MetricaCompacta
              icono={<Lightbulb className="w-5 h-5" />}
              valor={estadisticas.recomendacionesTotales}
              label="Recomend."
              color="from-amber-400 to-amber-600"
            />
            <MetricaCompacta
              icono={<Zap className="w-5 h-5" />}
              valor={estadisticas.recomendacionesImplementadas}
              label="Implem."
              color="from-orange-400 to-orange-600"
            />
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  const renderNavegacion = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 mb-6 flex flex-wrap gap-2">
      {[
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'agregar', label: 'Agregar Contenido', icon: Upload },
        { id: 'biblioteca', label: 'Biblioteca', icon: Library },
        { id: 'recomendaciones', label: 'Recomendaciones', icon: Lightbulb },
        { id: 'agentes', label: 'Agentes Aprendices', icon: Bot },
      ].map((item) => {
        const Icon = item.icon;
        const isActive = vistaActiva === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setVistaActiva(item.id as VistaActiva)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              isActive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDashboard = () => {
    const contenidosEnProceso = getContenidosEnProceso();
    const recsInmediatas = getRecomendacionesPorPrioridad(NivelPrioridadRecomendacion.INMEDIATA);
    const recsAlta = getRecomendacionesPorPrioridad(NivelPrioridadRecomendacion.ALTA);
    const baseConocimiento = getBaseConocimiento();

    return (
      <div className="space-y-6">
        {/* Contenido en proceso */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <RefreshCw className="w-5 h-5" />
              <span className="font-semibold">Contenido en Proceso</span>
            </div>
            <span className="text-white font-bold">{contenidosEnProceso.length}</span>
          </div>

          <div className="p-4">
            {contenidosEnProceso.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p>No hay contenido procesándose</p>
                <button
                  onClick={() => setVistaActiva('agregar')}
                  className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                >
                  Agregar contenido
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {contenidosEnProceso.map((contenido) => (
                  <div key={contenido.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TipoContenidoIcono tipo={contenido.tipo} />
                        <span className="font-medium text-gray-800 dark:text-white">
                          {contenido.titulo}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{contenido.estado}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${contenido.progreso}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{contenido.progreso.toFixed(0)}% completado</span>
                      {contenido.estructura && (
                        <span>{contenido.estructura.totalVideos} videos</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biblioteca de conocimiento */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5" />
                <span className="font-semibold">Biblioteca de Conocimiento</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {Object.values(CategoriaConocimiento)
                .slice(0, 5)
                .map((cat) => {
                  const info = baseConocimiento.conocimientoPorCategoria?.[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategoriaSeleccionada(cat);
                        setVistaActiva('biblioteca');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-800 dark:text-white capitalize">
                          {cat.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{info?.fuentes || 0} fuentes</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              <button
                onClick={() => setVistaActiva('biblioteca')}
                className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium py-2"
              >
                Ver todas las categorías →
              </button>
            </div>
          </div>

          {/* Recomendaciones pendientes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Lightbulb className="w-5 h-5" />
                <span className="font-semibold">Recomendaciones Pendientes</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {recsInmediatas.length} urgentes
                </span>
                <span className="px-2 py-0.5 bg-amber-600 text-white text-xs font-bold rounded-full">
                  {recsAlta.length} altas
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {[...recsInmediatas, ...recsAlta].slice(0, 4).map((rec) => (
                <div key={rec.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.prioridad === NivelPrioridadRecomendacion.INMEDIATA
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {rec.prioridad}
                        </span>
                        <span className="text-xs text-gray-500">{rec.esfuerzoEstimado}</span>
                      </div>
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                        {rec.titulo}
                      </h4>
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {rec.impactoMetrica}
                      </p>
                    </div>
                    <button
                      onClick={() => implementarRecomendacion(rec.id)}
                      className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded hover:bg-emerald-600 transition-colors"
                    >
                      Implementar
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setVistaActiva('recomendaciones')}
                className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium py-2"
              >
                Ver todas las recomendaciones →
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas del mes */}
        {estadisticas?.ultimoMes && (
          <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-xl p-6 border border-emerald-500/20">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Impacto Último Mes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500">
                  {estadisticas.ultimoMes.contenidosProcesados}
                </div>
                <div className="text-sm text-gray-500">Cursos procesados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-500">
                  {estadisticas.ultimoMes.horasProcesadas}h
                </div>
                <div className="text-sm text-gray-500">Horas de contenido</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-500">
                  {estadisticas.ultimoMes.conceptosNuevos}
                </div>
                <div className="text-sm text-gray-500">Conceptos nuevos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {estadisticas.ultimoMes.recomendacionesImplementadas}
                </div>
                <div className="text-sm text-gray-500">Implementadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {estadisticas.ultimoMes.impactoMedido}
                </div>
                <div className="text-sm text-gray-500">Mejora medida</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER AGREGAR CONTENIDO - MEJORADO PARA MÚLTIPLES TIPOS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderAgregarContenido = () => {
    const [url, setUrl] = useState('');
    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState<TipoContenido>(TipoContenido.CURSO);
    const [procesando, setProcesando] = useState(false);
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
    const [modoEntrada, setModoEntrada] = useState<'url' | 'archivo'>('url');

    const handleAgregar = async () => {
      if (!url.trim() && !archivoSeleccionado) return;
      setProcesando(true);
      try {
        await agregarContenido(url || archivoSeleccionado?.name || '', tipo, titulo || undefined);
        setUrl('');
        setTitulo('');
        setArchivoSeleccionado(null);
        cargarDatos();
      } catch (error) {
        console.error('Error agregando contenido:', error);
      } finally {
        setProcesando(false);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setArchivoSeleccionado(e.target.files[0]);
        setTitulo(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    };

    // Tipos de contenido soportados
    const tiposContenido = [
      {
        tipo: TipoContenido.CURSO,
        icono: Video,
        label: 'Video/Curso',
        desc: 'YouTube, Udemy, Platzi',
        color: 'from-blue-500 to-indigo-500',
        ext: '.mp4, .webm',
      },
      {
        tipo: TipoContenido.PDF,
        icono: FileText,
        label: 'PDF/Documento',
        desc: 'PDFs, Word, Excel, PPT',
        color: 'from-red-500 to-pink-500',
        ext: '.pdf, .docx, .xlsx, .pptx',
      },
      {
        tipo: TipoContenido.AUDIO,
        icono: Headphones,
        label: 'Audio/Podcast',
        desc: 'MP3, podcasts, grabaciones',
        color: 'from-purple-500 to-violet-500',
        ext: '.mp3, .wav, .m4a',
      },
      {
        tipo: TipoContenido.ARTICULO,
        icono: BookOpen,
        label: 'Artículo/Web',
        desc: 'Blogs, artículos, wikis',
        color: 'from-green-500 to-emerald-500',
        ext: 'URL web',
      },
      {
        tipo: TipoContenido.IMAGEN,
        icono: Eye,
        label: 'Imagen/Diagrama',
        desc: 'Infografías, diagramas',
        color: 'from-amber-500 to-orange-500',
        ext: '.png, .jpg, .svg',
      },
      {
        tipo: TipoContenido.PRESENTACION,
        icono: Layers,
        label: 'Presentación',
        desc: 'PowerPoint, Google Slides',
        color: 'from-cyan-500 to-blue-500',
        ext: '.pptx, .key',
      },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <Upload className="w-7 h-7 text-emerald-500" />
          Agregar Nuevo Contenido
        </h2>

        {/* Explicación de cómo funciona */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl p-5 border border-emerald-200 dark:border-emerald-700">
          <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ¿Cómo funciona el Aprendizaje IA?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-emerald-800 dark:text-emerald-200">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </span>
              <p>
                <strong>Carga cualquier contenido:</strong> Videos, PDFs, enlaces web, audios,
                presentaciones
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </span>
              <p>
                <strong>IA analiza y extrae:</strong> Conceptos clave, mejores prácticas,
                metodologías
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </span>
              <p>
                <strong>Genera recomendaciones:</strong> Aplicables a tu operación logística
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                4
              </span>
              <p>
                <strong>Mejora continua:</strong> Los agentes aprenden y mejoran automáticamente
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Selector de tipo de contenido */}
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            1. Selecciona el tipo de contenido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {tiposContenido.map((item) => {
              const Icon = item.icono;
              const isSelected = tipo === item.tipo;
              return (
                <button
                  key={item.tipo}
                  onClick={() => setTipo(item.tipo)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-sm">{item.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  {isSelected && (
                    <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                      {item.ext}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selector de modo de entrada */}
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 mt-6">
            2. Proporciona el contenido
          </h3>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setModoEntrada('url')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                modoEntrada === 'url'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <Link className="w-5 h-5" />
              URL / Enlace
            </button>
            <button
              onClick={() => setModoEntrada('archivo')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                modoEntrada === 'archivo'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5" />
              Subir Archivo
            </button>
          </div>

          <div className="space-y-4">
            {modoEntrada === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL del contenido
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.udemy.com/course/... o cualquier URL"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Udemy, Platzi, Coursera, YouTube, Domestika, LinkedIn Learning, Blogs, Wikis,
                  cualquier página web
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subir archivo
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.wav,.m4a,.png,.jpg,.jpeg,.svg,.webp"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {archivoSeleccionado ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <p className="font-medium text-gray-800 dark:text-white">
                          {archivoSeleccionado.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-gray-600 dark:text-gray-300">
                          Arrastra un archivo o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, PowerPoint, Audio, Video, Imágenes (máx. 50MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título (opcional)
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Se detectará automáticamente si no lo especificas"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleAgregar}
              disabled={(!url.trim() && !archivoSeleccionado) || procesando}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {procesando ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Procesando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Procesar con IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formatos soportados */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Formatos Soportados
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-white mb-1">📄 Documentos</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-white mb-1">🎬 Video</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                MP4, WebM, YouTube, Vimeo, cursos online
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-white mb-1">🎧 Audio</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                MP3, WAV, M4A, podcasts, grabaciones
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-white mb-1">🌐 Web</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                Cualquier URL: blogs, artículos, wikis, documentación
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER BIBLIOTECA
  // ═══════════════════════════════════════════════════════════════════════════

  const renderBiblioteca = () => {
    const baseConocimiento = getBaseConocimiento();
    const conceptosFiltrados = categoriaSeleccionada
      ? conceptos.filter((c) => c.categoria === categoriaSeleccionada)
      : conceptos;

    const conceptosBusqueda = busqueda
      ? conceptosFiltrados.filter(
          (c) =>
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.descripcion.toLowerCase().includes(busqueda.toLowerCase())
        )
      : conceptosFiltrados;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Library className="w-7 h-7 text-purple-500" />
            Biblioteca de Conocimiento
          </h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en conocimiento..."
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !categoriaSeleccionada
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          {Object.values(CategoriaConocimiento)
            .slice(0, 8)
            .map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                  categoriaSeleccionada === cat
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
        </div>

        {/* Lista de conceptos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conceptosBusqueda.slice(0, 12).map((concepto) => (
            <div
              key={concepto.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    concepto.aplicableLitper
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {concepto.aplicableLitper ? 'Aplicable' : 'General'}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {concepto.categoria.replace(/_/g, ' ')}
                </span>
              </div>

              <h4 className="font-bold text-gray-800 dark:text-white mb-2">{concepto.nombre}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {concepto.descripcion}
              </p>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <span>Fuente: {concepto.fuenteTitulo.slice(0, 20)}...</span>
                <span>{concepto.vecesUsado} usos</span>
              </div>
            </div>
          ))}
        </div>

        {conceptosBusqueda.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No se encontraron conceptos</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER RECOMENDACIONES
  // ═══════════════════════════════════════════════════════════════════════════

  const renderRecomendaciones = () => {
    const recsPorPrioridad = {
      inmediatas: getRecomendacionesPorPrioridad(NivelPrioridadRecomendacion.INMEDIATA),
      altas: getRecomendacionesPorPrioridad(NivelPrioridadRecomendacion.ALTA),
      medias: getRecomendacionesPorPrioridad(NivelPrioridadRecomendacion.MEDIA),
      futuras: getRecomendacionesPorPrioridad(NivelPrioridadRecomendacion.FUTURA),
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <Lightbulb className="w-7 h-7 text-amber-500" />
          Recomendaciones para Litper
        </h2>

        {/* Resumen */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="text-3xl font-bold text-red-600">
              {recsPorPrioridad.inmediatas.length}
            </div>
            <div className="text-sm text-red-600/70">Prioridad Inmediata</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="text-3xl font-bold text-amber-600">{recsPorPrioridad.altas.length}</div>
            <div className="text-sm text-amber-600/70">Prioridad Alta</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-600">{recsPorPrioridad.medias.length}</div>
            <div className="text-sm text-blue-600/70">Prioridad Media</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="text-3xl font-bold text-gray-600">
              {recsPorPrioridad.futuras.length}
            </div>
            <div className="text-sm text-gray-600/70">Futuro</div>
          </div>
        </div>

        {/* Lista de recomendaciones */}
        <div className="space-y-4">
          {[...recsPorPrioridad.inmediatas, ...recsPorPrioridad.altas, ...recsPorPrioridad.medias]
            .slice(0, 10)
            .map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          rec.prioridad === NivelPrioridadRecomendacion.INMEDIATA
                            ? 'bg-red-100 text-red-700'
                            : rec.prioridad === NivelPrioridadRecomendacion.ALTA
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {rec.prioridad}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          rec.esfuerzoEstimado === 'bajo'
                            ? 'bg-green-100 text-green-700'
                            : rec.esfuerzoEstimado === 'medio'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        Esfuerzo {rec.esfuerzoEstimado}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          rec.estado === EstadoRecomendacion.IMPLEMENTADA
                            ? 'bg-green-100 text-green-700'
                            : rec.estado === EstadoRecomendacion.IMPLEMENTANDO
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rec.estado}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
                      {rec.titulo}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {rec.descripcion}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {rec.impactoMetrica}
                      </span>
                      <span className="text-gray-500">
                        Fuente: {rec.fuenteTitulo.slice(0, 30)}...
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => implementarRecomendacion(rec.id)}
                    disabled={rec.estado === EstadoRecomendacion.IMPLEMENTADA}
                    className="px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rec.estado === EstadoRecomendacion.IMPLEMENTADA
                      ? 'Implementada'
                      : 'Implementar'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER AGENTES
  // ═══════════════════════════════════════════════════════════════════════════

  const renderAgentes = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
        <Bot className="w-7 h-7 text-indigo-500" />
        Agentes Aprendices
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agentes.map((agente) => (
          <div
            key={agente.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  agente.estado === 'procesando'
                    ? 'bg-green-100 text-green-600'
                    : agente.estado === 'activo'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">{agente.nombre}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    agente.estado === 'procesando'
                      ? 'bg-green-100 text-green-700'
                      : agente.estado === 'activo'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {agente.estado}
                </span>
              </div>
            </div>

            {agente.tareaActual && (
              <p className="text-sm text-gray-500 mb-3 truncate">{agente.tareaActual}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="font-bold text-gray-800 dark:text-white">
                  {agente.contenidosProcesados}
                </div>
                <div className="text-gray-500">Contenidos</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="font-bold text-gray-800 dark:text-white">
                  {agente.horasProcesadas.toFixed(0)}h
                </div>
                <div className="text-gray-500">Horas</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  if (cargando && !estadisticas) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando Centro de Aprendizaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}
      {renderNavegacion()}

      {vistaActiva === 'dashboard' && renderDashboard()}
      {vistaActiva === 'agregar' && renderAgregarContenido()}
      {vistaActiva === 'biblioteca' && renderBiblioteca()}
      {vistaActiva === 'recomendaciones' && renderRecomendaciones()}
      {vistaActiva === 'agentes' && renderAgentes()}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

const MetricaCompacta: React.FC<{
  icono: React.ReactNode;
  valor: number | string;
  label: string;
  color: string;
}> = ({ icono, valor, label, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-3 text-center shadow-lg`}>
    <div className="text-white/80 mb-1 flex justify-center">{icono}</div>
    <div className="text-xl font-bold text-white">{valor}</div>
    <div className="text-xs text-white/70">{label}</div>
  </div>
);

const TipoContenidoIcono: React.FC<{ tipo: TipoContenido }> = ({ tipo }) => {
  const iconos: Record<TipoContenido, React.ReactNode> = {
    [TipoContenido.VIDEO]: <Video className="w-5 h-5 text-blue-500" />,
    [TipoContenido.CURSO]: <BookOpen className="w-5 h-5 text-indigo-500" />,
    [TipoContenido.PDF]: <FileText className="w-5 h-5 text-red-500" />,
    [TipoContenido.DOCUMENTO]: <FileText className="w-5 h-5 text-orange-500" />,
    [TipoContenido.AUDIO]: <Headphones className="w-5 h-5 text-purple-500" />,
    [TipoContenido.PODCAST]: <Mic className="w-5 h-5 text-pink-500" />,
    [TipoContenido.WEBINAR]: <Video className="w-5 h-5 text-teal-500" />,
    [TipoContenido.ARTICULO]: <FileText className="w-5 h-5 text-green-500" />,
    [TipoContenido.EBOOK]: <Book className="w-5 h-5 text-amber-500" />,
    [TipoContenido.PRESENTACION]: <FileText className="w-5 h-5 text-cyan-500" />,
  };
  return <>{iconos[tipo] || <FileText className="w-5 h-5 text-gray-500" />}</>;
};

export default AprendizajeIATab;
