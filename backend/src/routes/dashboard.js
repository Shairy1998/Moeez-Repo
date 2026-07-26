import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/overview', async (_req, res) => {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1)

  const [
    patientsAdmitted,
    doctorsOnDuty,
    surgeriesThisWeek,
    revenueAgg,
    appointments,
    beds,
    admissionsToday,
  ] = await Promise.all([
    db.admission.count({ where: { status: 'ADMITTED' } }),
    db.staff.count({ where: { active: true, designation: { contains: 'Doctor' } } }),
    db.surgery.count({ where: { status: 'SCHEDULED' } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: startOfMonth } },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: startOfDay, lte: endOfDay } },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        staff: { select: { firstName: true, lastName: true, designation: true, department: true } },
      },
      orderBy: { startsAt: 'asc' },
      take: 8,
    }),
    db.bed.findMany({
      where: { active: true },
      include: { admissions: { where: { status: 'ADMITTED' }, select: { id: true } } },
    }),
    db.admission.count({ where: { admittedAt: { gte: startOfDay } } }),
  ])

  const wards = {}
  for (const bed of beds) {
    if (!wards[bed.ward]) wards[bed.ward] = { total: 0, occupied: 0 }
    wards[bed.ward].total += 1
    if (bed.admissions.length > 0) wards[bed.ward].occupied += 1
  }

  const bedOccupancy = Object.entries(wards).map(([ward, stats]) => ({
    ward,
    occ: stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0,
    free: stats.total - stats.occupied,
  }))

  const revenue = Number(revenueAgg._sum.amount ?? 0)

  res.json({
    stats: {
      patientsAdmitted,
      doctorsOnDuty,
      surgeriesScheduled: surgeriesThisWeek,
      revenueMonth: revenue,
      admissionsToday,
    },
    appointments: appointments.map((item) => ({
      time: item.startsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      patient: `${item.patient.firstName} ${item.patient.lastName}`,
      doctor: `Dr. ${item.staff.lastName} · ${item.staff.department || item.staff.designation}`,
      status: item.status.charAt(0) + item.status.slice(1).toLowerCase().replace('_', ' '),
      kind:
        item.status === 'CONFIRMED' || item.status === 'COMPLETED'
          ? 'success'
          : item.status === 'PENDING'
            ? 'warn'
            : 'danger',
    })),
    beds: bedOccupancy,
  })
})

export default router
