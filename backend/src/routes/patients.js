import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const patientSchema = z.object({
  medicalRecordNo: z.string().trim().min(2).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.coerce.date().max(new Date()),
  sex: z.enum(['Male', 'Female', 'Other', 'Unknown']),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  emergencyContact: z.string().trim().max(200).optional().nullable(),
  bloodGroup: z.string().trim().max(10).optional().nullable(),
  allergies: z.string().trim().max(1000).optional().nullable(),
})

const querySchema = z.object({
  search: z.string().trim().max(100).default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

router.get('/', async (req, res) => {
  const { search, page, pageSize } = querySchema.parse(req.query)
  const where = search
    ? {
        OR: [
          { medicalRecordNo: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { phone: { contains: search } },
        ],
      }
    : {}

  const [items, total] = await db.$transaction([
    db.patient.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.patient.count({ where }),
  ])

  res.json({ items, page, pageSize, total })
})

router.get('/:id', async (req, res) => {
  const patient = await db.patient.findUnique({ where: { id: req.params.id } })
  if (!patient) return res.status(404).json({ error: 'Patient not found' })
  return res.json(patient)
})

router.post('/', authorize('ADMIN', 'RECEPTIONIST', 'NURSE'), async (req, res) => {
  const patient = await db.patient.create({ data: patientSchema.parse(req.body) })
  await writeAudit(req, 'CREATE', 'Patient', patient.id)
  res.status(201).json(patient)
})

router.patch('/:id', authorize('ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'), async (req, res) => {
  const patient = await db.patient.update({
    where: { id: req.params.id },
    data: patientSchema.partial().parse(req.body),
  })
  await writeAudit(req, 'UPDATE', 'Patient', patient.id, { fields: Object.keys(req.body) })
  res.json(patient)
})

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    await db.patient.delete({ where: { id: req.params.id } })
    await writeAudit(req, 'DELETE', 'Patient', req.params.id)
    res.status(204).end()
  } catch (error) {
    if (error?.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete patient with existing appointments, admissions, treatments, or invoices. Remove related records first.',
      })
    }
    throw error
  }
})

export default router
