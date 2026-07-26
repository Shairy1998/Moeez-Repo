import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { authenticate } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/errors.js'
import authRoutes from './routes/auth.js'
import patientRoutes from './routes/patients.js'
import staffRoutes from './routes/staff.js'
import appointmentRoutes from './routes/appointments.js'
import admissionRoutes from './routes/admissions.js'
import billingRoutes from './routes/billing.js'
import dashboardRoutes from './routes/dashboard.js'
import surgeryRoutes from './routes/surgeries.js'
import treatmentRoutes from './routes/treatments.js'
import inventoryRoutes from './routes/inventory.js'
import shiftRoutes from './routes/shifts.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(
    cors({
      origin: config.CLIENT_ORIGIN,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'riverside-hms-api' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api', authenticate)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/patients', patientRoutes)
  app.use('/api/staff', staffRoutes)
  app.use('/api/appointments', appointmentRoutes)
  app.use('/api/admissions', admissionRoutes)
  app.use('/api/billing', billingRoutes)
  app.use('/api/surgeries', surgeryRoutes)
  app.use('/api/treatments', treatmentRoutes)
  app.use('/api/inventory', inventoryRoutes)
  app.use('/api/shifts', shiftRoutes)

  if (config.NODE_ENV === 'production') {
    const frontendDist = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../frontend/dist',
    )
    app.use(express.static(frontendDist))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'))
    })
  }

  app.use(notFound)
  app.use(errorHandler)

  return app
}
