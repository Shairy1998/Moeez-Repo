import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const shiftSchema = z
  .object({
    staffId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    ward: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'Shift end must be after start',
    path: ['endsAt'],
  })

router.get('/', async (_req, res) => {
  const items = await db.shift.findMany({
    include: {
      staff: { select: { id: true, firstName: true, lastName: true, designation: true } },
    },
    orderBy: { startsAt: 'desc' },
    take: 300,
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const shift = await db.shift.create({ data: shiftSchema.parse(req.body) })
  await writeAudit(req, 'CREATE', 'Shift', shift.id)
  res.status(201).json(shift)
})

router.patch('/:id', authorize('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const shift = await db.shift.update({
    where: { id: req.params.id },
    data: shiftSchema.innerType().partial().parse(req.body),
  })
  await writeAudit(req, 'UPDATE', 'Shift', shift.id, { fields: Object.keys(req.body) })
  res.json(shift)
})

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await db.shift.delete({ where: { id: req.params.id } })
  await writeAudit(req, 'DELETE', 'Shift', req.params.id)
  res.status(204).end()
})

export default router
