import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10)

  const admin = await db.user.upsert({
    where: { email: 'admin@riverside.local' },
    update: {},
    create: {
      email: 'admin@riverside.local',
      passwordHash,
      name: 'Hospital Admin',
      role: 'ADMIN',
    },
  })

  const doctors = await Promise.all(
    [
      ['EMP-101', 'Farooq', 'Hassan', 'Doctor', 'Cardiology'],
      ['EMP-102', 'Zara', 'Malik', 'Doctor', 'Orthopedics'],
      ['EMP-103', 'Noor', 'Ahmed', 'Doctor', 'Pediatrics'],
      ['EMP-104', 'Ali', 'Raza', 'Doctor', 'Neurology'],
      ['EMP-201', 'Saima', 'Iqbal', 'Nurse', 'ICU'],
      ['EMP-202', 'Hassan', 'Javed', 'Nurse', 'General ward'],
      ['EMP-301', 'Nadia', 'Shah', 'Receptionist', 'Front desk'],
    ].map(([employeeNo, firstName, lastName, designation, department]) =>
      db.staff.upsert({
        where: { employeeNo },
        update: { active: true, designation, department },
        create: { employeeNo, firstName, lastName, designation, department, active: true },
      }),
    ),
  )

  const patients = await Promise.all(
    [
      ['MR-1001', 'Ayesha', 'Khan', '1992-04-12', 'Female'],
      ['MR-1002', 'Bilal', 'Ahmed', '1988-09-03', 'Male'],
      ['MR-1003', 'Hina', 'Malik', '1995-01-21', 'Female'],
      ['MR-1004', 'Usman', 'Tariq', '2001-07-18', 'Male'],
      ['MR-1005', 'Sana', 'Riaz', '1990-11-09', 'Female'],
    ].map(([medicalRecordNo, firstName, lastName, dob, sex]) =>
      db.patient.upsert({
        where: { medicalRecordNo },
        update: {},
        create: {
          medicalRecordNo,
          firstName,
          lastName,
          dateOfBirth: new Date(dob),
          sex,
          phone: '+92-300-0000000',
        },
      }),
    ),
  )

  const wards = [
    ['GW-01', 'General ward'],
    ['GW-02', 'General ward'],
    ['GW-03', 'General ward'],
    ['ICU-01', 'ICU'],
    ['ICU-02', 'ICU'],
    ['MAT-01', 'Maternity'],
    ['MAT-02', 'Maternity'],
    ['PED-01', 'Pediatrics'],
    ['PED-02', 'Pediatrics'],
  ]

  for (const [bedNo, ward] of wards) {
    await db.bed.upsert({
      where: { bedNo },
      update: { active: true },
      create: { bedNo, ward, active: true },
    })
  }

  const beds = await db.bed.findMany()
  const existingAdmission = await db.admission.findFirst({ where: { status: 'ADMITTED' } })
  if (!existingAdmission) {
    await db.admission.create({
      data: {
        patientId: patients[0].id,
        bedId: beds.find((b) => b.ward === 'ICU')?.id,
        diagnosis: 'Chest pain observation',
        status: 'ADMITTED',
      },
    })
    await db.admission.create({
      data: {
        patientId: patients[1].id,
        bedId: beds.find((b) => b.ward === 'General ward')?.id,
        diagnosis: 'Post-op recovery',
        status: 'ADMITTED',
      },
    })
  }

  const today = new Date()
  today.setHours(9, 0, 0, 0)

  const apptCount = await db.appointment.count()
  if (apptCount === 0) {
    const slots = [
      [0, patients[0], doctors[0], 'CONFIRMED', 'Follow-up'],
      [90, patients[1], doctors[1], 'CONFIRMED', 'Consultation'],
      [135, patients[2], doctors[0], 'PENDING', 'Review'],
      [240, patients[3], doctors[2], 'CANCELLED', 'Checkup'],
      [345, patients[4], doctors[3], 'CONFIRMED', 'Neurology consult'],
    ]

    for (const [offset, patient, doctor, status, reason] of slots) {
      const startsAt = new Date(today.getTime() + offset * 60 * 1000)
      await db.appointment.create({
        data: {
          patientId: patient.id,
          staffId: doctor.id,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
          reason,
          status,
        },
      })
    }
  }

  const surgeryCount = await db.surgery.count()
  if (surgeryCount === 0) {
    const surgeryAt = new Date()
    surgeryAt.setDate(surgeryAt.getDate() + 2)
    surgeryAt.setHours(10, 0, 0, 0)
    await db.surgery.create({
      data: {
        patientId: patients[1].id,
        surgeonId: doctors[1].id,
        theatre: 'Theatre 1',
        scheduledAt: surgeryAt,
        durationMin: 120,
        status: 'SCHEDULED',
        notes: 'Knee arthroscopy',
      },
    })
  }

  const treatmentCount = await db.treatment.count()
  if (treatmentCount === 0) {
    await db.treatment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        name: 'Beta blocker course',
        dosage: '50mg once daily',
        startDate: new Date(),
        status: 'ACTIVE',
      },
    })
  }

  const inventoryCount = await db.inventoryItem.count()
  if (inventoryCount === 0) {
    await db.inventoryItem.createMany({
      data: [
        { sku: 'MED-001', name: 'Paracetamol 500mg', category: 'Medicine', quantity: 240, unit: 'tablets', reorderLevel: 100, unitCost: 2.5 },
        { sku: 'MED-002', name: 'Amoxicillin 250mg', category: 'Medicine', quantity: 80, unit: 'capsules', reorderLevel: 100, unitCost: 8 },
        { sku: 'SUP-001', name: 'Surgical gloves (M)', category: 'Supplies', quantity: 500, unit: 'pairs', reorderLevel: 200, unitCost: 15 },
        { sku: 'SUP-002', name: 'IV cannula 20G', category: 'Supplies', quantity: 45, unit: 'pcs', reorderLevel: 50, unitCost: 35 },
      ],
    })
  }

  const shiftCount = await db.shift.count()
  if (shiftCount === 0) {
    const shiftStart = new Date()
    shiftStart.setHours(8, 0, 0, 0)
    for (const [index, member] of doctors.slice(0, 4).entries()) {
      const start = new Date(shiftStart.getTime() + index * 4 * 60 * 60 * 1000)
      await db.shift.create({
        data: {
          staffId: member.id,
          startsAt: start,
          endsAt: new Date(start.getTime() + 8 * 60 * 60 * 1000),
          ward: ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology'][index],
        },
      })
    }
  }

  const invoiceExists = await db.invoice.findFirst()
  if (!invoiceExists) {
    await db.invoice.create({
      data: {
        invoiceNo: 'INV-1001',
        patientId: patients[0].id,
        status: 'PAID',
        currency: 'PKR',
        subtotal: 15000,
        discount: 500,
        tax: 0,
        total: 14500,
        items: {
          create: [
            { description: 'Consultation', quantity: 1, unitPrice: 5000, amount: 5000 },
            { description: 'Lab panel', quantity: 1, unitPrice: 10000, amount: 10000 },
          ],
        },
        payments: {
          create: [{ amount: 14500, method: 'Card', referenceNo: 'PAY-001' }],
        },
      },
    })
  }

  console.log('Seed complete')
  console.log('Login: admin@riverside.local / Admin123!')
  console.log(`Admin user id: ${admin.id}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
