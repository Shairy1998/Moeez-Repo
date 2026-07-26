import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const treatmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  dosage: z.string().trim().max(200).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'STOPPED']).default('ACTIVE'),
  notes: z.string().trim().max(2000).optional().nullable(),
})

router.get('/', async (_req, res) => {
  const items = await db.treatment.findMany({
    include: {
      patient: { select: { id: true, medicalRecordNo: true, firstName: true, lastName: true } },
      doctor: { select: { id: true, firstName: true, lastName: true, designation: true } },
    },
    orderBy: { startDate: 'desc' },
    take: 200,
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req, res) => {
  const treatment = await db.treatment.create({ data: treatmentSchema.parse(req.body) })
  await writeAudit(req, 'CREATE', 'Treatment', treatment.id)
  res.status(201).json(treatment)
})

router.patch('/:id', authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req, res) => {
  const treatment = await db.treatment.update({
    where: { id: req.params.id },
    data: treatmentSchema.partial().parse(req.body),
  })
  await writeAudit(req, 'UPDATE', 'Treatment', treatment.id, { fields: Object.keys(req.body) })
  res.json(treatment)
})

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await db.treatment.delete({ where: { id: req.params.id } })
  await writeAudit(req, 'DELETE', 'Treatment', req.params.id)
  res.status(204).end()
})

export default router
