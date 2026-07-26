import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  BedDouble,
  CalendarClock,
  HeartPulse,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import { api } from '../lib/api.js'

const DEMO_STATS = [
  {
    label: 'Patients admitted',
    value: 128,
    prefix: '',
    suffix: '',
    sub: '+6 today',
    tint: 'var(--primary-soft)',
    color: 'var(--primary)',
    icon: Users,
  },
  {
    label: 'Doctors on duty',
    value: 34,
    prefix: '',
    suffix: '',
    sub: 'of 41 total',
    tint: 'var(--accent-soft)',
    color: 'var(--accent)',
    icon: Stethoscope,
  },
  {
    label: 'Surgeries scheduled',
    value: 7,
    prefix: '',
    suffix: '',
    sub: 'this week',
    tint: 'var(--warn-soft)',
    color: 'var(--warn)',
    icon: HeartPulse,
  },
  {
    label: 'Revenue this month',
    value: 4.2,
    prefix: 'PKR ',
    suffix: 'M',
    sub: '+11% vs last month',
    tint: 'var(--success-soft)',
    color: 'var(--success)',
    icon: Wallet,
  },
]

const DEMO_APPTS = [
  { time: '09:00', patient: 'Ayesha Khan', doctor: 'Dr. Farooq · Cardiology', status: 'Confirmed', kind: 'success' },
  { time: '10:30', patient: 'Bilal Ahmed', doctor: 'Dr. Zara · Orthopedics', status: 'Confirmed', kind: 'success' },
  { time: '11:15', patient: 'Hina Malik', doctor: 'Dr. Farooq · Cardiology', status: 'Pending', kind: 'warn' },
  { time: '13:00', patient: 'Usman Tariq', doctor: 'Dr. Noor · Pediatrics', status: 'Cancelled', kind: 'danger' },
  { time: '14:45', patient: 'Sana Riaz', doctor: 'Dr. Ali · Neurology', status: 'Confirmed', kind: 'success' },
]

const DEMO_BEDS = [
  { ward: 'General ward', occ: 82, free: 9, color: 'var(--primary)' },
  { ward: 'ICU', occ: 95, free: 1, color: 'var(--danger)' },
  { ward: 'Maternity', occ: 60, free: 8, color: 'var(--accent)' },
  { ward: 'Pediatrics', occ: 45, free: 12, color: 'var(--success)' },
]

const BED_COLORS = {
  'General ward': 'var(--primary)',
  ICU: 'var(--danger)',
  Maternity: 'var(--accent)',
  Pediatrics: 'var(--success)',
}

const ACTIVITY = [
  { title: 'ICU bed 4 assigned', meta: '2 min ago', tone: 'danger' },
  { title: 'Lab results ready for MR-2041', meta: '12 min ago', tone: 'primary' },
  { title: 'Invoice INV-889 paid', meta: '28 min ago', tone: 'success' },
  { title: 'Surgery theatre 2 prepped', meta: '45 min ago', tone: 'warn' },
]

const HOURLY = [42, 55, 48, 62, 70, 66, 78, 84, 76, 69, 58, 51]

