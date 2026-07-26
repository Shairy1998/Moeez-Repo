import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Number((target * eased).toFixed(decimals)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, decimals])

  return value
}

export default function StatCard({ stat, index }) {
  const decimals = Number.isInteger(stat.value) ? 0 : 1
  const value = useCountUp(stat.value, 1000 + index * 120, decimals)
  const Icon = stat.icon

  return (
    <motion.article
      className="stat-card glass-panel"
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.015 }}
      style={{
        borderRadius: 18,
        padding: '1.05rem 1.1rem',
        background: `linear-gradient(160deg, ${stat.tint}, var(--surface) 70%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: stat.color, fontWeight: 600, marginBottom: 8 }}>{stat.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {stat.prefix}
            {decimals ? value.toFixed(1) : Math.round(value)}
            {stat.suffix}
          </div>
          <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={13} />
            {stat.sub}
          </div>
        </div>
        <motion.div
          className="float-soft"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
            color: stat.color,
            border: '1px solid var(--border)',
            animationDelay: `${index * 0.4}s`,
          }}
        >
          <Icon size={18} />
        </motion.div>
      </div>
    </motion.article>
  )
}
