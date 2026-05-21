import { X, Save, Eye, EyeOff, ExternalLink, Plug } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConexionesStore, type Conexiones } from '../stores/conexionesStore';
import { useUIStore } from '../stores/uiStore';

interface Field {
  key: keyof Conexiones;
  label: string;
  placeholder: string;
  type?: 'text' | 'url' | 'password';
  helper?: string;
}

const SECTIONS: Array<{ title: string; icon: string; fields: Field[] }> = [
  {
    title: 'Supabase ASDA (logística)',
    icon: '🗂',
    fields: [
      { key: 'supabaseAsdaUrl', label: 'URL', placeholder: 'https://xxxxxxx.supabase.co', type: 'url' },
      { key: 'supabaseAsdaAnonKey', label: 'anon key', placeholder: 'eyJhbGc...', type: 'password' },
    ],
  },
  {
    title: 'Supabase Semáforo',
    icon: '🚦',
    fields: [
      { key: 'supabaseSemaforoUrl', label: 'URL', placeholder: 'https://gtsivwbnhcawvmsfujby.supabase.co', type: 'url' },
      { key: 'supabaseSemaforoAnonKey', label: 'anon key', placeholder: 'eyJhbGc...', type: 'password' },
    ],
  },
  {
    title: 'Backend ASDA',
    icon: '🧠',
    fields: [
      { key: 'backendUrl', label: 'URL', placeholder: 'http://localhost:8000 o https://api.litper.com', type: 'url' },
    ],
  },
  {
    title: 'WhatsApp Cloud',
    icon: '💬',
    fields: [
      { key: 'whatsappToken', label: 'System User Access Token', placeholder: 'EAA...', type: 'password', helper: 'Meta Business → System Users → permanent token' },
      { key: 'whatsappPhoneNumberId', label: 'Phone Number ID', placeholder: '1234567890', helper: 'WhatsApp Business → API setup' },
    ],
  },
  {
    title: 'Meta Ads',
    icon: '📊',
    fields: [
      { key: 'metaAdsAccessToken', label: 'Access Token', placeholder: 'EAAB...', type: 'password' },
      { key: 'metaAdsAccountId', label: 'Ad Account ID', placeholder: 'act_1234567890' },
    ],
  },
  {
    title: 'ChateaPro (BSP CO)',
    icon: '🇨🇴',
    fields: [
      { key: 'chateaProApiKey', label: 'API Key', placeholder: 'cp_...', type: 'password' },
    ],
  },
  {
    title: 'Distribución y alertas',
    icon: '📤',
    fields: [
      { key: 'driveFolderId', label: 'Google Drive folder ID', placeholder: '1abc... (PDFs diarios)' },
      { key: 'slackChannel', label: 'Slack channel', placeholder: '#ops' },
    ],
  },
];

export function ConexionesModal() {
  const open = useUIStore((s) => s.conexionesOpen);
  const close = useUIStore((s) => s.closeConexiones);
  const { conexiones, setConexion, reset } = useConexionesStore();
  const [showSecrets, setShowSecrets] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-litper-navy-950/80 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="halo-panel max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-litper-gold-500/15">
              <Plug size={16} className="text-litper-gold-500" />
              <div className="flex-1">
                <h2 className="font-brand text-sm text-litper-gold-500">Conexiones</h2>
                <p className="text-[10px] text-litper-cream-muted">Credenciales y endpoints externos. Guardado local.</p>
              </div>
              <button
                onClick={() => setShowSecrets((s) => !s)}
                className="ghost-btn p-1.5 text-xs flex items-center gap-1"
                title={showSecrets ? 'Ocultar valores' : 'Mostrar valores'}
              >
                {showSecrets ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button onClick={close} className="ghost-btn p-1.5" aria-label="Cerrar">
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {SECTIONS.map((section) => (
                <section key={section.title} className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wider text-litper-gold-500 flex items-center gap-1.5">
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {section.fields.map((f) => (
                      <div key={f.key} className="space-y-0.5">
                        <label className="text-[10px] text-litper-cream-muted block">{f.label}</label>
                        <input
                          type={f.type === 'password' && !showSecrets ? 'password' : 'text'}
                          value={conexiones[f.key]}
                          onChange={(e) => setConexion(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full px-2.5 py-1.5 text-xs bg-litper-navy-800/70 border border-litper-gold-500/15
                                     rounded text-litper-cream placeholder-litper-cream-muted/50
                                     focus:outline-none focus:border-litper-gold-500/60 font-mono"
                        />
                        {f.helper && <p className="text-[9px] text-litper-cream-muted">{f.helper}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-litper-gold-500/15">
              <button
                onClick={() => {
                  if (confirm('¿Borrar todas las conexiones guardadas?')) reset();
                }}
                className="ghost-btn px-2 py-1.5 text-xs text-litper-red-500 hover:bg-litper-red-500/10"
              >
                Borrar todo
              </button>
              <a
                href="https://supabase.com/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  window.litperDesk?.invoke('shell:open-external', { url: 'https://supabase.com/dashboard' }).catch(() => {});
                }}
                className="ghost-btn px-2 py-1.5 text-xs flex items-center gap-1"
              >
                <ExternalLink size={11} />
                Dashboard Supabase
              </a>
              <div className="flex-1" />
              <button onClick={close} className="ghost-btn px-3 py-1.5 text-xs">Cancelar</button>
              <button onClick={close} className="gold-btn px-3 py-1.5 text-xs flex items-center gap-1">
                <Save size={11} />
                Guardar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
