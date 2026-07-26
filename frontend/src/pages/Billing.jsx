import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CreditCard, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { api } from '../lib/api.js'
import { StatusBadge } from '../components/ResourcePage.jsx'

const money = (value) => `PKR ${Number(value).toLocaleString()}`
const paidAmount = (invoice) => (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0)

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: '' }

export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [invoiceModal, setInvoiceModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(null) // invoice | null
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [invForm, setInvForm] = useState({ patientId: '', discount: 0, tax: 0, dueAt: '', items: [{ ...EMPTY_ITEM }] })
  const [payForm, setPayForm] = useState({ amount: '', method: 'Cash', referenceNo: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [inv, pats] = await Promise.all([api('/billing'), api('/patients?pageSize=100')])
      setInvoices(inv.items || [])
      setPatients(pats.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const subtotal = invForm.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0,
  )
  const total = subtotal - (Number(invForm.discount) || 0) + (Number(invForm.tax) || 0)

  const updateItem = (index, key, value) => {
    setInvForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }))
  }

  const submitInvoice = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api('/billing', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNo: `INV-${Date.now().toString().slice(-8)}`,
          patientId: invForm.patientId,
          discount: Number(invForm.discount) || 0,
          tax: Number(invForm.tax) || 0,
          dueAt: invForm.dueAt || null,
          items: invForm.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      })
      setInvoiceModal(false)
      setInvForm({ patientId: '', discount: 0, tax: 0, dueAt: '', items: [{ ...EMPTY_ITEM }] })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const submitPayment = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api(`/billing/${paymentModal.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payForm.amount),
          method: payForm.method,
          referenceNo: payForm.referenceNo || null,
        }),
      })
      setPaymentModal(null)
      setPayForm({ amount: '', method: 'Cash', referenceNo: '' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ borderRadius: 18, padding: '1rem 1.1rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Billing & invoices</div>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>
            {loading ? 'Loading…' : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`}
          </div>
        </div>
        <button type="button" className="btn btn-icon" onClick={load} aria-label="Refresh"><RefreshCw size={14} /></button>
        <button type="button" className="btn btn-primary" onClick={() => { setFormError(''); setInvoiceModal(true) }}>
          <Plus size={15} />
          New invoice
        </button>
      </motion.div>

      {error && (
        <div className="glass-panel" style={{ borderRadius: 14, padding: '0.8rem 1rem', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        style={{ borderRadius: 18, padding: '0.5rem 0.75rem', overflowX: 'auto' }}
      >
        <table className="rp-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Patient</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--sub)', padding: '2rem' }}>
                  No invoices yet. Click “New invoice” to create the first one.
                </td>
              </tr>
            )}
            {invoices.map((invoice, index) => {
              const paid = paidAmount(invoice)
              const open = !['PAID', 'VOID'].includes(invoice.status)
              return (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3 }}
                >
                  <td style={{ fontWeight: 600 }}>{invoice.invoiceNo}</td>
                  <td>{invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : '—'}</td>
                  <td>{money(invoice.total)}</td>
                  <td style={{ color: paid >= Number(invoice.total) ? 'var(--success)' : 'var(--sub)' }}>{money(paid)}</td>
                  <td><StatusBadge value={invoice.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {open && (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '0.35rem 0.7rem', fontSize: 12 }}
                        onClick={() => { setFormError(''); setPayForm({ amount: '', method: 'Cash', referenceNo: '' }); setPaymentModal(invoice) }}
                      >
                        <CreditCard size={13} />
                        Add payment
                      </button>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {invoiceModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setInvoiceModal(false) }}
          >
            <motion.form
              className="modal"
              onSubmit={submitInvoice}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>New invoice</div>
                <button type="button" className="btn btn-icon" onClick={() => setInvoiceModal(false)} aria-label="Close"><X size={15} /></button>
              </div>

              <div className="form-grid">
                <div>
                  <label className="field-label" htmlFor="inv-patient">Patient *</label>
                  <select
                    id="inv-patient"
                    className="select"
                    required
                    value={invForm.patientId}
                    onChange={(e) => setInvForm((prev) => ({ ...prev, patientId: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.medicalRecordNo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="inv-due">Due date</label>
                  <input
                    id="inv-due"
                    className="input"
                    type="date"
                    value={invForm.dueAt}
                    onChange={(e) => setInvForm((prev) => ({ ...prev, dueAt: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ margin: '16px 0 8px', fontWeight: 600, fontSize: 13 }}>Line items</div>
              {invForm.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 36px', gap: 8, marginBottom: 8 }}>
                  <input
                    className="input"
                    placeholder="Description"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                  <input
                    className="input"
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit price"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    disabled={invForm.items.length === 1}
                    onClick={() => setInvForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}
                    aria-label="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn"
                style={{ fontSize: 12 }}
                onClick={() => setInvForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }))}
              >
                <Plus size={13} /> Add line
              </button>

              <div className="form-grid" style={{ marginTop: 14 }}>
                <div>
                  <label className="field-label" htmlFor="inv-discount">Discount (PKR)</label>
                  <input
                    id="inv-discount"
                    className="input"
                    type="number"
                    min="0"
                    value={invForm.discount}
                    onChange={(e) => setInvForm((prev) => ({ ...prev, discount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="inv-tax">Tax (PKR)</label>
                  <input
                    id="inv-tax"
                    className="input"
                    type="number"
                    min="0"
                    value={invForm.tax}
                    onChange={(e) => setInvForm((prev) => ({ ...prev, tax: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginTop: 14, textAlign: 'right', fontSize: 14 }}>
                Subtotal: <strong>{money(subtotal)}</strong> · Total: <strong style={{ color: 'var(--primary)' }}>{money(total)}</strong>
              </div>

              {formError && (
                <div style={{ marginTop: 12, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: 12.5 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn" onClick={() => setInvoiceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create invoice'}</button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {paymentModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setPaymentModal(null) }}
          >
            <motion.form
              className="modal"
              style={{ width: 'min(420px, 100%)' }}
              onSubmit={submitPayment}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Payment — {paymentModal.invoiceNo}</div>
                <button type="button" className="btn btn-icon" onClick={() => setPaymentModal(null)} aria-label="Close"><X size={15} /></button>
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--sub)', marginBottom: 14 }}>
                Outstanding: <strong style={{ color: 'var(--ink)' }}>{money(Number(paymentModal.total) - paidAmount(paymentModal))}</strong>
              </div>

              <label className="field-label" htmlFor="pay-amount">Amount (PKR) *</label>
              <input
                id="pay-amount"
                className="input"
                type="number"
                min="1"
                step="0.01"
                required
                value={payForm.amount}
                onChange={(e) => setPayForm((prev) => ({ ...prev, amount: e.target.value }))}
                style={{ marginBottom: 12 }}
              />

              <label className="field-label" htmlFor="pay-method">Method *</label>
              <select
                id="pay-method"
                className="select"
                value={payForm.method}
                onChange={(e) => setPayForm((prev) => ({ ...prev, method: e.target.value }))}
                style={{ marginBottom: 12 }}
              >
                {['Cash', 'Card', 'Bank transfer', 'Insurance'].map((m) => <option key={m}>{m}</option>)}
              </select>

              <label className="field-label" htmlFor="pay-ref">Reference no.</label>
              <input
                id="pay-ref"
                className="input"
                value={payForm.referenceNo}
                onChange={(e) => setPayForm((prev) => ({ ...prev, referenceNo: e.target.value }))}
                style={{ marginBottom: 14 }}
              />

              {formError && (
                <div style={{ marginBottom: 12, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: 12.5 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn" onClick={() => setPaymentModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
