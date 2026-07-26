import { ZodError } from 'zod'

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      })),
    })
  }

  if (error?.status) {
    return res.status(error.status).json({ error: error.message })
  }

  if (error?.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists' })
  }

  if (error?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' })
  }

  console.error(error)
  return res.status(500).json({ error: 'An unexpected error occurred' })
}
