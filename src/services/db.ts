import { supabase } from '../lib/supabase'
import type { Category, Collection, Resource, ResourceFormData, Tag, FilterState, DashboardStats, ExportData } from '../types'

export function isDemoMode(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('dashx_demo_mode') === 'true'
}

export function setDemoMode(val: boolean): void {
  if (typeof window !== 'undefined') {
    if (val) localStorage.setItem('dashx_demo_mode', 'true')
    else localStorage.removeItem('dashx_demo_mode')
  }
}

// ─── Helper: extract domain from URL ────────────────────────────────────────
export function extractDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ─── Helper: favicon URL ─────────────────────────────────────────────────────
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

// ─── Helper: validate URL ────────────────────────────────────────────────────
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createCategory(name: string, color: string, icon: string): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name, color, icon })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const { data } = await supabase.from('categories').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return

  const defaults = [
    { name: 'Graphics Design', color: '#ec4899', icon: 'pen-tool' },
    { name: 'UI/UX',           color: '#f97316', icon: 'layout' },
    { name: 'Coding',          color: '#22c55e', icon: 'code-2' },
    { name: 'AI Tools',        color: '#a855f7', icon: 'bot' },
    { name: 'Learning',        color: '#eab308', icon: 'book-open' },
    { name: 'Inspiration',     color: '#06b6d4', icon: 'lightbulb' },
    { name: 'Projects',        color: '#ef4444', icon: 'folder-kanban' },
    { name: 'Other',           color: '#6b7280', icon: 'more-horizontal' },
  ]
  await supabase.from('categories').insert(defaults.map(d => ({ ...d, user_id: userId })))
}

