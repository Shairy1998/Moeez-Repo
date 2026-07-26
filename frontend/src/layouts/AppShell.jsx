import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BedDouble,
  Box,
  CalendarDays,
  Clock3,
  IdCard,
  LayoutDashboard,
  Menu,
  Moon,
  Pill,
  Receipt,
  Scissors,
  Stethoscope,
  Sun,
  Users,
  X,
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Patients' },
  { icon: Stethoscope, label: 'Doctors' },
  { icon: CalendarDays, label: 'Appointments' },
  { icon: Scissors, label: 'Surgeries' },
  { icon: BedDouble, label: 'Admissions' },
  { icon: IdCard, label: 'Employees' },
  { icon: Clock3, label: 'Staff schedule' },
  { icon: Pill, label: 'Treatments' },
  { icon: Box, label: 'Inventory' },
  { icon: Receipt, label: 'Billing' },
]

export default function AppShell({ active, onNavigate, dark, onToggleDark, user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [now],
  )

  const timeLabel = useMemo(
    () => now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    [now],
  )

  const selectNav = (label) => {
    onNavigate(label)
    setSidebarOpen(false)
  }

  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            aria-label="Close menu overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.45)',
              border: 'none',
              zIndex: 30,
              display: 'none',
            }}
            className="mobile-overlay"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 248,
          flexShrink: 0,
          background: 'linear-gradient(180deg, var(--sidebar), color-mix(in srgb, var(--sidebar) 88%, #1e3a5f))',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(148, 163, 184, 0.12)',
          zIndex: 40,
          position: 'relative',
        }}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
        <div
          style={{
            padding: '1.2rem 1.1rem 1rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              animate={{ rotate: [0, 8, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                color: '#fff',
                fontFamily: 'Fraunces, Georgia, serif',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              R
            </motion.div>
            <div>
              <div className="brand-mark" style={{ color: '#fff', fontSize: 17, fontWeight: 600 }}>
                Riverside
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Hospital OS</div>
            </div>
          </div>
          <button
            type="button"
            className="mobile-only"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'none',
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ padding: '0.85rem 0.7rem', display: 'grid', gap: 4, flex: 1 }} className="scroll-y">
          {NAV.map(({ icon: Icon, label }, i) => {
            const isActive = active === label
            return (
              <motion.button
                key={label}
                type="button"
                className="nav-item"
                onClick={() => selectNav(label)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.035, duration: 0.35 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0.7rem 0.8rem',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isActive
                    ? 'linear-gradient(90deg, var(--sidebar-active), color-mix(in srgb, var(--sidebar-active) 70%, #0d9488))'
                    : 'transparent',
                  color: isActive ? '#fff' : '#cbd5e1',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 10px 24px rgba(37, 99, 235, 0.28)' : 'none',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </motion.button>
            )
          })}
        </nav>

        <div style={{ padding: '0.9rem 1rem 1.1rem', borderTop: '1px solid rgba(148, 163, 184, 0.14)' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Signed in</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
              {user ? `${user.name} · ${user.role}` : 'Guest'}
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94a3b8',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      <main
        className="scroll-y"
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          padding: '1.15rem 1.25rem 1.5rem',
          color: 'var(--ink)',
        }}
      >
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: '1.15rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="mobile-only"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'none',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                borderRadius: 12,
                width: 40,
                height: 40,
                placeItems: 'center',
                cursor: 'pointer',
              }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{active}</div>
              <div style={{ color: 'var(--sub)', fontSize: 13 }}>
                {dateLabel} · {timeLabel}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '0.45rem 0.75rem',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 12,
                color: 'var(--sub)',
              }}
            >
              <span className="live-dot" />
              Systems nominal
            </div>
            <motion.button
              type="button"
              onClick={onToggleDark}
              whileTap={{ scale: 0.95, rotate: 12 }}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                borderRadius: 12,
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'sun' : 'moon'}
                  initial={{ opacity: 0, y: 6, rotate: -20 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: -6, rotate: 20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'grid' }}
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            height: 100vh;
            transform: translateX(-105%);
            transition: transform 0.28s ease;
          }
          .sidebar-open {
            transform: translateX(0);
          }
          .mobile-only {
            display: grid !important;
          }
          .mobile-overlay {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
