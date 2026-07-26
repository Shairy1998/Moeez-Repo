import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { api } from '../lib/api.js'

function getValue(item, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), item)
}

function toDateInput(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function toDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const STATUS_TONES = {
  PENDING: 'warn', CONFIRMED: 'success', COMPLETED: 'primary', CANCELLED: 'danger', NO_SHOW: 'danger',
  SCHEDULED: 'warn', IN_PROGRESS: 'primary',
  ACTIVE: 'success', STOPPED: 'danger',
  ADMITTED: 'primary', DISCHARGED: 'success',
  DRAFT: 'warn', ISSUED: 'warn', PARTIALLY_PAID: 'warn', PAID: 'success', VOID: 'danger',
}

export function StatusBadge({ value }) {
  const tone = STATUS_TONES[value] || 'primary'
  return (
    <span className="badge" style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}>
      {String(value).replace(/_/g, ' ')}
    </span>
  )
}

export default function ResourcePage({ config }) {
  const { title, endpoint, query = '', columns, fields, searchable, canDelete, filterItems, defaults } = config

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { item: object | null }
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [refs, setRefs] = useState({ patients: [], staff: [] })

  const needsRefs = fields.some((f) => f.optionsSource)

  const load = useCallback(async (searchTerm = '') => {
    setLoading(true)
    setError('')
    try {
      const params = []
      if (query) params.push(query)
      if (searchable && searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`)
      const data = await api(`${endpoint}${params.length ? `?${params.join('&')}` : ''}`)
      let list = data.items || []
      if (filterItems) list = list.filter(filterItems)
      setItems(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint, query, searchable, filterItems])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!needsRefs) return
    Promise.all([
      api('/patients?pageSize=100').catch(() => ({ items: [] })),
      api('/staff').catch(() => ({ items: [] })),
    ]).then(([patients, staff]) => {
      setRefs({ patients: patients.items || [], staff: staff.items || [] })
    })
  }, [needsRefs])

  const openModal = (item = null) => {
    const initial = {}
    for (const field of fields) {
      let value = item ? (field.key ? getValue(item, field.key) : item[field.name]) : (defaults?.[field.name] ?? field.default ?? '')
      if (item) {
        if (field.type === 'date') value = toDateInput(value)
        if (field.type === 'datetime') value = toDateTimeInput(value)
        if (field.type === 'boolean') value = value === true || value === 'true' ? 'true' : 'false'
      } else if (field.type === 'boolean' && (value === true || value === false)) {
        value = value ? 'true' : 'false'
      }
      initial[field.name] = value ?? ''
    }
    setForm(initial)
    setFormError('')
    setModal({ item })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {}
      for (const field of fields) {
        let value = form[field.name]
        if (value === '' || value == null) {
          if (!modal.item) continue
          if (field.required) continue
          payload[field.name] = null
          continue
        }
        if (field.type === 'number') value = Number(value)
        if (field.type === 'boolean') value = value === true || value === 'true'
        payload[field.name] = value
      }
      if (modal.item) {
        await api(`${endpoint}/${modal.item.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await api(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      }
      setModal(null)
      load(search)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    try {
      await api(`${endpoint}/${item.id}`, { method: 'DELETE' })
      load(search)
    } catch (err) {
      setError(err.message)
    }
  }

  const renderField = (field) => {
    const common = {
      id: `field-${field.name}`,
      value: form[field.name] ?? '',
      onChange: (e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value })),
      required: !!field.required,
    }

    if (field.optionsSource) {
      const source = refs[field.optionsSource] || []
      return (
        <select className="select" {...common}>
          <option value="">Select…</option>
          {source
            .filter((entry) => !field.filterOptions || field.filterOptions(entry))
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {field.optionsSource === 'patients'
                  ? `${entry.firstName} ${entry.lastName} (${entry.medicalRecordNo})`
                  : `${entry.firstName} ${entry.lastName} — ${entry.designation}`}
              </option>
            ))}
        </select>
      )
    }

    if (field.type === 'boolean') {
      return (
        <select className="select" {...common}>
          <option value="true">Active / Yes</option>
          <option value="false">Inactive / No</option>
        </select>
      )
    }

    if (field.type === 'select') {
      return (
        <select className="select" {...common}>
          <option value="">Select…</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{String(opt).replace(/_/g, ' ')}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'textarea') {
      return <textarea className="textarea" rows={3} {...common} />
    }

    const typeMap = { date: 'date', datetime: 'datetime-local', number: 'number', email: 'email' }
    return <input className="input" type={typeMap[field.type] || 'text'} step={field.step} {...common} />
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
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>
            {loading ? 'Loading…' : `${items.length} record${items.length === 1 ? '' : 's'}`}
          </div>
        </div>
        {searchable && (
          <form
            onSubmit={(e) => { e.preventDefault(); load(search) }}
            style={{ display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, width: 200 }}
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-icon" aria-label="Search"><Search size={14} /></button>
          </form>
        )}
        <button type="button" className="btn btn-icon" onClick={() => load(search)} aria-label="Refresh">
          <RefreshCw size={14} />
        </button>
        <button type="button" className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={15} />
          Add {config.singular || 'record'}
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
              {columns.map((col) => <th key={col.label}>{col.label}</th>)}
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'var(--sub)', padding: '2rem' }}>
                  No records yet. Click “Add {config.singular || 'record'}” to create the first one.
                </td>
              </tr>
            )}
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3 }}
                >
                  {columns.map((col) => (
                    <td key={col.label}>
                      {col.render ? col.render(item) : String(getValue(item, col.key) ?? '—')}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-icon" onClick={() => openModal(item)} aria-label="Edit" style={{ marginRight: 6 }}>
                      <Pencil size={13} />
                    </button>
                    {canDelete && (
                      <button type="button" className="btn btn-icon btn-danger" onClick={() => remove(item)} aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
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
              onSubmit={submit}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {modal.item ? `Edit ${config.singular || 'record'}` : `New ${config.singular || 'record'}`}
                </div>
                <button type="button" className="btn btn-icon" onClick={() => setModal(null)} aria-label="Close">
                  <X size={15} />
                </button>
              </div>

              <div className="form-grid">
                {fields.map((field) => (
                  <div key={field.name} className={field.wide ? 'full' : ''}>
                    <label className="field-label" htmlFor={`field-${field.name}`}>
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              {formError && (
                <div style={{ marginTop: 14, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: 12.5 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modal.item ? 'Save changes' : 'Create'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
