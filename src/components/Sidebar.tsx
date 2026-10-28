import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Zap, Search, Home, Layers, BookMarked, MessageSquare,
  Heart, Clock, Plus, MoreHorizontal, LogOut, BarChart2,
  PenTool, Layout, Code2, Bot, BookOpen, Lightbulb,
  FolderKanban, ChevronLeft, ChevronRight, X, Check, Trash2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { Category } from '../types'
import { createCategory, deleteCategory } from '../services/db'

const CATEGORY_ICONS: Record<string, ReactNode> = {
  'pen-tool':      <PenTool size={13} />,
  'layout':        <Layout size={13} />,
  'code-2':        <Code2 size={13} />,
  'bot':           <Bot size={13} />,
  'book-open':     <BookOpen size={13} />,
  'lightbulb':     <Lightbulb size={13} />,
  'folder-kanban': <FolderKanban size={13} />,
  'more-horizontal': <MoreHorizontal size={13} />,
}

interface SidebarProps {
  categories: Category[]
  activeCategoryId: string | null
  searchQuery: string
  onCategorySelect: (id: string | null) => void
  onSearchChange: (q: string) => void
  onCategoriesRefresh: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function Sidebar({
  categories,
  activeCategoryId,
  searchQuery,
  onCategorySelect,
  onSearchChange,
  onCategoriesRefresh,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6b7280')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      await createCategory(newCatName.trim(), newCatColor, 'more-horizontal')
      onCategoriesRefresh()
      setNewCatName('')
      setAddingCategory(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory(id)
      onCategoriesRefresh()
      if (activeCategoryId === id) onCategorySelect(null)
    } catch {}
    setDeleteConfirm(null)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const w = collapsed ? '60px' : 'var(--sidebar-width)'

  return (
    <>
      {mobileOpen && (
        <div
          className="dashboard-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: w,
          minWidth: w,
          height: '100vh',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border)',
          height: '56px',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px', height: '26px',
                background: '#fff', borderRadius: '5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={14} color="#000" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.2px' }}>Dashx</span>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: '26px', height: '26px',
              background: '#fff', borderRadius: '5px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="#000" strokeWidth={2.5} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!collapsed && (
              <button
                id="sidebar-collapse-btn"
                className="sidebar-collapse-desktop-btn"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }}
              >
                <ChevronLeft size={15} />
              </button>
            )}
            {onCloseMobile && (
              <button
                className="sidebar-close-mobile-btn"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          id="sidebar-expand-btn"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          style={{
            position: 'absolute', right: '-12px', top: '68px',
            width: '22px', height: '22px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10,
          }}
        >
          <ChevronRight size={12} />
        </button>
      )}

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Search */}
        {!collapsed && (
          <div style={{ padding: '12px 12px 8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '7px 10px',
            }}>
              <Search size={13} color="var(--text-muted)" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search..."
                aria-label="Search resources"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: '13px', color: 'var(--text-primary)',
                }}
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} style={{ color: 'var(--text-muted)', lineHeight: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav style={{ padding: collapsed ? '8px 0' : '4px 8px' }}>
          {[
            { to: '/dashboard',           label: 'Overview',       icon: <Home size={15} />,           id: 'overview' },
            { to: '/dashboard/resources', label: 'All Resources',  icon: <Layers size={15} />,         id: 'resources' },
            { to: '/dashboard/collections', label: 'Collections',  icon: <BookMarked size={15} />,     id: 'collections' },
            { to: '/dashboard/ai-chats',  label: 'AI Chats',       icon: <MessageSquare size={15} />,  id: 'ai-chats' },
            { to: '/dashboard/favorites', label: 'Favorites',      icon: <Heart size={15} />,          id: 'favorites' },
            { to: '/dashboard/recent',    label: 'Recently Saved', icon: <Clock size={15} />,          id: 'recent' },
          ].map(item => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === '/dashboard'}
              id={`nav-${item.id}`}
              aria-label={item.label}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px' : '8px 10px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                fontWeight: isActive ? '500' : '400',
                fontSize: '13px',
                transition: 'background 0.12s, color 0.12s',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              })}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Categories */}
        {!collapsed && (
          <div style={{ padding: '12px 8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Categories
              </span>
              <button
                id="add-category-btn"
                onClick={() => setAddingCategory(true)}
                aria-label="Add category"
                style={{ color: 'var(--text-muted)', padding: '2px', borderRadius: '4px', lineHeight: 0 }}
              >
                <Plus size={13} />
              </button>
            </div>

            {categories.map(cat => (
              <div
                key={cat.id}
                style={{ position: 'relative' }}
                onMouseEnter={e => {
                  const btn = e.currentTarget.querySelector<HTMLButtonElement>('.cat-delete-btn')
                  if (btn) btn.style.opacity = '1'
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget.querySelector<HTMLButtonElement>('.cat-delete-btn')
                  if (btn) btn.style.opacity = '0'
                }}
              >
                <button
                  id={`cat-${cat.id}`}
                  onClick={() => onCategorySelect(activeCategoryId === cat.id ? null : cat.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: activeCategoryId === cat.id ? 'var(--bg-active)' : 'transparent',
                    color: activeCategoryId === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '13px', fontWeight: '400',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'background 0.12s, color 0.12s',
                  }}
                >
                  <span style={{
                    width: '18px', height: '18px',
                    background: `${cat.color}22`,
                    borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cat.color, flexShrink: 0,
                  }}>
                    {CATEGORY_ICONS[cat.icon] ?? <MoreHorizontal size={11} />}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                  <BarChart2 size={12} color="var(--text-muted)" />
                </button>
                {deleteConfirm === cat.id ? (
                  <div style={{ display: 'flex', gap: '4px', padding: '2px 10px 4px' }}>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ fontSize: '11px', color: '#ef4444', padding: '2px 6px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}
                    >
                      Delete
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cancel</button>
                  </div>
                ) : (
                  <button
                    className="cat-delete-btn"
                    onClick={() => setDeleteConfirm(cat.id)}
                    aria-label={`Delete ${cat.name}`}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      opacity: 0, transition: 'opacity 0.12s',
                      color: 'var(--text-muted)', padding: '2px', borderRadius: '3px', lineHeight: 0,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}

            {/* Add category form */}
            {addingCategory && (
              <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', margin: '4px 0' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    style={{ width: '28px', height: '28px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none' }}
                  />
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category name"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setAddingCategory(false) }}
                    style={{
                      flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: '4px', padding: '4px 8px', fontSize: '12px', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleAddCategory}
                    disabled={saving || !newCatName.trim()}
                    style={{ flex: 1, padding: '5px', background: '#fff', color: '#000', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setAddingCategory(false)}
                    style={{ padding: '5px 8px', background: 'var(--bg-input)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User / Sign Out */}
      <div style={{ padding: collapsed ? '12px 0' : '12px', borderTop: '1px solid var(--border)' }}>
        <button
          id="signout-btn"
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '8px' : '8px 10px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)', fontSize: '13px',
            transition: 'color 0.12s, background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-active)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={14} />
          {!collapsed && 'Sign out'}
        </button>
        {!collapsed && user?.email && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 10px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </p>
        )}
      </div>
    </aside>
  </>
)
}
