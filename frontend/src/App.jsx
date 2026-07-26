import { useEffect, useState } from 'react'
import AppShell from './layouts/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Billing from './pages/Billing.jsx'
import Admissions from './pages/Admissions.jsx'
import Login from './pages/Login.jsx'
import ResourcePage from './components/ResourcePage.jsx'
import { MODULE_CONFIGS } from './pages/moduleConfigs.jsx'
import { api, clearToken, getToken } from './lib/api.js'

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('riverside-theme') === 'dark')
  const [active, setActive] = useState('Dashboard')
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('riverside-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (!getToken()) {
      setChecking(false)
      return
    }
    api('/auth/me')
      .then(setUser)
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setChecking(false))
  }, [])

  const logout = () => {
    clearToken()
    setUser(null)
    setActive('Dashboard')
  }

  if (checking) {
    return <div className="app-shell" style={{ minHeight: '100vh' }} />
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const moduleConfig = MODULE_CONFIGS[active]

  return (
    <AppShell
      active={active}
      onNavigate={setActive}
      dark={dark}
      onToggleDark={() => setDark((value) => !value)}
      user={user}
      onLogout={logout}
    >
      {active === 'Dashboard' && <Dashboard onNavigate={setActive} />}
      {active === 'Billing' && <Billing />}
      {active === 'Admissions' && <Admissions />}
      {moduleConfig && <ResourcePage key={active} config={moduleConfig} />}
    </AppShell>
  )
}
