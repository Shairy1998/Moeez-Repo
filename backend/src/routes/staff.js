import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const staffSchema = z.object({
  employeeNo: z.string().trim().min(2).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  designation: z.string().trim().min(2).max(100),
  department: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  active: z.boolean().default(true),
})

router.get('/', async (req, res) => {
  const where =
    req.query.active === 'all' ? {} : req.query.active === 'false' ? { active: false } : { active: true }
  const items = await db.staff.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const data = staffSchema.parse({
    ...req.body,
    active: req.body.active === undefined ? true : req.body.active === true || req.body.active === 'true',
  })
  const staff = await db.staff.create({ data })
  await writeAudit(req, 'CREATE', 'Staff', staff.id)
  res.status(201).json(staff)
})

router.patch('/:id', authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const parsed = staffSchema.partial().parse({
    ...req.body,
    ...(req.body.active !== undefined
      ? { active: req.body.active === true || req.body.active === 'true' }
      : {}),
  })
  const staff = await db.staff.update({
    where: { id: req.params.id },
    data: parsed,
  })
  await writeAudit(req, 'UPDATE', 'Staff', staff.id, { fields: Object.keys(req.body) })
  res.json(staff)
})

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await db.staff.update({
    where: { id: req.params.id },
    data: { active: false },
  })
  await writeAudit(req, 'DEACTIVATE', 'Staff', req.params.id)
  res.status(204).end()
})

export default router
