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
  timestamp: string;
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
    carrier: "FedEx Mexico",
    originCity: "Ciudad de Mexico, CDMX",
    destinationCity: "Monterrey, NL",
    estimatedDelivery: "19 de marzo, 2026",
    status: "En transito",
    statusColor: "blue",
    timeline: [
      {
        label: "Guia recibida",
        icon: CheckCircle,
        color: "green",
        timestamp: "14 Mar 2026 - 09:15",
        completed: true,
      },
      {
        label: "En proceso de recoleccion",
        icon: Package,
        color: "blue",
        timestamp: "14 Mar 2026 - 14:30",
        completed: true,
      },
      {
        label: "En transito",
        icon: Truck,
        color: "blue",
        timestamp: "15 Mar 2026 - 08:00",
        completed: true,
      },
      {
        label: "En centro de distribucion",
        icon: MapPin,
        color: "blue",
        timestamp: "",
        completed: false,
      },
      {
        label: "En camino al destino",
        icon: ArrowRight,
        color: "amber",
        timestamp: "",
        completed: false,
      },
      {
        label: "Entregado",
        icon: CheckCircle,
        color: "green",
        timestamp: "",
        completed: false,
      },
    ],
  },
  "LIT-2026-005678": {
    trackingNumber: "LIT-2026-005678",
    carrier: "DHL Express",
    originCity: "Guadalajara, JAL",
    destinationCity: "Cancun, QR",
    estimatedDelivery: "17 de marzo, 2026",
    status: "Entregado",
    statusColor: "green",
    timeline: [
      {
        label: "Guia recibida",
        icon: CheckCircle,
        color: "green",
        timestamp: "10 Mar 2026 - 11:00",
        completed: true,
      },
      {
        label: "En proceso de recoleccion",
        icon: Package,
        color: "blue",
        timestamp: "10 Mar 2026 - 16:45",
        completed: true,
      },
      {
        label: "En transito",
        icon: Truck,
        color: "blue",
        timestamp: "11 Mar 2026 - 07:20",
        completed: true,
      },
      {
        label: "En centro de distribucion",
        icon: MapPin,
        color: "blue",
        timestamp: "13 Mar 2026 - 10:10",
        completed: true,
      },
      {
        label: "En camino al destino",
        icon: ArrowRight,
        color: "amber",
        timestamp: "13 Mar 2026 - 14:00",
        completed: true,
      },
      {
        label: "Entregado",
        icon: CheckCircle,
        color: "green",
        timestamp: "13 Mar 2026 - 17:32",
        completed: true,
      },
    ],
  },
  "LIT-2026-009012": {
    trackingNumber: "LIT-2026-009012",
    carrier: "Estafeta",
    originCity: "Puebla, PUE",
    destinationCity: "Merida, YUC",
    estimatedDelivery: "21 de marzo, 2026",
    status: "En camino al destino",
    statusColor: "amber",
    timeline: [
      {
        label: "Guia recibida",
        icon: CheckCircle,
        color: "green",
        timestamp: "15 Mar 2026 - 08:00",
        completed: true,
      },
      {
        label: "En proceso de recoleccion",
        icon: Package,
        color: "blue",
        timestamp: "15 Mar 2026 - 12:20",
        completed: true,
      },
      {
        label: "En transito",
        icon: Truck,
        color: "blue",
        timestamp: "16 Mar 2026 - 06:45",
        completed: true,
      },
      {
        label: "En centro de distribucion",
        icon: MapPin,
        color: "blue",
        timestamp: "17 Mar 2026 - 09:30",
        completed: true,
      },
      {
        label: "En camino al destino",
        icon: ArrowRight,
        color: "amber",
        timestamp: "17 Mar 2026 - 13:15",
        completed: true,
      },
      {
        label: "Entregado",
        icon: CheckCircle,
        color: "green",
        timestamp: "",
        completed: false,
      },
    ],
  },
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  green: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  amber: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  red: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const STEP_ICON_CLASSES: Record<string, string> = {
  green: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
  blue: "text-blue-400 bg-blue-500/20 border-blue-500/40",
  amber: "text-amber-400 bg-amber-500/20 border-amber-500/40",
};

const STEP_ICON_INACTIVE = "text-slate-600 bg-slate-800 border-slate-700";

function PublicTrackingPage({ onBackToApp }: PublicTrackingPageProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;

    const found = MOCK_RESULTS[trimmed] ?? null;
    setResult(found);
    setNotFound(!found);
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                LITPER PRO
              </h1>
              <p className="text-xs text-slate-400">Rastreo de envios</p>
            </div>
          </div>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Ir a la app
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Search section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Rastrea tu envio
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Ingresa tu numero de guia para consultar el estado de tu paquete
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: LIT-2026-001234"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:from-blue-500 hover:to-violet-500 transition-all text-sm sm:text-base flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </div>

            {!searched && (
              <p className="text-center text-xs text-slate-600 mt-4">
                Prueba con: LIT-2026-001234, LIT-2026-005678 o LIT-2026-009012
              </p>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="max-w-4xl mx-auto px-4 py-8 w-full">
          {searched && notFound && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">
                No se encontro el envio
              </h3>
              <p className="text-slate-500 text-sm">
                Verifica el numero de guia e intenta de nuevo.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Summary card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Numero de guia
                    </p>
                    <p className="text-lg font-mono font-bold text-white">
                      {result.trackingNumber}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium self-start ${STATUS_BADGE_CLASSES[result.statusColor]}`}
                  >
                    {result.statusColor === "green" && (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    {result.statusColor === "blue" && (
                      <Truck className="w-3.5 h-3.5" />
                    )}
                    {result.statusColor === "amber" && (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    {result.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">
                      Paqueteria
                    </p>
                    <p className="text-sm font-medium text-slate-200">
                      {result.carrier}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Origen</p>
                    <p className="text-sm font-medium text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {result.originCity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Destino</p>
                    <p className="text-sm font-medium text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {result.destinationCity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">
                      Entrega estimada
                    </p>
                    <p className="text-sm font-medium text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {result.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
                  Historial de movimientos
                </h3>
                <div className="space-y-0">
                  {result.timeline.map((step, idx) => {
                    const Icon = step.icon;
                    const isLast = idx === result.timeline.length - 1;

                    return (
                      <div key={idx} className="flex gap-4">
                        {/* Icon + connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              step.completed
                                ? STEP_ICON_CLASSES[step.color]
                                : STEP_ICON_INACTIVE
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-10 ${
                                step.completed
                                  ? "bg-slate-600"
                                  : "bg-slate-800"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pt-2 pb-4">
                          <p
                            className={`text-sm font-medium ${
                              step.completed
                                ? "text-slate-100"
                                : "text-slate-600"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.timestamp ? (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {step.timestamp}
                            </p>
                          ) : (
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
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Truck className="w-3.5 h-3.5" />
            <span>Powered by LITPER PRO</span>
          </div>
          <p className="text-xs text-slate-600">
            Seguimiento en tiempo real de tus envios
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PublicTrackingPage;
