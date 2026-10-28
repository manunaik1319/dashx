import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Resource, Category, Collection, ResourceType } from '../types'
import { createResource, updateResource } from '../services/db'

interface ResourceModalProps {
  resource?: Resource | null
  categories: Category[]
  collections: Collection[]
  initialUrl?: string
  onClose: () => void
  onSaved: () => void
}

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'website',  label: 'Website' },
  { value: 'article',  label: 'Article' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'course',   label: 'Course' },
  { value: 'github',   label: 'GitHub Repo' },
  { value: 'design',   label: 'Design Inspiration' },
  { value: 'ai_tool',  label: 'AI Tool' },
  { value: 'ai_chat',  label: 'AI Chat' },
  { value: 'other',    label: 'Other' },
]

export default function ResourceModal({ resource, categories, collections, initialUrl = '', onClose, onSaved }: ResourceModalProps) {
  const isEdit = Boolean(resource)

  const [url, setUrl]           = useState(resource?.url ?? initialUrl)
  const [title, setTitle]       = useState(resource?.title ?? '')
  const [desc, setDesc]         = useState(resource?.description ?? '')
  const [notes, setNotes]       = useState(resource?.notes ?? '')
  const [type, setType]         = useState<ResourceType>(resource?.resource_type ?? 'website')
  const [catId, setCatId]       = useState(resource?.category_id ?? '')
  const [isFav, setIsFav]       = useState(resource?.is_favorite ?? false)
  const [tagInput, setTagInput] = useState(resource?.tags?.map(t => t.name).join(', ') ?? '')
  const [colIds, setColIds]     = useState<string[]>([])
  const [saving, setSaving]     = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function validate() {
    const errs: Record<string, string> = {}
    if (!url.trim()) errs.url = 'URL is required'
    else if (!url.startsWith('http://') && !url.startsWith('https://')) errs.url = 'URL must start with http:// or https://'
    if (!title.trim()) errs.title = 'Title is required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const formData = {
        url: url.trim(),
        title: title.trim(),
        description: desc.trim(),
        notes: notes.trim(),
        resource_type: type,
        category_id: catId,
        is_favorite: isFav,
        tag_names: tagInput.split(',').map(t => t.trim()).filter(Boolean),
        collection_ids: colIds,
      }

      if (isEdit && resource) {
        await updateResource(resource.id, formData)
      } else {
        await createResource(formData)
      }
      onSaved()
      onClose()
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit resource' : 'Add resource'}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600' }}>{isEdit ? 'Edit resource' : 'Add resource'}</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px', lineHeight: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* URL */}
          <div>
            <label htmlFor="modal-url" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>URL *</label>
            <input id="modal-url" type="url" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, borderColor: errors.url ? '#ef4444' : 'var(--border)' }} placeholder="https://..." />
            {errors.url && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '3px' }}>{errors.url}</p>}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="modal-title" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>Title *</label>
            <input id="modal-title" type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, borderColor: errors.title ? '#ef4444' : 'var(--border)' }} placeholder="Resource title" />
            {errors.title && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '3px' }}>{errors.title}</p>}
          </div>

          {/* Type + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="modal-type" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>Type</label>
              <select id="modal-type" value={type} onChange={e => setType(e.target.value as ResourceType)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="modal-cat" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>Category</label>
              <select id="modal-cat" value={catId} onChange={e => setCatId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="modal-desc" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>Description</label>
            <textarea id="modal-desc" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} placeholder="Brief description..." />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="modal-notes" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>Personal notes</label>
            <textarea id="modal-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} placeholder="Private notes..." />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="modal-tags" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>Tags</label>
            <input id="modal-tags" type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} style={inputStyle} placeholder="ui/ux, design, coding (comma separated)" />
          </div>

          {/* Favorite */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={isFav}
              onChange={e => setIsFav(e.target.checked)}
              style={{ accentColor: '#f59e0b', width: '14px', height: '14px' }}
            />
            Mark as favorite
          </label>

          {/* Collections */}
          {collections.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Add to collections</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {collections.map(col => {
                  const selected = colIds.includes(col.id)
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setColIds(selected ? colIds.filter(id => id !== col.id) : [...colIds, col.id])}
                      style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '12px',
                        background: selected ? 'rgba(255,255,255,0.12)' : 'var(--bg-input)',
                        border: `1px solid ${selected ? '#555' : 'var(--border)'}`,
                        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {col.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {errors.submit && (
            <p style={{ fontSize: '12px', color: '#f87171', padding: '8px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {errors.submit}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              id="modal-save-btn"
              type="submit"
              disabled={saving}
              style={{
                flex: 2, padding: '10px',
                background: saving ? '#333' : '#fff', color: '#000',
                borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
