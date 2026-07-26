import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { writeAudit } from '../audit.js'
import { authorize } from '../middleware/auth.js'

const router = Router()

const invoiceSchema = z.object({
  invoiceNo: z.string().trim().min(2).max(40),
  patientId: z.string().min(1),
  currency: z.string().trim().length(3).default('PKR'),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  dueAt: z.coerce.date().optional().nullable(),
  items: z.array(z.object({
    description: z.string().trim().min(1).max(300),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().nonnegative(),
  })).min(1),
})

router.get('/', async (req, res) => {
  const items = await db.invoice.findMany({
    where: req.query.patientId ? { patientId: String(req.query.patientId) } : {},
    include: {
      patient: { select: { medicalRecordNo: true, firstName: true, lastName: true } },
      payments: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json({ items })
})

router.post('/', authorize('ADMIN', 'BILLING'), async (req, res) => {
  const input = invoiceSchema.parse(req.body)
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const total = subtotal - input.discount + input.tax
  if (total < 0) return res.status(400).json({ error: 'Invoice total cannot be negative' })

  const invoice = await db.invoice.create({
    data: {
      invoiceNo: input.invoiceNo,
      patientId: input.patientId,
      currency: input.currency.toUpperCase(),
      subtotal,
      discount: input.discount,
      tax: input.tax,
      total,
      dueAt: input.dueAt,
      status: 'ISSUED',
      items: {
        create: input.items.map((item) => ({
          ...item,
          amount: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  })
  await writeAudit(req, 'CREATE', 'Invoice', invoice.id)
  res.status(201).json(invoice)
})

router.post('/:id/payments', authorize('ADMIN', 'BILLING'), async (req, res) => {
  const input = z.object({
    amount: z.coerce.number().positive(),
    method: z.string().trim().min(2).max(50),
    referenceNo: z.string().trim().max(100).optional().nullable(),
  }).parse(req.body)

  const result = await db.$transaction(async (transaction) => {
    const invoice = await transaction.invoice.findUnique({
      where: { id: req.params.id },
      include: { payments: true },
    })
    if (!invoice || ['VOID', 'PAID'].includes(invoice.status)) {
      const error = new Error('Invoice cannot receive a payment')
      error.status = 409
      throw error
    }
    const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    if (paid + input.amount > Number(invoice.total)) {
      const error = new Error('Payment exceeds outstanding balance')
      error.status = 400
      throw error
    }
    const payment = await transaction.payment.create({
      data: { invoiceId: invoice.id, ...input },
    })
    const newPaid = paid + input.amount
    await transaction.invoice.update({
      where: { id: invoice.id },
      data: { status: newPaid === Number(invoice.total) ? 'PAID' : 'PARTIALLY_PAID' },
    })
    return payment
  })

  await writeAudit(req, 'PAYMENT', 'Invoice', req.params.id, { paymentId: result.id })
  res.status(201).json(result)
})

export default router
