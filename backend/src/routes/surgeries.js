import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const surgerySchema = z.object({
  patientId: z.string().min(1),
  surgeonId: z.string().min(1),
  theatre: z.string().trim().max(100).optional().nullable(),
  scheduledAt: z.coerce.date(),
  durationMin: z.coerce.number().int().positive().max(1440).default(60),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  notes: z.string().trim().max(2000).optional().nullable(),
})

router.get('/', async (_req, res) => {
  const items = await db.surgery.findMany({
    include: {
      patient: { select: { id: true, medicalRecordNo: true, firstName: true, lastName: true } },
      surgeon: { select: { id: true, firstName: true, lastName: true, designation: true } },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 200,
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  const surgery = await db.surgery.create({ data: surgerySchema.parse(req.body) })
  await writeAudit(req, 'CREATE', 'Surgery', surgery.id)
  res.status(201).json(surgery)
})

router.patch('/:id', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req, res) => {
  const surgery = await db.surgery.update({
    where: { id: req.params.id },
    data: surgerySchema.partial().parse(req.body),
  })
  await writeAudit(req, 'UPDATE', 'Surgery', surgery.id, { fields: Object.keys(req.body) })
  res.json(surgery)
})

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await db.surgery.delete({ where: { id: req.params.id } })
  await writeAudit(req, 'DELETE', 'Surgery', req.params.id)
  res.status(204).end()
})

export default router
