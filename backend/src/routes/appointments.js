import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const appointmentSchema = z.object({
  patientId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('PENDING'),
}).refine((data) => !data.endsAt || data.endsAt > data.startsAt, {
  message: 'End time must be after start time',
  path: ['endsAt'],
})

router.get('/', async (req, res) => {
  const from = req.query.from ? z.coerce.date().parse(req.query.from) : new Date()
  const to = req.query.to
    ? z.coerce.date().parse(req.query.to)
    : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)

  const items = await db.appointment.findMany({
    where: { startsAt: { gte: from, lte: to } },
    include: {
      patient: { select: { id: true, medicalRecordNo: true, firstName: true, lastName: true } },
      staff: { select: { id: true, firstName: true, lastName: true, designation: true } },
    },
    orderBy: { startsAt: 'asc' },
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), async (req, res) => {
  const data = appointmentSchema.parse(req.body)
  const conflict = await db.appointment.findFirst({
    where: {
      staffId: data.staffId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      startsAt: { lt: data.endsAt ?? new Date(data.startsAt.getTime() + 30 * 60 * 1000) },
      OR: [{ endsAt: { gt: data.startsAt } }, { endsAt: null }],
    },
  })
  if (conflict) return res.status(409).json({ error: 'Staff member already has an appointment at this time' })

  const appointment = await db.appointment.create({ data })
  await writeAudit(req, 'CREATE', 'Appointment', appointment.id)
  res.status(201).json(appointment)
})

router.patch('/:id', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), async (req, res) => {
  const data = appointmentSchema.innerType().partial().parse(req.body)
  const appointment = await db.appointment.update({
    where: { id: req.params.id },
    data,
  })
  await writeAudit(req, 'UPDATE', 'Appointment', appointment.id, { fields: Object.keys(req.body) })
  res.json(appointment)
})

router.delete('/:id', authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  await db.appointment.delete({ where: { id: req.params.id } })
  await writeAudit(req, 'DELETE', 'Appointment', req.params.id)
  res.status(204).end()
})

export default router