export default function Dashboard({ onNavigate }) {
  const [hour, setHour] = useState(0)
  const [stats, setStats] = useState(DEMO_STATS)
  const [appointments, setAppointments] = useState(DEMO_APPTS)
  const [beds, setBeds] = useState(DEMO_BEDS)
  const [live, setLive] = useState(false)
  const maxHourly = Math.max(...HOURLY)

  useEffect(() => {
    const id = setInterval(() => setHour((h) => (h + 1) % HOURLY.length), 1800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false

    api('/dashboard/overview')
      .then((data) => {
        if (cancelled) return
        const revenueMillions = Number(data.stats.revenueMonth || 0) / 1_000_000
        setStats([
          {
            ...DEMO_STATS[0],
            value: data.stats.patientsAdmitted,
            sub: `+${data.stats.admissionsToday} today`,
          },
          {
            ...DEMO_STATS[1],
            value: data.stats.doctorsOnDuty,
            sub: 'active doctors',
          },
          {
            ...DEMO_STATS[2],
            value: data.stats.surgeriesScheduled,
          },
          {
            ...DEMO_STATS[3],
            value: Number(revenueMillions.toFixed(1)) || DEMO_STATS[3].value,
          },
        ])
        if (data.appointments?.length) setAppointments(data.appointments)
        if (data.beds?.length) {
          setBeds(
            data.beds.map((bed) => ({
              ...bed,
              color: BED_COLORS[bed.ward] || 'var(--primary)',
            })),
          )
        }
        setLive(true)
      })
      .catch(() => {
        if (!cancelled) setLive(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const snapshot = useMemo(
    () => [
      { label: 'ER wait', value: '14m' },
      { label: 'OR free', value: '2/5' },
      { label: 'Staff online', value: '86' },
    ],
    [],
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <motion.section
        className="glass-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 22,
          padding: '1.25rem 1.4rem',
          background:
            'linear-gradient(120deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), var(--surface) 45%, color-mix(in srgb, var(--accent) 10%, var(--surface)))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>
              {live ? 'Connected to live API' : 'Live hospital overview · demo mode'}
            </span>
          </div>
          <h2 className="brand-mark" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Care that moves with the floor
          </h2>
          <p style={{ color: 'var(--sub)', marginTop: 8, maxWidth: 520, fontSize: 13.5 }}>
            Track admissions, theatre load, and bedside capacity in one animated command center.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {snapshot.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              style={{
                minWidth: 100,
                padding: '0.75rem 0.9rem',
                borderRadius: 14,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--sub)' }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{item.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12 }}>
        <motion.section
          className="panel-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ borderRadius: 20, padding: '1.1rem 1.15rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Today&apos;s appointments</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>Realtime schedule board</div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('Appointments')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <CalendarClock size={14} />
              View all
            </button>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <AnimatePresence>
              {appointments.map((appt, i) => (
                <motion.div
                  key={appt.time + appt.patient}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '0.75rem 0.8rem',
                    borderRadius: 14,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{appt.time}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{appt.patient}</div>
                    <div style={{ fontSize: 12, color: 'var(--sub)' }}>{appt.doctor}</div>
                  </div>
                  <span
                    style={{
                      background: `var(--${appt.kind}-soft)`,
                      color: `var(--${appt.kind})`,
                      fontSize: 11,
                      padding: '4px 9px',
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    {appt.status}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        <motion.section
          className="panel-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          style={{ borderRadius: 20, padding: '1.1rem 1.15rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Bed occupancy</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>Ward capacity pressure</div>
            </div>
            <BedDouble size={16} color="var(--sub)" />
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {beds.map((bed, i) => (
              <div key={bed.ward}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--sub)', fontWeight: 500 }}>{bed.ward}</span>
                  <span style={{ fontWeight: 700 }}>
                    {bed.occ}% · {bed.free} free
                  </span>
                </div>
                <div style={{ background: 'var(--track)', borderRadius: 999, height: 9, overflow: 'hidden' }}>
                  <motion.div
                    className="bed-fill"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: bed.occ / 100 }}
                    transition={{ delay: 0.35 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: `linear-gradient(90deg, ${bed.color}, color-mix(in srgb, ${bed.color} 65%, white))`,
                      width: '100%',
                      height: '100%',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
        <motion.section
          className="panel-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5 }}
          style={{ borderRadius: 20, padding: '1.1rem 1.15rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Patient flow</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>Hourly admissions pulse</div>
            </div>
            <Activity size={16} color="var(--primary)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {HOURLY.map((value, i) => {
              const active = i === hour
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${(value / maxHourly) * 100}%`, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    background: active
                      ? 'linear-gradient(180deg, var(--primary-light), var(--primary))'
                      : 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 35%, var(--track)), var(--track))',
                    boxShadow: active ? '0 8px 20px color-mix(in srgb, var(--primary) 35%, transparent)' : 'none',
                    position: 'relative',
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="flow-tip"
                      style={{
                        position: 'absolute',
                        top: -28,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--primary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {value}
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <motion.section
          className="panel-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ borderRadius: 20, padding: '1.1rem 1.15rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Live activity</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>Floor updates</div>
            </div>
            <ArrowUpRight size={15} color="var(--sub)" />
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {ACTIVITY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.07 }}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '0.65rem 0.7rem',
                  borderRadius: 12,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    marginTop: 5,
                    borderRadius: 999,
                    background: `var(--${item.tone})`,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--sub)' }}>{item.meta}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
