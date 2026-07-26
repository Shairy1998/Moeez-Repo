import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const itemSchema = z.object({
  sku: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional().nullable(),
  quantity: z.coerce.number().int().min(0).default(0),
  unit: z.string().trim().max(30).default('pcs'),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  unitCost: z.coerce.number().min(0).default(0),
  expiryAt: z.coerce.date().optional().nullable(),
})

router.get('/', async (_req, res) => {
  const items = await db.inventoryItem.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    take: 500,
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'NURSE', 'RECEPTIONIST'), async (req, res) => {
  const item = await db.inventoryItem.create({ data: itemSchema.parse(req.body) })
  await writeAudit(req, 'CREATE', 'InventoryItem', item.id)
  res.status(201).json(item)
})

router.patch('/:id', authorize('ADMIN', 'NURSE', 'RECEPTIONIST'), async (req, res) => {
  const item = await db.inventoryItem.update({
    where: { id: req.params.id },
    data: itemSchema.partial().parse(req.body),
  })
  await writeAudit(req, 'UPDATE', 'InventoryItem', item.id, { fields: Object.keys(req.body) })
  res.json(item)
})

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await db.inventoryItem.delete({ where: { id: req.params.id } })
  await writeAudit(req, 'DELETE', 'InventoryItem', req.params.id)
  res.status(204).end()
})

export default router
