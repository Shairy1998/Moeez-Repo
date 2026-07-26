import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const admissionSchema = z.object({
  patientId: z.string().min(1),
  bedId: z.string().min(1).optional().nullable(),
  admittedAt: z.coerce.date().default(() => new Date()),
  diagnosis: z.string().trim().max(2000).optional().nullable(),
})

const bedSchema = z.object({
  bedNo: z.string().trim().min(1).max(40),
  ward: z.string().trim().min(1).max(100),
  active: z.boolean().default(true),
})

router.get('/', async (req, res) => {
  const items = await db.admission.findMany({
    where: req.query.all === 'true' ? {} : { status: 'ADMITTED' },
    include: {
      patient: { select: { id: true, medicalRecordNo: true, firstName: true, lastName: true } },
      bed: true,
    },
    orderBy: { admittedAt: 'desc' },
  })
  res.json({ items })
})

router.get('/beds/availability', async (_req, res) => {
  const beds = await db.bed.findMany({
    where: { active: true },
    include: { admissions: { where: { status: 'ADMITTED' }, select: { id: true } } },
    orderBy: [{ ward: 'asc' }, { bedNo: 'asc' }],
  })
  res.json({
    items: beds.map(({ admissions, ...bed }) => ({ ...bed, available: admissions.length === 0 })),
  })
})

router.post('/beds', authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const data = bedSchema.parse({
    ...req.body,
    active: req.body.active === undefined ? true : req.body.active === true || req.body.active === 'true',
  })
  const bed = await db.bed.create({ data })
  await writeAudit(req, 'CREATE', 'Bed', bed.id)
  res.status(201).json(bed)
})

router.post('/', authorize('ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'), async (req, res) => {
  const data = admissionSchema.parse(req.body)
  try {
    const admission = await db.$transaction(async (transaction) => {
      if (data.bedId) {
        const occupied = await transaction.admission.findFirst({
          where: { bedId: data.bedId, status: 'ADMITTED' },
        })
        if (occupied) {
          const error = new Error('Bed is already occupied')
          error.status = 409
          throw error
        }
      }
      return transaction.admission.create({ data })
    })
    await writeAudit(req, 'CREATE', 'Admission', admission.id)
    res.status(201).json(admission)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    throw error
  }
})

router.post('/:id/discharge', authorize('ADMIN', 'NURSE', 'DOCTOR'), async (req, res) => {
  const existing = await db.admission.findFirst({
    where: { id: req.params.id, status: 'ADMITTED' },
  })
  if (!existing) return res.status(404).json({ error: 'Active admission not found' })

  const admission = await db.admission.update({
    where: { id: existing.id },
    data: { status: 'DISCHARGED', dischargedAt: new Date() },
  })
  await writeAudit(req, 'DISCHARGE', 'Admission', admission.id)
  res.json(admission)
})

export default router
