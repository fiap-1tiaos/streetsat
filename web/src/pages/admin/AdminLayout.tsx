import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard, Map, AlertTriangle, Bell, Brain,
  ChevronLeft, ChevronRight, LogOut, Wifi, WifiOff, RefreshCw, GitBranch,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import { AlertBanner } from '@/components/realtime/AlertBanner'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Mapa ao Vivo', icon: Map, path: '/admin/map' },
  { label: 'Ocorrências', icon: AlertTriangle, path: '/admin/occurrences' },
  { label: 'Alertas', icon: Bell, path: '/admin/alerts' },
  { label: 'Pipeline', icon: GitBranch, path: '/admin/pipeline' },
  { label: 'Modelo ML', icon: Brain, path: '/admin/model' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { apiOnline, setApiOnline, lastUpdated } = useOccurrencesStore()

  const checkHealth = useCallback(async () => {
    try {
      await api.health()
      setApiOnline(true)
    } catch {
      setApiOnline(false)
    }
  }, [setApiOnline])

  useEffect(() => {
    checkHealth()
    const id = setInterval(checkHealth, 30_000)
    return () => clearInterval(id)
  }, [checkHealth])

  useEffect(() => {
    const auth = localStorage.getItem('streetsat-auth')
    if (!auth) navigate('/admin/login')
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('streetsat-auth')
    navigate('/admin/login')
  }

  const currentPage = NAV.find((n) => location.pathname === n.path)?.label ?? 'Admin'

  const doSync = async () => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSyncing(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#020408' }}>
      <AlertBanner />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: '#060d16',
          borderRight: '1px solid rgba(0,212,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(0,212,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '64px' }}>
          <AnimatePresence>
            {!collapsed ? (
              <motion.img
                key="logo-full"
                src="/streetsat-logo.png"
                alt="Streetsat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <img
                key="logo-icon"
                src="/streetsat-logo.png"
                alt="Streetsat"
                style={{ height: '28px', width: '28px', objectFit: 'contain', objectPosition: 'left' }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {NAV.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.25rem',
                  textDecoration: 'none',
                  color: active ? '#00d4ff' : '#64748b',
                  background: active ? 'rgba(0,212,255,0.07)' : 'transparent',
                  borderRight: active ? '2px solid #00d4ff' : '2px solid transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#94a3b8' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#64748b' }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: active ? 600 : 400, fontSize: '0.875rem' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Status + collapse */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,212,255,0.06)' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {apiOnline
                ? <Wifi size={14} color="#22c55e" />
                : <WifiOff size={14} color="#ef4444" />}
              <span style={{ fontSize: '0.7rem', color: apiOnline ? '#22c55e' : '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                {apiOnline ? 'API online' : 'API offline'}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
              padding: '0.5rem 0', width: '100%', fontSize: '0.8rem',
            }}
            title="Sair"
          >
            <LogOut size={16} />
            {!collapsed && <span style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Sair</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', marginTop: '0.5rem', background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.1)', borderRadius: '6px',
              padding: '0.4rem', color: '#64748b', cursor: 'pointer',
            }}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: collapsed ? 64 : 220, transition: 'margin-left 0.3s', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(6,13,22,0.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,212,255,0.06)',
          padding: '0 1.5rem', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem', margin: 0, color: '#e2e8f0' }}>
            {currentPage}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={doSync}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }}
              title="Atualizar"
            >
              <RefreshCw size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <span
              className="animate-pulse-ring-red"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: '0.7rem', color: '#ef4444', fontFamily: 'JetBrains Mono, monospace',
                cursor: 'default',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Ao Vivo
            </span>
          </div>
        </header>

        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
