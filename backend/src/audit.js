import { db } from './db.js'

export async function writeAudit(req, action, entityType, entityId, metadata) {
  await db.auditLog.create({
    data: {
      userId: req.user?.sub,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      ipAddress: req.ip,
    },
  })
}