// ─── Collections ─────────────────────────────────────────────────────────────
export async function getCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      resource_count:collection_resources(count)
    `)
    .order('name')
  if (error) throw error

  return (data ?? []).map(c => ({
    ...c,
    resource_count: (c.resource_count as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export async function createCollection(name: string, description?: string): Promise<Collection> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: user.id, name, description: description ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCollection(id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'thumbnail_url'>>): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id)
  if (error) throw error
}

// ─── Tags ────────────────────────────────────────────────────────────────────
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function ensureTag(userId: string, name: string): Promise<Tag> {
  const normalized = name.trim().toLowerCase()
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('name', normalized)
    .single()

  if (existing) return existing

  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: userId, name: normalized })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Resources ───────────────────────────────────────────────────────────────
export async function getResources(filters: Partial<FilterState> = {}): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select(`
      *,
      category:categories(*),
      tags:resource_tags(tag:tags(*))
    `)

  if (filters.is_archived !== undefined && filters.is_archived !== null) {
    query = query.eq('is_archived', filters.is_archived)
  } else {
    query = query.eq('is_archived', false)
  }

  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.resource_type) query = query.eq('resource_type', filters.resource_type)
  if (filters.is_favorite === true) query = query.eq('is_favorite', true)

  if (filters.search) {
    const s = `%${filters.search}%`
    query = query.or(
      `title.ilike.${s},url.ilike.${s},description.ilike.${s},notes.ilike.${s},domain.ilike.${s}`
    )
  }

  const sort = filters.sort ?? 'created_at'
  const asc  = filters.direction === 'asc'
  query = query.order(sort, { ascending: asc })

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(r => ({
    ...r,
    tags: r.tags?.map((rt: { tag: Tag }) => rt.tag).filter(Boolean) ?? [],
  }))
}

export async function getRecentResources(limit = 10): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      category:categories(*),
      tags:resource_tags(tag:tags(*))
    `)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map(r => ({
    ...r,
    tags: r.tags?.map((rt: { tag: Tag }) => rt.tag).filter(Boolean) ?? [],
  }))
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      category:categories(*),
      tags:resource_tags(tag:tags(*))
    `)
    .eq('id', id)
    .single()
  if (error) return null

  return {
    ...data,
    tags: data.tags?.map((rt: { tag: Tag }) => rt.tag).filter(Boolean) ?? [],
  }
}

export async function checkDuplicateUrl(url: string): Promise<Resource | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', user.id)
    .eq('url', url)
    .single()
  return data ?? null
}

export async function createResource(form: ResourceFormData): Promise<Resource> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const domain = extractDomain(form.url)
  const favicon_url = getFaviconUrl(domain)

  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      user_id: user.id,
      url: form.url,
      title: form.title,
      description: form.description || null,
      notes: form.notes || null,
      domain,
      favicon_url,
      resource_type: form.resource_type,
      category_id: form.category_id || null,
      is_favorite: form.is_favorite,
      is_archived: false,
    })
    .select()
    .single()
  if (error) throw error

  // Attach tags
  if (form.tag_names.length > 0) {
    const tags = await Promise.all(form.tag_names.map(n => ensureTag(user.id, n)))
    const tagLinks = tags.map(t => ({ resource_id: resource.id, tag_id: t.id }))
    await supabase.from('resource_tags').insert(tagLinks)
  }

  // Attach to collections
  if (form.collection_ids.length > 0) {
    const colLinks = form.collection_ids.map(cid => ({ collection_id: cid, resource_id: resource.id }))
    await supabase.from('collection_resources').insert(colLinks)
  }

  return getResourceById(resource.id) as Promise<Resource>
}

export async function updateResource(id: string, form: Partial<ResourceFormData>): Promise<Resource> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates: Record<string, unknown> = {}
  if (form.url !== undefined) {
    updates.url = form.url
    updates.domain = extractDomain(form.url)
    updates.favicon_url = getFaviconUrl(updates.domain as string)
  }
  if (form.title       !== undefined) updates.title = form.title
  if (form.description !== undefined) updates.description = form.description || null
  if (form.notes       !== undefined) updates.notes = form.notes || null
  if (form.resource_type !== undefined) updates.resource_type = form.resource_type
  if (form.category_id !== undefined) updates.category_id = form.category_id || null
  if (form.is_favorite !== undefined) updates.is_favorite = form.is_favorite

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('resources').update(updates).eq('id', id)
    if (error) throw error
  }

  if (form.tag_names !== undefined) {
    await supabase.from('resource_tags').delete().eq('resource_id', id)
    if (form.tag_names.length > 0) {
      const tags = await Promise.all(form.tag_names.map(n => ensureTag(user.id, n)))
      await supabase.from('resource_tags').insert(tags.map(t => ({ resource_id: id, tag_id: t.id })))
    }
  }

  if (form.collection_ids !== undefined) {
    await supabase.from('collection_resources').delete().eq('resource_id', id)
    if (form.collection_ids.length > 0) {
      await supabase.from('collection_resources').insert(
        form.collection_ids.map(cid => ({ collection_id: cid, resource_id: id }))
      )
    }
  }

  return getResourceById(id) as Promise<Resource>
}

export async function toggleFavorite(id: string, current: boolean): Promise<void> {
  const { error } = await supabase
    .from('resources')
    .update({ is_favorite: !current })
    .eq('id', id)
  if (error) throw error
}

export async function archiveResource(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('resources')
    .update({ is_archived: archived })
    .eq('id', id)
  if (error) throw error
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw error
}

export async function markOpened(id: string): Promise<void> {
  await supabase
    .from('resources')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id)
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const [resources, collections, aiChats, favorites] = await Promise.all([
    supabase.from('resources').select('id', { count: 'exact' }).eq('is_archived', false),
    supabase.from('collections').select('id', { count: 'exact' }),
    supabase.from('resources').select('id', { count: 'exact' }).eq('resource_type', 'ai_chat').eq('is_archived', false),
    supabase.from('resources').select('id', { count: 'exact' }).eq('is_favorite', true).eq('is_archived', false),
  ])

  return {
    saved_resources: resources.count ?? 0,
    collections: collections.count ?? 0,
    ai_chats: aiChats.count ?? 0,
    favorites: favorites.count ?? 0,
  }
}

// ─── Export / Import ─────────────────────────────────────────────────────────
export async function exportData(): Promise<ExportData> {
  const [resources, categories, collections, tags] = await Promise.all([
    getResources({ is_archived: undefined }),
    getCategories(),
    getCollections(),
    getTags(),
  ])
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    resources,
    categories,
    collections,
    tags,
  }
}

export async function importResources(file: File): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let data: ExportData
  try {
    const text = await file.text()
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file')
  }

  if (!data.version || !Array.isArray(data.resources)) {
    throw new Error('Invalid Dashx export format')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const r of data.resources) {
    try {
      if (!r.url || !r.title) { errors.push(`Skipped resource with missing url/title`); skipped++; continue }
      const dup = await checkDuplicateUrl(r.url)
      if (dup) { skipped++; continue }

      await createResource({
        url: r.url,
        title: r.title,
        description: r.description ?? '',
        notes: r.notes ?? '',
        resource_type: r.resource_type ?? 'website',
        category_id: '',
        is_favorite: r.is_favorite ?? false,
        tag_names: r.tags?.map((t: Tag) => t.name) ?? [],
        collection_ids: [],
      })
      imported++
    } catch (e) {
      errors.push(`Failed to import "${r.title}": ${(e as Error).message}`)
    }
  }

  return { imported, skipped, errors }
}
