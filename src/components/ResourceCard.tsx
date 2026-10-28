import { useState } from 'react'
import { ExternalLink, Star, MoreHorizontal, Archive, Trash2, Edit2, ArchiveRestore, Clock, Copy, Check } from 'lucide-react'
import type { Resource } from '../types'
import { toggleFavorite, archiveResource, deleteResource, markOpened } from '../services/db'
import { formatRelativeTime } from '../utils/time'
import { getTagClass } from '../utils/tags'

interface ResourceCardProps {
  resource: Resource
  onUpdate: () => void
  onEdit: (resource: Resource) => void
}

export default function ResourceCard({ resource, onUpdate, onEdit }: ResourceCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [favoriting, setFavoriting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setFavoriting(true)
    try {
      await toggleFavorite(resource.id, resource.is_favorite)
      onUpdate()
    } finally {
      setFavoriting(false)
    }
  }

  async function handleOpen() {
    await markOpened(resource.id)
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(resource.url)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowMenu(false)
      }, 1200)
    } catch {
      setShowMenu(false)
    }
  }

  async function handleArchive() {
    await archiveResource(resource.id, !resource.is_archived)
    onUpdate()
    setShowMenu(false)
  }

  async function handleDelete() {
    await deleteResource(resource.id)
    onUpdate()
    setConfirmDelete(false)
    setShowMenu(false)
  }

  const favicon = resource.favicon_url ?? `https://www.google.com/s2/favicons?domain=${resource.domain}&sz=32`

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-light)',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Favicon */}
      <button
        onClick={handleOpen}
        aria-label={`Open ${resource.title}`}
        style={{
          width: '38px', height: '38px', flexShrink: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer',
        }}
      >
        <img
          src={favicon}
          alt=""
          width={20}
          height={20}
          onError={e => { e.currentTarget.style.display = 'none' }}
          style={{ objectFit: 'contain' }}
        />
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
          <button
            onClick={handleOpen}
            style={{
              fontSize: '13.5px', fontWeight: '500', textAlign: 'left',
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)', cursor: 'pointer',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          >
            {resource.title}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              fontSize: '11px', color: 'var(--text-muted)',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              <Clock size={11} strokeWidth={2} style={{ opacity: 0.65 }} />
              {formatRelativeTime(resource.created_at)}
            </span>

            {/* Menu */}
            <div style={{ position: 'relative' }}>
              <button
                id={`resource-menu-${resource.id}`}
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Resource options"
                style={{ color: 'var(--text-muted)', padding: '3px', borderRadius: '4px', lineHeight: 0 }}
              >
                <MoreHorizontal size={15} />
              </button>
              {showMenu && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', zIndex: 100, minWidth: '154px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    padding: '4px 0',
                  }}
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={handleOpen}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', fontSize: '12.5px', textAlign: 'left',
                      color: 'var(--text-secondary)',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    <ExternalLink size={13} /> Open URL
                  </button>

                  <button
                    onClick={handleCopyUrl}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', fontSize: '12.5px', textAlign: 'left',
                      color: copied ? 'var(--accent-green)' : 'var(--text-secondary)',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; if (!copied) e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; if (!copied) e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>

                  <button
                    onClick={() => { onEdit(resource); setShowMenu(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', fontSize: '12.5px', textAlign: 'left',
                      color: 'var(--text-secondary)',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>

                  <button
                    onClick={handleArchive}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', fontSize: '12.5px', textAlign: 'left',
                      color: 'var(--text-secondary)',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    {resource.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                    {resource.is_archived ? 'Restore' : 'Archive'}
                  </button>

                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />

                  <button
                    onClick={() => { setConfirmDelete(true); setShowMenu(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', fontSize: '12.5px', textAlign: 'left',
                      color: '#f87171',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
          <img
            src={favicon}
            alt=""
            width={12}
            height={12}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <span style={{
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            letterSpacing: '-0.01em',
          }}>
            {resource.domain ?? resource.url}
          </span>
        </div>

        {/* Description */}
        {resource.description && (
          <p style={{
            fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: '1.45',
          }}>
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {resource.tags.map(tag => (
              <span key={tag.id} className={`tag ${getTagClass(tag.name)}`}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Favorite */}
      <button
        id={`favorite-${resource.id}`}
        onClick={handleFavorite}
        aria-label={resource.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        disabled={favoriting}
        style={{
          flexShrink: 0, padding: '4px', borderRadius: '4px',
          color: resource.is_favorite ? '#f59e0b' : 'var(--text-muted)',
          lineHeight: 0,
          transition: 'color 0.15s, transform 0.1s',
          transform: favoriting ? 'scale(0.85)' : 'scale(1)',
        }}
      >
        <Star
          size={15}
          fill={resource.is_favorite ? '#f59e0b' : 'none'}
        />
      </button>

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          zIndex: 50, borderRadius: 0,
          backdropFilter: 'blur(2px)',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>Delete this resource?</span>
          <button
            onClick={handleDelete}
            style={{ padding: '5px 12px', background: '#ef4444', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '500' }}
          >
            Delete
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ padding: '5px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
