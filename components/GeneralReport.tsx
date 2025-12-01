import React from 'react';
import { ReportStats, ShipmentStatus } from '../types';
import { PieChart, Clock, AlertTriangle, CheckCircle, TrendingUp, DollarSign, MapPin, AlertOctagon, Box, Truck, Home, SearchX } from 'lucide-react';

interface GeneralReportProps {
    stats: ReportStats;
    onFilter: (filterType: 'ALL' | 'ISSUES' | 'LONG_TRANSIT' | 'UNTRACKED' | ShipmentStatus) => void;
}

export const GeneralReport: React.FC<GeneralReportProps> = ({ stats, onFilter }) => {
    // Format currency
    const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

    // Helpers for status icons/colors
    const getStatusIcon = (status: string) => {
        switch(status) {
            case ShipmentStatus.DELIVERED: return <CheckCircle className="w-5 h-5 text-emerald-600" />;
            case ShipmentStatus.IN_TRANSIT: return <Truck className="w-5 h-5 text-blue-600" />;
            case ShipmentStatus.IN_OFFICE: return <Home className="w-5 h-5 text-amber-600" />;
            case ShipmentStatus.ISSUE: return <AlertTriangle className="w-5 h-5 text-red-600" />;
            default: return <Box className="w-5 h-5 text-slate-600" />;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Informe General de Logística</h2>
            </div>

            {/* MAIN STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div 
                    onClick={() => onFilter('ALL')}
                    className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:shadow-md transform hover:-translate-y-1"
                    title="Ver todas las guías"
                >
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Guías</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                </div>
                <div 
                     onClick={() => onFilter(ShipmentStatus.DELIVERED)}
                     className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all hover:shadow-md transform hover:-translate-y-1"
                     title="Filtrar Entregadas"
                >
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Entregadas</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.delivered}</p>
                </div>
                <div 
                    onClick={() => onFilter(ShipmentStatus.IN_TRANSIT)}
                    className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all hover:shadow-md transform hover:-translate-y-1"
                    title="Filtrar En Tránsito"
                >
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">En Tránsito</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.inTransit}</p>
                </div>
                <div 
                    onClick={() => onFilter('LONG_TRANSIT')}
                    className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all hover:shadow-md transform hover:-translate-y-1"
                    title="Filtrar guías demoradas (>5 días)"
                >
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Promedio Días</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.avgDays}</p>
                        <span className="text-sm text-amber-600">días</span>
                    </div>
                </div>
            </div>
            
            {/* UNTRACKED SUMMARY ALERT */}
            {stats.untrackedCount > 0 && (
                <div 
                    onClick={() => onFilter('UNTRACKED')}
                    className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm flex items-center justify-between"
                >
                    <div>
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-1">
                            <SearchX className="w-5 h-5" />
                            Guías No Vinculadas
                        </h3>
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {stats.untrackedCount} guías cargadas solo con resumen. Click para validar.
                        </p>
                    </div>
                    <div className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-white px-3 py-1 rounded-full text-xs font-bold">
                        Ver {stats.untrackedCount}
                    </div>
                </div>
            )}

            {/* STATUS BREAKDOWN GRID (NEW) */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                    <Box className="w-4 h-4 text-purple-500" /> Clasificación de Estados
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                        <div 
                            key={status}
                            onClick={() => onFilter(status as ShipmentStatus)}
                            className="bg-white dark:bg-navy-950 p-3 rounded-xl border border-slate-200 dark:border-navy-700 cursor-pointer hover:shadow-md hover:border-gold-500 transition-all flex items-center gap-3 transform hover:-translate-y-0.5"
                        >
                            <div className="p-2 rounded-full bg-slate-50 dark:bg-navy-800">
                                {getStatusIcon(status)}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{status}</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">{count}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FINANCIAL & ISSUES SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Financial Impact */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-900 dark:to-navy-950 p-5 rounded-xl border border-slate-200 dark:border-navy-700">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <DollarSign className="w-4 h-4 text-gold-600" /> Impacto Financiero (Est.)
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Recaudo Pendiente (En calle)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">{fmt(stats.totalValuePotential)}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-navy-800 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-gold-500 h-full w-[60%]"></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" /> Pérdida Proyectada (Fletes)
                            </span>
                            <span className="font-mono font-bold text-red-600">{fmt(stats.projectedLoss)}</span>
                        </div>
                    </div>
                </div>

                {/* Top Cities */}
                <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-slate-200 dark:border-navy-700">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <MapPin className="w-4 h-4 text-blue-500" /> Top Ciudades (Volumen)
                    </h3>
                    <div className="space-y-3">
                        {stats.topCitiesIssues && stats.topCitiesIssues.length > 0 ? (
                            stats.topCitiesIssues.map((cityData, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {idx + 1}. {cityData.city}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 bg-slate-100 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-blue-500 h-full rounded-full" 
                                                style={{ width: `${cityData.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-12 text-right">
                                            {cityData.count} ({cityData.percentage}%)
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">No hay suficientes datos aún.</p>
                        )}
                    </div>
                </div>
            </div>

            {stats.criticalPoints.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" /> Alertas Operativas (Click para filtrar)
                    </h3>
                    <ul className="space-y-2">
                        {stats.issues > 0 && (
                            <li 
                                onClick={() => onFilter('ISSUES')}
                                className="text-sm text-red-700 dark:text-red-200 flex items-start gap-2 hover:underline cursor-pointer"
                            >
                                <span className="block w-1.5 h-1.5 mt-1.5 bg-red-500 rounded-full"></span>
                                {stats.issues} guías presentan novedades o errores.
                            </li>
                        )}
                        {stats.criticalPoints.filter(p => p.includes('5 días')).map((point, index) => (
                            <li 
                                key={index} 
                                onClick={() => onFilter('LONG_TRANSIT')}
                                className="text-sm text-red-700 dark:text-red-200 flex items-start gap-2 hover:underline cursor-pointer"
                            >
                                <span className="block w-1.5 h-1.5 mt-1.5 bg-red-500 rounded-full"></span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};