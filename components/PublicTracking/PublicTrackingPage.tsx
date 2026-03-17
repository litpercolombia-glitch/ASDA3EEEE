import React, { useState } from "react";
import {
  Search,
  Truck,
  Package,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface PublicTrackingPageProps {
  onBackToApp?: () => void;
}

interface TimelineStep {
  label: string;
  icon: React.ElementType;
  color: "green" | "blue" | "amber";
  date: string;
  time: string;
  completed: boolean;
}

interface TrackingResult {
  trackingNumber: string;
  carrier: string;
  originCity: string;
  destinationCity: string;
  estimatedDelivery: string;
  status: string;
  statusColor: "green" | "blue" | "amber" | "red";
  timeline: TimelineStep[];
}

const MOCK_RESULTS: Record<string, TrackingResult> = {
  "LIT-2026-001234": {
    trackingNumber: "LIT-2026-001234",
    carrier: "FedEx Express",
    originCity: "Ciudad de Mexico, CDMX",
    destinationCity: "Monterrey, NL",
    estimatedDelivery: "19 de Marzo, 2026",
    status: "En transito",
    statusColor: "blue",
    timeline: [
      {
        label: "Guia recibida",
        icon: CheckCircle,
        color: "green",
        date: "15 Mar 2026",
        time: "09:30",
        completed: true,
      },
      {
        label: "En proceso de recoleccion",
        icon: Package,
        color: "blue",
        date: "15 Mar 2026",
        time: "14:15",
        completed: true,
      },
      {
        label: "En transito",
        icon: Truck,
        color: "blue",
        date: "16 Mar 2026",
        time: "06:00",
        completed: true,
      },
      {
        label: "En centro de distribucion",
        icon: MapPin,
        color: "blue",
        date: "",
        time: "",
        completed: false,
      },
      {
        label: "En camino al destino",
        icon: ArrowRight,
        color: "amber",
        date: "",
        time: "",
        completed: false,
      },
      {
        label: "Entregado",
        icon: CheckCircle,
        color: "green",
        date: "",
        time: "",
        completed: false,
      },
    ],
  },
  "LIT-2026-005678": {
    trackingNumber: "LIT-2026-005678",
    carrier: "DHL Express",
    originCity: "Guadalajara, JAL",
    destinationCity: "Cancun, QR",
    estimatedDelivery: "17 de Marzo, 2026",
    status: "Entregado",
    statusColor: "green",
    timeline: [
      {
        label: "Guia recibida",
        icon: CheckCircle,
        color: "green",
        date: "12 Mar 2026",
        time: "08:00",
        completed: true,
      },
      {
        label: "En proceso de recoleccion",
        icon: Package,
        color: "blue",
        date: "12 Mar 2026",
        time: "11:45",
        completed: true,
      },
      {
        label: "En transito",
        icon: Truck,
        color: "blue",
        date: "13 Mar 2026",
        time: "05:30",
        completed: true,
      },
      {
        label: "En centro de distribucion",
        icon: MapPin,
        color: "blue",
        date: "14 Mar 2026",
        time: "10:00",
        completed: true,
      },
      {
        label: "En camino al destino",
        icon: ArrowRight,
        color: "amber",
        date: "14 Mar 2026",
        time: "13:20",
        completed: true,
      },
      {
        label: "Entregado",
        icon: CheckCircle,
        color: "green",
        date: "14 Mar 2026",
        time: "16:05",
        completed: true,
      },
    ],
  },
  "LIT-2026-009999": {
    trackingNumber: "LIT-2026-009999",
    carrier: "Estafeta",
    originCity: "Puebla, PUE",
    destinationCity: "Merida, YUC",
    estimatedDelivery: "20 de Marzo, 2026",
    status: "En camino al destino",
    statusColor: "amber",
    timeline: [
      {
        label: "Guia recibida",
        icon: CheckCircle,
        color: "green",
        date: "14 Mar 2026",
        time: "10:00",
        completed: true,
      },
      {
        label: "En proceso de recoleccion",
        icon: Package,
        color: "blue",
        date: "14 Mar 2026",
        time: "16:30",
        completed: true,
      },
      {
        label: "En transito",
        icon: Truck,
        color: "blue",
        date: "15 Mar 2026",
        time: "04:00",
        completed: true,
      },
      {
        label: "En centro de distribucion",
        icon: MapPin,
        color: "blue",
        date: "16 Mar 2026",
        time: "09:15",
        completed: true,
      },
      {
        label: "En camino al destino",
        icon: ArrowRight,
        color: "amber",
        date: "17 Mar 2026",
        time: "07:45",
        completed: true,
      },
      {
        label: "Entregado",
        icon: CheckCircle,
        color: "green",
        date: "",
        time: "",
        completed: false,
      },
    ],
  },
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  green: "bg-green-500/20 text-green-400 border border-green-500/30",
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  amber: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  red: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const ICON_BG_CLASSES: Record<string, string> = {
  green: "bg-green-500/20 text-green-400",
  blue: "bg-blue-500/20 text-blue-400",
  amber: "bg-amber-500/20 text-amber-400",
};

const LINE_CLASSES_COMPLETED = "bg-green-500";
const LINE_CLASSES_PENDING = "bg-slate-700";

function PublicTrackingPage({ onBackToApp }: PublicTrackingPageProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;

    const found = MOCK_RESULTS[trimmed] || null;
    setResult(found);
    setSearched(true);
    setNotFound(!found);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">LITPER PRO</h1>
              <p className="text-xs text-slate-400">Rastreo de envios</p>
            </div>
          </div>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Ir a la app
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Hero / Search section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 sm:py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Rastrea tu envio
            </h2>
            <p className="text-slate-400 mb-8 text-sm sm:text-base">
              Ingresa tu numero de guia para ver el estado de tu paquete en
              tiempo real.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: LIT-2026-001234"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-5 sm:px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Buscar
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Prueba: LIT-2026-001234, LIT-2026-005678, LIT-2026-009999
            </p>
          </div>
        </section>

        {/* Results */}
        <section className="flex-1 px-4 pb-12">
          <div className="max-w-2xl mx-auto">
            {/* Not found state */}
            {searched && notFound && (
              <div className="mt-8 text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-1">
                  No se encontro el envio
                </h3>
                <p className="text-sm text-slate-500">
                  Verifica tu numero de guia e intenta de nuevo.
                </p>
              </div>
            )}

            {/* Tracking result */}
            {result && (
              <div className="mt-8 space-y-6">
                {/* Summary card */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Numero de guia
                      </p>
                      <p className="font-mono font-bold text-lg">
                        {result.trackingNumber}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE_CLASSES[result.statusColor]}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {result.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">
                        Paqueteria
                      </p>
                      <p className="font-medium">{result.carrier}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Ruta</p>
                      <p className="font-medium">
                        {result.originCity}{" "}
                        <ArrowRight className="inline w-3 h-3 text-slate-500 mx-1" />{" "}
                        {result.destinationCity}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">
                        Entrega estimada
                      </p>
                      <p className="font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {result.estimatedDelivery}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6">
                  <h3 className="font-semibold mb-6 text-sm uppercase tracking-wider text-slate-400">
                    Historial de seguimiento
                  </h3>

                  <div className="space-y-0">
                    {result.timeline.map((step, idx) => {
                      const IconComponent = step.icon;
                      const isLast = idx === result.timeline.length - 1;

                      return (
                        <div key={idx} className="flex gap-4">
                          {/* Icon column */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.completed
                                  ? ICON_BG_CLASSES[step.color]
                                  : "bg-slate-800 text-slate-600"
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 h-8 my-1 rounded-full ${
                                  step.completed
                                    ? LINE_CLASSES_COMPLETED
                                    : LINE_CLASSES_PENDING
                                }`}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="pb-6 -mt-0.5">
                            <p
                              className={`font-medium text-sm ${
                                step.completed
                                  ? "text-white"
                                  : "text-slate-600"
                              }`}
                            >
                              {step.label}
                            </p>
                            {step.completed && step.date && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {step.date} a las {step.time} hrs
                              </p>
                            )}
                            {!step.completed && (
                              <p className="text-xs text-slate-700 mt-0.5">
                                Pendiente
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Empty initial state */}
            {!searched && (
              <div className="mt-12 text-center text-slate-600">
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">
                  Ingresa un numero de guia para comenzar el rastreo.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center">
        <p className="text-xs text-slate-600">
          Powered by{" "}
          <span className="font-semibold text-slate-400">LITPER PRO</span>
        </p>
      </footer>
    </div>
  );
}

export default PublicTrackingPage;
