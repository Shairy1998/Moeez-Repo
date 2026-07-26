import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '../db.js'
import { config } from '../config.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
})

router.post('/login', async (req, res) => {
  const credentials = loginSchema.parse(req.body)
  const user = await db.user.findUnique({ where: { email: credentials.email } })

  if (!user || !user.active || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    config.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '8h',
      issuer: 'riverside-hms',
      audience: 'riverside-hms-api',
    },
  )

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
})

router.get('/me', authenticate, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, email: true, name: true, role: true, active: true },
  })

  if (!user?.active) return res.status(401).json({ error: 'Account is inactive' })
  return res.json(user)
})

export default router
