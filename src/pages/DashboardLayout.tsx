import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation, NavLink } from 'react-router-dom'
import {
  Bell, Plus, Download, Upload, SortAsc, SortDesc,
  X, Archive, Menu, Zap,
  Home, Layers, BookMarked, Heart, LogOut,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import StatsCards from '../components/StatsCards'
import ResourceCard from '../components/ResourceCard'
import ResourceModal from '../components/ResourceModal'
import QuickSavePanel, { PopularCollectionsPanel } from '../components/QuickSavePanel'
import { useAuth } from '../contexts/AuthContext'
import {
  getCategories, getCollections, getDashboardStats,
  getRecentResources, getResources, exportData, importResources,
  createCollection, deleteCollection,
} from '../services/db'
import type { Category, Collection, Resource, DashboardStats, FilterState, SortOption } from '../types'


export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate  = useNavigate()

  // Shared state
  const [categories, setCategories]   = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [stats, setStats]             = useState<DashboardStats>({ saved_resources: 0, collections: 0, ai_chats: 0, favorites: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [showAddModal, setShowAddModal]       = useState(false)
  const [importExportMsg, setImportExportMsg] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)
  const [mobileQuickSaveOpen, setMobileQuickSaveOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen]       = useState(false)

  const loadCategories = useCallback(async () => {
    const cats = await getCategories()
    setCategories(cats)
  }, [])

  const loadCollections = useCallback(async () => {
    const cols = await getCollections()
    setCollections(cols)
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const s = await getDashboardStats()
      setStats(s)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const refreshAll = useCallback(() => {
    loadCategories()
    loadCollections()
    loadStats()
  }, [loadCategories, loadCollections, loadStats])

  useEffect(() => { refreshAll() }, [refreshAll])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleExport() {
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashx-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setImportExportMsg('Export complete!')
      setTimeout(() => setImportExportMsg(null), 3000)
    } catch (e) {
      setImportExportMsg(`Export failed: ${(e as Error).message}`)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importResources(file)
      refreshAll()
      setImportExportMsg(`Imported ${result.imported}, skipped ${result.skipped}${result.errors.length ? `, ${result.errors.length} errors` : ''}`)
    } catch (err) {
      setImportExportMsg(`Import failed: ${(err as Error).message}`)
    }
    e.target.value = ''
    setTimeout(() => setImportExportMsg(null), 5000)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <Sidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        searchQuery={searchQuery}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onCategorySelect={id => {
          setActiveCategoryId(id)
          navigate('/dashboard/resources')
        }}
        onSearchChange={q => {
          setSearchQuery(q)
          if (q) navigate('/dashboard/resources')
        }}
        onCategoriesRefresh={loadCategories}
      />

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header style={{
          height: 'var(--topbar-height)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '8px',
          padding: '0 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-base)', flexShrink: 0,
          position: 'relative',
        }}>
          {/* Left: hamburger (mobile) + import/export message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{
                color: 'var(--text-primary)', padding: '6px',
                borderRadius: 'var(--radius-md)', lineHeight: 0,
              }}
            >
              <Menu size={20} />
            </button>

            {/* Desktop: Dashx logo text */}
            <span className="desktop-logo" style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.2px' }}>
              Dashboard
            </span>

            {/* Mobile center: Dashx brand */}
            <div className="mobile-topbar-brand" style={{
              display: 'none', alignItems: 'center', gap: '6px',
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            }}>
              <div style={{
                width: '22px', height: '22px', background: '#fff', borderRadius: '5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={13} color="#000" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.2px' }}>Dashx</span>
            </div>

            {importExportMsg && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {importExportMsg}
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Quick Save — tablet only */}
            <button
              className="mobile-quick-save-toggle"
              onClick={() => setMobileQuickSaveOpen(true)}
              aria-label="Quick Save"
              style={{
                display: 'none', alignItems: 'center', gap: '4px',
                padding: '6px 10px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-primary)',
              }}
            >
              <Zap size={13} color="var(--accent-green)" />
              <span className="hide-on-compact">Quick Save</span>
            </button>

            {/* Export — hidden on mobile */}
            <button
              id="export-btn"
              onClick={handleExport}
              title="Export data"
              aria-label="Export all dashboard data to JSON"
              className="hide-on-mobile"
              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-md)', lineHeight: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-active)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Download size={16} />
            </button>

            {/* Import — hidden on mobile */}
            <label
              title="Import data"
              aria-label="Import resources from JSON file"
              className="hide-on-mobile"
              style={{ cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-md)', lineHeight: 0, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Upload size={16} />
              <input id="import-input" type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>

            {/* Add resource — hidden on mobile (use bottom nav + instead) */}
            <button
              id="add-resource-header-btn"
              onClick={() => setShowAddModal(true)}
              title="Add resource"
              aria-label="Add new resource"
              className="hide-on-mobile"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                background: '#fff', color: '#000',
                borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
              }}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>

            {/* Notifications */}
            <button
              id="notifications-btn"
              title="Notifications"
              aria-label="Notifications"
              className="hide-on-mobile"
              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-md)', lineHeight: 0 }}
            >
              <Bell size={16} />
            </button>

            {/* Avatar & Dropdown Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title={`Signed in as ${user?.email ?? 'User'}`}
                aria-label={`User avatar for ${user?.email ?? 'User'}`}
                style={{
                  width: '32px', height: '32px',
                  background: '#2a2a2a', border: '1px solid var(--border)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </button>

              {userMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 991 }}
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div style={{
                    position: 'absolute', right: 0, top: '40px',
                    width: '210px', background: 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    padding: '8px', zIndex: 992,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  }}>
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Signed in as</p>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email ?? 'User'}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px', borderRadius: '4px', fontSize: '12px',
                        color: '#ef4444', background: 'transparent', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content + Right Panel */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Main Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: '24px 24px 24px 24px' }}>
            <Routes>
              <Route index element={
                <OverviewPage
                  stats={stats}
                  statsLoading={statsLoading}
                  onEdit={setEditingResource}
                  onRefresh={refreshAll}
                />
              } />
              <Route path="resources" element={
                <ResourcesPage
                  categories={categories}
                  searchQuery={searchQuery}
                  activeCategoryId={activeCategoryId}
                  onEdit={setEditingResource}
                  onRefresh={refreshAll}
                />
              } />
              <Route path="collections" element={
                <CollectionsPage collections={collections} onRefresh={loadCollections} />
              } />
              <Route path="ai-chats" element={
                <AiChatsPage
                  onEdit={setEditingResource}
                  onRefresh={refreshAll}
                />
              } />
              <Route path="favorites" element={
                <FavoritesPage
                  onEdit={setEditingResource}
                  onRefresh={refreshAll}
                />
              } />
              <Route path="recent" element={
                <RecentPage
                  onEdit={setEditingResource}
                  onRefresh={refreshAll}
                />
              } />
            </Routes>
          </main>

          {/* Right Panel */}
          <aside className="dashboard-right-panel" style={{
            width: 'var(--right-panel-width)', minWidth: 'var(--right-panel-width)',
            borderLeft: '1px solid var(--border)', padding: '20px 16px',
            overflowY: 'auto', background: 'var(--bg-base)', flexShrink: 0,
          }}>
            <QuickSavePanel
              categories={categories}
              onSaved={refreshAll}
            />
            <PopularCollectionsPanel
              collections={collections}
              onViewCollection={(_id) => navigate('/dashboard/collections')}
            />
          </aside>
        </div>
      </div>

      {/* Mobile Quick Save Bottom Sheet / Drawer */}
      {mobileQuickSaveOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Save Panel"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setMobileQuickSaveOpen(false) }}
        >
          <div style={{
            width: '100%', maxWidth: '480px', maxHeight: '85vh',
            background: 'var(--bg-card)',
            borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)', borderBottom: 'none',
            padding: '20px', overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: '600' }}>Quick Save</span>
              <button
                onClick={() => setMobileQuickSaveOpen(false)}
                aria-label="Close"
                style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
            <QuickSavePanel
              categories={categories}
              onSaved={() => {
                refreshAll()
                setMobileQuickSaveOpen(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <ResourceModal
          categories={categories}
          collections={collections}
          onClose={() => setShowAddModal(false)}
          onSaved={refreshAll}
        />
      )}
      {editingResource && (
        <ResourceModal
          resource={editingResource}
          categories={categories}
          collections={collections}
          onClose={() => setEditingResource(null)}
          onSaved={refreshAll}
        />
      )}

      {/* Mobile Bottom Nav */}
      <MobileBottomNav onAddClick={() => setShowAddModal(true)} />
    </div>
  )
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileBottomNav({ onAddClick }: { onAddClick: () => void }) {
  const location = useLocation()

  const navItems = [
    { to: '/dashboard',             label: 'Home',       icon: Home,          id: 'overview',     exact: true },
    { to: '/dashboard/resources',   label: 'Resources',  icon: Layers,        id: 'resources',    exact: false },
    { to: null,                     label: 'Add',        icon: Plus,          id: 'add',          exact: false },
    { to: '/dashboard/favorites',   label: 'Favorites',  icon: Heart,         id: 'favorites',    exact: false },
    { to: '/dashboard/collections', label: 'Collections',icon: BookMarked,    id: 'collections',  exact: false },
  ]

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
      style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '64px',
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border)',
        zIndex: 990,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map(item => {
        const Icon = item.icon
        if (item.id === 'add') {
          return (
            <button
              key="add"
              onClick={onAddClick}
              aria-label="Add resource"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', flex: 1, height: '100%', border: 'none', background: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              <span style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}>
                <Icon size={20} color="#000" strokeWidth={2.5} />
              </span>
            </button>
          )
        }

        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to!)

        return (
          <NavLink
            key={item.id}
            to={item.to!}
            end={item.exact}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '3px', flex: 1, height: '100%',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              textDecoration: 'none', fontSize: '10px', fontWeight: isActive ? '600' : '400',
              transition: 'color 0.12s',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

// ─── Overview Page ────────────────────────────────────────────────────────────
function OverviewPage({
  stats, statsLoading, onEdit, onRefresh,
}: {
  stats: DashboardStats; statsLoading: boolean
  onEdit: (r: Resource) => void; onRefresh: () => void
}) {
  const [recent, setRecent]   = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getRecentResources(6).then(r => { setRecent(r); setLoading(false) })
  }, [stats])

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', letterSpacing: '-0.3px' }}>Dashboard</h1>

      {/* Tab nav */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Recently saved */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Recently saved</h2>
        <NavLink to="/dashboard/resources" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          View all →
        </NavLink>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ width: '60%', height: '14px' }} />
                <div className="skeleton" style={{ width: '40%', height: '12px' }} />
                <div className="skeleton" style={{ width: '80%', height: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState message="No resources saved yet. Use Quick Save on the right to add your first resource." />
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {recent.map(r => (
            <ResourceCard key={r.id} resource={r} onUpdate={onRefresh} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Resources Page ───────────────────────────────────────────────────────────
function ResourcesPage({
  searchQuery, activeCategoryId, categories, onEdit, onRefresh,
}: {
  categories: Category[]; searchQuery: string
  activeCategoryId: string | null; onEdit: (r: Resource) => void; onRefresh: () => void
}) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState<Partial<FilterState>>({
    is_archived: false,
    sort: 'created_at',
    direction: 'desc',
  })
  const [showArchived, setShowArchived] = useState(false)

  const effectiveFilters: Partial<FilterState> = {
    ...filters,
    search: searchQuery || filters.search,
    category_id: activeCategoryId ?? filters.category_id,
    is_archived: showArchived ? true : false,
  }

  useEffect(() => {
    setLoading(true)
    getResources(effectiveFilters).then(r => { setResources(r); setLoading(false) })
  }, [searchQuery, activeCategoryId, showArchived, filters])

  function toggleSort(field: SortOption) {
    setFilters(f => ({
      ...f,
      sort: field,
      direction: f.sort === field && f.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>
          {showArchived ? 'Archived' : activeCategoryId ? categories.find(c => c.id === activeCategoryId)?.name ?? 'Resources' : 'All Resources'}
          {searchQuery && <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: '400' }}>"{searchQuery}"</span>}
        </h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: '12px',
              background: showArchived ? 'var(--bg-active)' : 'var(--bg-card)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
            }}
          >
            <Archive size={13} />
            {showArchived ? 'Active' : 'Archived'}
          </button>
          <button
            onClick={() => toggleSort('created_at')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: '12px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
            }}
          >
            {filters.direction === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
            {filters.sort === 'created_at' ? 'Date' : filters.sort === 'title' ? 'Name' : 'Updated'}
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { label: 'All', value: null },
          { label: 'Websites', value: 'website' },
          { label: 'Articles', value: 'article' },
          { label: 'Tutorials', value: 'tutorial' },
          { label: 'Courses', value: 'course' },
          { label: 'GitHub', value: 'github' },
          { label: 'Design', value: 'design' },
          { label: 'AI Tools', value: 'ai_tool' },
        ].map(f => {
          const active = (filters.resource_type ?? null) === f.value
          return (
            <button
              key={String(f.value)}
              onClick={() => setFilters(prev => ({ ...prev, resource_type: f.value as FilterState['resource_type'] }))}
              style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                background: active ? 'var(--bg-active)' : 'transparent',
                border: `1px solid ${active ? '#444' : 'var(--border)'}`,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <ResourceListSkeleton />
      ) : resources.length === 0 ? (
        <EmptyState message={showArchived ? 'No archived resources.' : 'No resources found. Use Quick Save to add your first one!'} />
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {resources.map(r => (
            <ResourceCard key={r.id} resource={r} onUpdate={() => {
              onRefresh()
              getResources(effectiveFilters).then(setResources)
            }} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Collections Page ─────────────────────────────────────────────────────────
function CollectionsPage({ collections, onRefresh }: { collections: Collection[]; onRefresh: () => void }) {
  const [newName, setNewName]   = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [adding, setAdding]     = useState(false)
  const [saving, setSaving]     = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createCollection(newName.trim(), newDesc.trim())
      setNewName(''); setNewDesc(''); setAdding(false)
      onRefresh()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await deleteCollection(id)
    onRefresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Collections</h1>
        <button
          id="add-collection-btn"
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: '#fff', color: '#000',
            borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
          }}
        >
          <Plus size={14} /> New collection
        </button>
      </div>

      {adding && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>New Collection</h3>
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Collection name"
            autoFocus
            style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none', marginBottom: '8px' }}
          />
          <input
            type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '13px', outline: 'none', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving || !newName.trim()} style={{ padding: '8px 16px', background: '#fff', color: '#000', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600' }}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <EmptyState message="No collections yet. Create one to organise your resources." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {collections.map(col => (
            <div
              key={col.id}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: '700',
              }}>
                {col.name[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{col.name}</div>
                {col.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{col.description}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{col.resource_count ?? 0} resources</span>
                <button onClick={() => handleDelete(col.id)} title="Delete collection" style={{ color: 'var(--text-muted)', padding: '3px', borderRadius: '4px', lineHeight: 0 }}>
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AI Chats Page ────────────────────────────────────────────────────────────
function AiChatsPage({ onEdit, onRefresh }: { onEdit: (r: Resource) => void; onRefresh: () => void }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getResources({ resource_type: 'ai_chat', is_archived: false }).then(r => { setResources(r); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', letterSpacing: '-0.3px' }}>AI Chats</h1>
      {loading ? <ResourceListSkeleton /> : resources.length === 0 ? (
        <EmptyState message="No AI chat links saved yet. Save links to ChatGPT, Claude, Gemini and other AI conversations." />
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {resources.map(r => <ResourceCard key={r.id} resource={r} onUpdate={onRefresh} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  )
}

// ─── Favorites Page ───────────────────────────────────────────────────────────
function FavoritesPage({ onEdit, onRefresh }: { onEdit: (r: Resource) => void; onRefresh: () => void }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getResources({ is_favorite: true, is_archived: false }).then(r => { setResources(r); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', letterSpacing: '-0.3px' }}>Favorites</h1>
      {loading ? <ResourceListSkeleton /> : resources.length === 0 ? (
        <EmptyState message="No favorites yet. Star any resource to add it here." />
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {resources.map(r => <ResourceCard key={r.id} resource={r} onUpdate={() => { onRefresh(); getResources({ is_favorite: true }).then(setResources) }} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  )
}

// ─── Recent Page ──────────────────────────────────────────────────────────────
function RecentPage({ onEdit, onRefresh }: { onEdit: (r: Resource) => void; onRefresh: () => void }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getRecentResources(30).then(r => { setResources(r); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', letterSpacing: '-0.3px' }}>Recently Saved</h1>
      {loading ? <ResourceListSkeleton /> : resources.length === 0 ? (
        <EmptyState message="No resources saved yet." />
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {resources.map(r => <ResourceCard key={r.id} resource={r} onUpdate={onRefresh} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '48px 24px', textAlign: 'center',
      color: 'var(--text-muted)', fontSize: '14px',
    }}>
      {message}
    </div>
  )
}

function ResourceListSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton" style={{ width: '55%', height: '14px' }} />
            <div className="skeleton" style={{ width: '35%', height: '12px' }} />
            <div className="skeleton" style={{ width: '75%', height: '12px' }} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <div className="skeleton" style={{ width: '48px', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '60px', height: '18px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
