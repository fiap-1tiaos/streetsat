import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { StarfieldCanvas } from '../landing/components/StarfieldCanvas'

export default function LoginPage() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 800))
    if (key) {
      localStorage.setItem('streetsat-auth', key)
      navigate('/admin/dashboard')
    } else {
      setError('API Key inválida.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <StarfieldCanvas />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card-strong"
        style={{
          position: 'relative',
          zIndex: 5,
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/streetsat-logo.png"
            alt="Streetsat"
            style={{ height: '48px', width: 'auto', objectFit: 'contain', margin: '0 auto 0.75rem' }}
          />
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="apikey"
              style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}
            >
              API KEY
            </label>
            <input
              id="apikey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Chave de API"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(0,212,255,0.04)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(0,212,255,0.15)'}`,
                borderRadius: '8px',
                color: '#e2e8f0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'rgba(0,212,255,0.15)')}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading || !key}
            whileHover={!loading && key ? { scale: 1.02, boxShadow: '0 0 20px rgba(0,212,255,0.25)' } : {}}
            whileTap={!loading && key ? { scale: 0.98 } : {}}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: key && !loading ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: '8px',
              color: key && !loading ? '#00d4ff' : '#475569',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: key && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
