// components/Billing/BillingHistory.tsx
// Tabla de historial de facturas
// Design System: Linear meets Stripe on Dark Logistics (LS V2)

import React from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatPrice } from '../../services/stripeService';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  pdfUrl?: string;
}

interface BillingHistoryProps {
  invoices?: Invoice[];
}

// Demo invoices for preview
const DEMO_INVOICES: Invoice[] = [
  { id: 'inv_001', date: '2026-02-01', amount: 29, currency: 'USD', status: 'paid', plan: 'Pro' },
  { id: 'inv_002', date: '2026-01-01', amount: 29, currency: 'USD', status: 'paid', plan: 'Pro' },
  { id: 'inv_003', date: '2025-12-01', amount: 29, currency: 'USD', status: 'paid', plan: 'Pro' },
];

export function BillingHistory({ invoices = DEMO_INVOICES }: BillingHistoryProps) {
  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="ls-badge ls-badge-green">
            <CheckCircle className="w-3 h-3" />
            Pagado
          </span>
        );
      case 'pending':
        return (
          <span className="ls-badge ls-badge-amber">
            <AlertCircle className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'failed':
        return (
          <span className="ls-badge ls-badge-red">
            <AlertCircle className="w-3 h-3" />
            Fallido
          </span>
        );
    }
  };

  return (
    <div className="ls-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Historial de Facturas
        </h3>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 text-[#64748b] mx-auto mb-3" />
          <p className="text-[#94a3b8] text-sm">No hay facturas aún</p>
        </div>
      ) : (
        <div className="divide-y divide-[rgba(255,255,255,0.06)]">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="ls-table-row flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="text-white font-medium">
                    {new Date(invoice.date).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-[#64748b]">Plan {invoice.plan}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(invoice.status)}
                <span className="text-sm font-medium text-white min-w-[60px] text-right">
                  {formatPrice(invoice.amount, invoice.currency)}
                </span>
                {invoice.pdfUrl ? (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#64748b] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                ) : (
                  <button className="p-1.5 text-[#64748b] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BillingHistory;
