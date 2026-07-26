import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BedDouble, LogOut, Plus, RefreshCw, X } from 'lucide-react'
import { api } from '../lib/api.js'
import { StatusBadge } from '../components/ResourcePage.jsx'

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'

export default function Admissions() {
  const [admissions, setAdmissions] = useState([])
  const [beds, setBeds] = useState([])
  const [patients, setPatients] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // 'admit' | 'bed' | null
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [admitForm, setAdmitForm] = useState({ patientId: '', bedId: '', diagnosis: '' })
  const [bedForm, setBedForm] = useState({ bedNo: '', ward: 'General ward' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [adm, bedList, pats] = await Promise.all([
        api(`/admissions${showAll ? '?all=true' : ''}`),
        api('/admissions/beds/availability'),
        api('/patients?pageSize=100'),
      ])
      setAdmissions(adm.items || [])
      setBeds(bedList.items || [])
      setPatients(pats.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [showAll])

  useEffect(() => { load() }, [load])

  const availableBeds = beds.filter((b) => b.available)

  const submitAdmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api('/admissions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: admitForm.patientId,
          bedId: admitForm.bedId || null,
          diagnosis: admitForm.diagnosis || null,
        }),
      })
      setModal(null)
      setAdmitForm({ patientId: '', bedId: '', diagnosis: '' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const submitBed = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api('/admissions/beds', {
        method: 'POST',
        body: JSON.stringify(bedForm),
      })
      setModal(null)
      setBedForm({ bedNo: '', ward: 'General ward' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const discharge = async (admission) => {
    if (!window.confirm(`Discharge ${admission.patient?.firstName} ${admission.patient?.lastName}?`)) return
    try {
      await api(`/admissions/${admission.id}/discharge`, { method: 'POST' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const wardSummary = beds.reduce((acc, bed) => {
    if (!acc[bed.ward]) acc[bed.ward] = { total: 0, free: 0 }
    acc[bed.ward].total += 1
    if (bed.available) acc[bed.ward].free += 1
    return acc
  }, {})

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderRadius: 18, padding: '1rem 1.1rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Admissions & beds</div>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>
            {loading ? 'Loading…' : `${admissions.length} record${admissions.length === 1 ? '' : 's'} · ${availableBeds.length} beds free`}
          </div>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--sub)' }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Show discharged
        </label>
        <button type="button" className="btn btn-icon" onClick={load} aria-label="Refresh"><RefreshCw size={14} /></button>
        <button type="button" className="btn" onClick={() => { setFormError(''); setModal('bed') }}>
          <BedDouble size={14} /> Add bed
        </button>
        <button type="button" className="btn btn-primary" onClick={() => { setFormError(''); setModal('admit') }}>
          <Plus size={15} /> Admit patient
        </button>
      </motion.div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(wardSummary).map(([ward, stats], i) => (
          <motion.div
            key={ward}
            className="glass-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ borderRadius: 14, padding: '0.85rem 1rem' }}
          >
            <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 4 }}>{ward}</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{stats.total - stats.free}/{stats.total}</div>
            <div style={{ fontSize: 11.5, color: stats.free ? 'var(--success)' : 'var(--danger)' }}>{stats.free} free</div>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="glass-panel" style={{ borderRadius: 14, padding: '0.8rem 1rem', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderRadius: 18, padding: '0.5rem 0.75rem', overflowX: 'auto' }}
      >
        <table className="rp-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Bed</th>
              <th>Ward</th>
              <th>Admitted</th>
              <th>Diagnosis</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && admissions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--sub)', padding: '2rem' }}>
                  No admissions yet. Click “Admit patient” to start.
                </td>
              </tr>
            )}
            {admissions.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.4) }}
              >
                <td style={{ fontWeight: 600 }}>
                  {item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : '—'}
                  <div style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 400 }}>{item.patient?.medicalRecordNo}</div>
                </td>
                <td>{item.bed?.bedNo || '—'}</td>
                <td>{item.bed?.ward || '—'}</td>
                <td>{fmtDateTime(item.admittedAt)}</td>
                <td>{item.diagnosis || '—'}</td>
                <td><StatusBadge value={item.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  {item.status === 'ADMITTED' && (
                    <button type="button" className="btn" style={{ fontSize: 12, padding: '0.35rem 0.7rem' }} onClick={() => discharge(item)}>
                      <LogOut size={13} /> Discharge
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {modal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null) }}
          >
            <motion.form
              className="modal"
              style={{ width: 'min(480px, 100%)' }}
              onSubmit={modal === 'admit' ? submitAdmit : submitBed}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{modal === 'admit' ? 'Admit patient' : 'Add bed'}</div>
                <button type="button" className="btn btn-icon" onClick={() => setModal(null)} aria-label="Close"><X size={15} /></button>
              </div>

              {modal === 'admit' ? (
                <>
                  <label className="field-label" htmlFor="adm-patient">Patient *</label>
                  <select
                    id="adm-patient"
                    className="select"
                    required
                    value={admitForm.patientId}
                    onChange={(e) => setAdmitForm((prev) => ({ ...prev, patientId: e.target.value }))}
                    style={{ marginBottom: 12 }}
                  >
                    <option value="">Select…</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.medicalRecordNo})</option>
                    ))}
                  </select>

                  <label className="field-label" htmlFor="adm-bed">Bed</label>
                  <select
                    id="adm-bed"
                    className="select"
                    value={admitForm.bedId}
                    onChange={(e) => setAdmitForm((prev) => ({ ...prev, bedId: e.target.value }))}
                    style={{ marginBottom: 12 }}
                  >
                    <option value="">Unassigned</option>
                    {availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>{b.bedNo} · {b.ward}</option>
                    ))}
                  </select>

                  <label className="field-label" htmlFor="adm-dx">Diagnosis</label>
                  <textarea
                    id="adm-dx"
                    className="textarea"
                    rows={3}
                    value={admitForm.diagnosis}
                    onChange={(e) => setAdmitForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  />
                </>
              ) : (
                <>
                  <label className="field-label" htmlFor="bed-no">Bed number *</label>
                  <input
                    id="bed-no"
                    className="input"
                    required
                    value={bedForm.bedNo}
                    onChange={(e) => setBedForm((prev) => ({ ...prev, bedNo: e.target.value }))}
                    style={{ marginBottom: 12 }}
                  />
                  <label className="field-label" htmlFor="bed-ward">Ward *</label>
                  <select
                    id="bed-ward"
                    className="select"
                    required
                    value={bedForm.ward}
                    onChange={(e) => setBedForm((prev) => ({ ...prev, ward: e.target.value }))}
                  >
                    {['General ward', 'ICU', 'Maternity', 'Pediatrics', 'Emergency', 'Surgical'].map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </>
              )}

              {formError && (
                <div style={{ marginTop: 12, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: 12.5 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modal === 'admit' ? 'Admit' : 'Create bed'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
