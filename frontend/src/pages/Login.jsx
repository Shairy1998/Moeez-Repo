import { useState } from 'react'
import { motion } from 'framer-motion'
import { HeartPulse, LogIn } from 'lucide-react'
import { api, setToken } from '../lib/api.js'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@riverside.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(token)
      onLogin(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <motion.form
        onSubmit={submit}
        className="glass-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 'min(400px, 92vw)', borderRadius: 22, padding: '2rem', position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: '#fff',
            }}
          >
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="brand-mark" style={{ fontSize: 20, fontWeight: 600 }}>Riverside HMS</div>
            <div style={{ fontSize: 12, color: 'var(--sub)' }}>Sign in to your hospital workspace</div>
          </div>
        </div>

        <label className="field-label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Admin123!"
          style={{ marginBottom: 18 }}
        />

        {error && (
          <div
            style={{
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              borderRadius: 10,
              padding: '0.6rem 0.8rem',
              fontSize: 12.5,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          <LogIn size={15} />
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--sub)', textAlign: 'center' }}>
          Demo account: admin@riverside.local / Admin123!
        </div>
      </motion.form>
    </div>
  )
}
