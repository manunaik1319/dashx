import { useState } from 'react'
import { Link2, Tag, FileText, Loader2, CheckCircle, AlertCircle, ChevronRight, Folder } from 'lucide-react'
import type { Category, Collection, ResourceType } from '../types'
import { createResource, checkDuplicateUrl, isValidUrl, extractDomain } from '../services/db'

interface QuickSavePanelProps {
  categories: Category[]
  onSaved: () => void
}

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'website',  label: 'Website' },
  { value: 'article',  label: 'Article' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'course',   label: 'Course' },
  { value: 'github',   label: 'GitHub' },
  { value: 'design',   label: 'Design' },
  { value: 'ai_tool',  label: 'AI Tool' },
  { value: 'ai_chat',  label: 'AI Chat' },
  { value: 'other',    label: 'Other' },
]

export default function QuickSavePanel({ categories, onSaved }: QuickSavePanelProps) {
  const [url, setUrl]               = useState('')
  const [title, setTitle]           = useState('')
  const [note, setNote]             = useState('')
  const [tags, setTags]             = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [resourceType, setResourceType] = useState<ResourceType>('website')
  const [showNote, setShowNote]     = useState(false)
  const [showTags, setShowTags]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [status, setStatus]         = useState<'idle' | 'success' | 'error' | 'dup'>('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [dupResource, setDupResource] = useState<string | null>(null)

  function reset() {
    setUrl(''); setTitle(''); setNote(''); setTags(''); setCategoryId('')
    setResourceType('website'); setShowNote(false); setShowTags(false)
    setStatus('idle'); setErrorMsg(''); setDupResource(null)
  }

  async function handleSave() {
    if (!url.trim()) return
    const cleanUrl = url.trim()

    if (!isValidUrl(cleanUrl)) {
      setStatus('error'); setErrorMsg('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    setSaving(true); setStatus('idle')
    try {
      const dup = await checkDuplicateUrl(cleanUrl)
      if (dup) {
        setDupResource(dup.title)
        setStatus('dup')
        setSaving(false)
        return
      }

      const domain = extractDomain(cleanUrl)
      const resourceTitle = title.trim() || domain

      await createResource({
        url: cleanUrl,
        title: resourceTitle,
        description: '',
        notes: note,
        resource_type: resourceType,
        category_id: categoryId,
        is_favorite: false,
        tag_names: tags.split(',').map(t => t.trim()).filter(Boolean),
        collection_ids: [],
      })

      setStatus('success')
      onSaved()
      setTimeout(reset, 2000)
    } catch (err) {
      setStatus('error')
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '16px', marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Link2 size={14} color="var(--text-secondary)" />
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Quick save</span>
      </div>

      {/* URL input */}
      <input
        id="quick-save-url"
        type="url"
        value={url}
        onChange={e => { setUrl(e.target.value); setStatus('idle') }}
        placeholder="Paste any link here..."
        aria-label="Resource URL"
        style={{
          width: '100%', padding: '9px 12px',
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none',
          marginBottom: '8px',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--border-focus)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
      />

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title (optional — uses domain if blank)"
        aria-label="Resource title"
        style={{
          width: '100%', padding: '9px 12px',
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none',
          marginBottom: '8px',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--border-focus)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />

      {/* Type + Category row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <select
          value={resourceType}
          onChange={e => setResourceType(e.target.value as ResourceType)}
          aria-label="Resource type"
          style={{
            flex: 1, padding: '7px 8px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: '12px',
            color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
          }}
        >
          {RESOURCE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          aria-label="Category"
          style={{
            flex: 1, padding: '7px 8px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: '12px',
            color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">No category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Note */}
      {showNote && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
          aria-label="Personal note"
          rows={3}
          style={{
            width: '100%', padding: '9px 12px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none',
            resize: 'vertical', marginBottom: '8px', lineHeight: '1.5',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--border-focus)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      )}

      {/* Tags */}
      {showTags && (
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          aria-label="Tags"
          style={{
            width: '100%', padding: '9px 12px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none',
            marginBottom: '8px',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--border-focus)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      )}

      {/* Status messages */}
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '8px', color: '#f87171', fontSize: '12px' }}>
          <AlertCircle size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
          {errorMsg}
        </div>
      )}
      {status === 'dup' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '8px', color: '#fbbf24', fontSize: '12px' }}>
          <AlertCircle size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
          Already saved as "{dupResource}". {' '}
          <button onClick={() => setStatus('idle')} style={{ color: '#fbbf24', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit', fontSize: '12px' }}>Save anyway</button>
        </div>
      )}
      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '8px', color: '#4ade80', fontSize: '12px' }}>
          <CheckCircle size={13} />
          Resource saved!
        </div>
      )}

      {/* Save button */}
      <button
        id="save-resource-btn"
        onClick={handleSave}
        disabled={saving || !url.trim()}
        style={{
          width: '100%', padding: '10px',
          background: saving || !url.trim() ? '#333' : '#fff',
          color: '#000',
          borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600',
          cursor: saving || !url.trim() ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          marginBottom: '10px',
          transition: 'background 0.15s',
        }}
      >
        {saving && <Loader2 size={13} className="animate-spin" />}
        {saving ? 'Saving…' : 'Save resource'}
      </button>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          id="add-note-btn"
          onClick={() => setShowNote(!showNote)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '7px', background: showNote ? 'var(--bg-active)' : 'var(--bg-input)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            fontSize: '12px', color: 'var(--text-secondary)',
          }}
        >
          <FileText size={12} />
          Add note
        </button>
        <button
          id="add-tags-btn"
          onClick={() => setShowTags(!showTags)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '7px', background: showTags ? 'var(--bg-active)' : 'var(--bg-input)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            fontSize: '12px', color: 'var(--text-secondary)',
          }}
        >
          <Tag size={12} />
          Add tags
        </button>
      </div>
    </div>
  )
}

// ─── Popular Collections Panel ────────────────────────────────────────────────
interface PopularCollectionsPanelProps {
  collections: Collection[]
  onViewCollection: (id: string) => void
}

export function PopularCollectionsPanel({ collections, onViewCollection }: PopularCollectionsPanelProps) {
  const sorted = [...collections].sort((a, b) => (b.resource_count ?? 0) - (a.resource_count ?? 0)).slice(0, 4)

  if (sorted.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Popular collections</span>
        <button style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          View all <ChevronRight size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sorted.map(col => (
          <button
            key={col.id}
            id={`collection-${col.id}`}
            onClick={() => onViewCollection(col.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px', borderRadius: 'var(--radius-md)',
              transition: 'background 0.12s',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-active)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {col.thumbnail_url ? (
              <img src={col.thumbnail_url} alt="" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)', border: '1px solid var(--border-light)',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}>
                <Folder size={16} strokeWidth={1.75} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{col.resource_count ?? 0} resources</div>
            </div>
            <ChevronRight size={13} color="var(--text-muted)" />
          </button>
        ))}
      </div>
    </div>
  )
}
