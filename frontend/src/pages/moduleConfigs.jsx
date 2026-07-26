import { StatusBadge } from '../components/ResourcePage.jsx'

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB') : '—')
const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'
const personName = (person) => (person ? `${person.firstName} ${person.lastName}` : '—')

const isDoctor = (staff) => /doctor|dr\b|physician|surgeon/i.test(staff.designation || '')

export const MODULE_CONFIGS = {
  Patients: {
    title: 'Patient registry',
    singular: 'patient',
    endpoint: '/patients',
    searchable: true,
    canDelete: true,
    columns: [
      { label: 'MRN', key: 'medicalRecordNo' },
      { label: 'Name', render: (p) => `${p.firstName} ${p.lastName}` },
      { label: 'Sex', key: 'sex' },
      { label: 'Date of birth', render: (p) => fmtDate(p.dateOfBirth) },
      { label: 'Phone', key: 'phone' },
      { label: 'Blood group', key: 'bloodGroup' },
    ],
    fields: [
      { name: 'medicalRecordNo', label: 'Medical record no.', required: true },
      { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female', 'Other', 'Unknown'], required: true },
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'bloodGroup', label: 'Blood group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { name: 'address', label: 'Address', wide: true },
      { name: 'emergencyContact', label: 'Emergency contact', wide: true },
      { name: 'allergies', label: 'Allergies', type: 'textarea', wide: true },
    ],
  },

  Doctors: {
    title: 'Doctors',
    singular: 'doctor',
    endpoint: '/staff',
    query: 'active=all',
    filterItems: isDoctor,
    canDelete: true,
    defaults: { designation: 'Doctor', active: true },
    columns: [
      { label: 'Employee no.', key: 'employeeNo' },
      { label: 'Name', render: (s) => `Dr. ${s.firstName} ${s.lastName}` },
      { label: 'Department', key: 'department' },
      { label: 'Phone', key: 'phone' },
      { label: 'Email', key: 'email' },
      { label: 'Status', render: (s) => <StatusBadge value={s.active ? 'ACTIVE' : 'STOPPED'} /> },
    ],
    fields: [
      { name: 'employeeNo', label: 'Employee no.', required: true },
      { name: 'designation', label: 'Designation', required: true, default: 'Doctor' },
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'department', label: 'Department / specialty' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'active', label: 'Active', type: 'boolean', default: true },
    ],
  },

  Employees: {
    title: 'All employees',
    singular: 'employee',
    endpoint: '/staff',
    query: 'active=all',
    canDelete: true,
    defaults: { active: true },
    columns: [
      { label: 'Employee no.', key: 'employeeNo' },
      { label: 'Name', render: (s) => `${s.firstName} ${s.lastName}` },
      { label: 'Designation', key: 'designation' },
      { label: 'Department', key: 'department' },
      { label: 'Phone', key: 'phone' },
      { label: 'Status', render: (s) => <StatusBadge value={s.active ? 'ACTIVE' : 'STOPPED'} /> },
    ],
    fields: [
      { name: 'employeeNo', label: 'Employee no.', required: true },
      {
        name: 'designation',
        label: 'Designation',
        type: 'select',
        options: ['Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Admin', 'Cleaner', 'Security'],
        required: true,
      },
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'department', label: 'Department' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'active', label: 'Active', type: 'boolean', default: true },
    ],
  },

  Appointments: {
    title: 'Appointments',
    singular: 'appointment',
    endpoint: '/appointments',
    query: 'from=2000-01-01&to=2100-01-01',
    canDelete: true,
    columns: [
      { label: 'When', render: (a) => fmtDateTime(a.startsAt) },
      { label: 'Patient', render: (a) => personName(a.patient) },
      { label: 'Doctor', render: (a) => personName(a.staff) },
      { label: 'Reason', key: 'reason' },
      { label: 'Status', render: (a) => <StatusBadge value={a.status} /> },
    ],
    fields: [
      { name: 'patientId', label: 'Patient', optionsSource: 'patients', required: true },
      { name: 'staffId', label: 'Doctor / staff', optionsSource: 'staff', required: true },
      { name: 'startsAt', label: 'Starts at', type: 'datetime', required: true },
      { name: 'endsAt', label: 'Ends at', type: 'datetime' },
      { name: 'status', label: 'Status', type: 'select', options: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], default: 'PENDING' },
      { name: 'reason', label: 'Reason' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },

  Surgeries: {
    title: 'Surgeries',
    singular: 'surgery',
    endpoint: '/surgeries',
    canDelete: true,
    columns: [
      { label: 'Scheduled', render: (s) => fmtDateTime(s.scheduledAt) },
      { label: 'Patient', render: (s) => personName(s.patient) },
      { label: 'Surgeon', render: (s) => personName(s.surgeon) },
      { label: 'Theatre', key: 'theatre' },
      { label: 'Duration', render: (s) => `${s.durationMin} min` },
      { label: 'Status', render: (s) => <StatusBadge value={s.status} /> },
    ],
    fields: [
      { name: 'patientId', label: 'Patient', optionsSource: 'patients', required: true },
      { name: 'surgeonId', label: 'Surgeon', optionsSource: 'staff', required: true },
      { name: 'scheduledAt', label: 'Scheduled at', type: 'datetime', required: true },
      { name: 'durationMin', label: 'Duration (minutes)', type: 'number', default: 60 },
      { name: 'theatre', label: 'Theatre' },
      { name: 'status', label: 'Status', type: 'select', options: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },

  'Staff schedule': {
    title: 'Staff schedule',
    singular: 'shift',
    endpoint: '/shifts',
    canDelete: true,
    columns: [
      { label: 'Staff', render: (s) => personName(s.staff) },
      { label: 'Role', render: (s) => s.staff?.designation ?? '—' },
      { label: 'Starts', render: (s) => fmtDateTime(s.startsAt) },
      { label: 'Ends', render: (s) => fmtDateTime(s.endsAt) },
      { label: 'Ward', key: 'ward' },
    ],
    fields: [
      { name: 'staffId', label: 'Staff member', optionsSource: 'staff', required: true },
      { name: 'ward', label: 'Ward / unit' },
      { name: 'startsAt', label: 'Shift starts', type: 'datetime', required: true },
      { name: 'endsAt', label: 'Shift ends', type: 'datetime', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },

  Treatments: {
    title: 'Treatments & prescriptions',
    singular: 'treatment',
    endpoint: '/treatments',
    canDelete: true,
    columns: [
      { label: 'Treatment', key: 'name' },
      { label: 'Patient', render: (t) => personName(t.patient) },
      { label: 'Doctor', render: (t) => personName(t.doctor) },
      { label: 'Dosage', key: 'dosage' },
      { label: 'Started', render: (t) => fmtDate(t.startDate) },
      { label: 'Status', render: (t) => <StatusBadge value={t.status} /> },
    ],
    fields: [
      { name: 'patientId', label: 'Patient', optionsSource: 'patients', required: true },
      { name: 'doctorId', label: 'Doctor', optionsSource: 'staff', required: true },
      { name: 'name', label: 'Treatment / medication', required: true },
      { name: 'dosage', label: 'Dosage' },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'COMPLETED', 'STOPPED'], default: 'ACTIVE' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },

  Inventory: {
    title: 'Inventory',
    singular: 'item',
    endpoint: '/inventory',
    canDelete: true,
    columns: [
      { label: 'SKU', key: 'sku' },
      { label: 'Item', key: 'name' },
      { label: 'Category', key: 'category' },
      {
        label: 'Stock',
        render: (i) => (
          <span style={{ fontWeight: 600, color: i.quantity <= i.reorderLevel ? 'var(--danger)' : 'var(--ink)' }}>
            {i.quantity} {i.unit}
            {i.quantity <= i.reorderLevel ? ' · low' : ''}
          </span>
        ),
      },
      { label: 'Reorder at', key: 'reorderLevel' },
      { label: 'Unit cost', render: (i) => `PKR ${Number(i.unitCost).toLocaleString()}` },
      { label: 'Expiry', render: (i) => fmtDate(i.expiryAt) },
    ],
    fields: [
      { name: 'sku', label: 'SKU', required: true },
      { name: 'name', label: 'Item name', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Medicine', 'Supplies', 'Equipment', 'Lab', 'Other'] },
      { name: 'unit', label: 'Unit', default: 'pcs' },
      { name: 'quantity', label: 'Quantity', type: 'number', default: 0, required: true },
      { name: 'reorderLevel', label: 'Reorder level', type: 'number', default: 10 },
      { name: 'unitCost', label: 'Unit cost (PKR)', type: 'number', step: '0.01', default: 0 },
      { name: 'expiryAt', label: 'Expiry date', type: 'date' },
    ],
  },
}
