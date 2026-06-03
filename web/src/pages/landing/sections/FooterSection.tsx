import { useNavigate } from 'react-router'

const ods = [
  'ODS 8 · Trabalho Decente',
  'ODS 9 · Infraestrutura',
  'ODS 11 · Cidades Sustentáveis',
  'ODS 13 · Ação Climática',
]

const links = [
  { label: 'Acesso Admin', action: 'admin' as const },
  { label: 'GitHub',       action: 'github' as const },
  { label: 'FIAP',        action: 'fiap' as const },
]

export function FooterSection() {
  const navigate = useNavigate()

  function handleLink(action: string) {
    if (action === 'admin') navigate('/admin/login')
  }

  return (
    <footer
      className="relative px-6 py-16 overflow-hidden"
      style={{
        background: '#020408',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-2">
              <span>🛰️</span>
              <span className="text-white">Street</span>
              <span className="text-[#00d4ff]">sat</span>
            </div>
            <p className="text-slate-600 text-sm max-w-xs leading-relaxed">
              Monitoramento inteligente de rodovias via satélite e Inteligência Artificial.
            </p>
          </div>

          {/* ODS tags */}
          <div className="flex flex-wrap gap-2">
            {ods.map(o => (
              <span
                key={o}
                className="px-2.5 py-1 rounded-md text-[0.65rem] font-mono text-slate-600
                           border border-slate-800 bg-slate-900/40"
              >
                {o}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}
        />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-700 text-xs font-mono">
            Streetsat · FIAP Global Solution 2 · 2026
          </p>

          <nav className="flex gap-6">
            {links.map(l => (
              <button
                key={l.label}
                onClick={() => handleLink(l.action)}
                className="text-slate-600 hover:text-slate-400 text-xs transition-colors
                           duration-200 bg-transparent border-none cursor-pointer"
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
