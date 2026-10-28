// ─── Database Types ──────────────────────────────────────────────────────────

export type ResourceType =
  | 'website'
  | 'tutorial'
  | 'article'
  | 'course'
  | 'github'
  | 'design'
  | 'ai_tool'
  | 'ai_chat'
  | 'other'

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  resource_count?: number
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Resource {
  id: string
  user_id: string
  url: string
  title: string
  description: string | null
  notes: string | null
  favicon_url: string | null
  domain: string | null
  resource_type: ResourceType
  category_id: string | null
  is_favorite: boolean
  is_archived: boolean
  last_opened_at: string | null
  created_at: string
  updated_at: string
  // joined
  category?: Category | null
  tags?: Tag[]
  collections?: Collection[]
}

export interface ResourceTag {
  resource_id: string
  tag_id: string
}

export interface CollectionResource {
  collection_id: string
  resource_id: string
  created_at: string
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export type SortOption = 'created_at' | 'updated_at' | 'title' | 'last_opened_at'
export type SortDirection = 'asc' | 'desc'

export interface FilterState {
  search: string
  category_id: string | null
  collection_id: string | null
  resource_type: ResourceType | null
  is_favorite: boolean | null
  is_archived: boolean | null
  tag_ids: string[]
  sort: SortOption
  direction: SortDirection
}

export interface DashboardStats {
  saved_resources: number
  collections: number
  ai_chats: number
  favorites: number
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface ResourceFormData {
  url: string
  title: string
  description: string
  notes: string
  resource_type: ResourceType
  category_id: string
  is_favorite: boolean
  tag_names: string[]
  collection_ids: string[]
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export interface ExportData {
  version: '1.0'
  exported_at: string
  resources: Resource[]
  categories: Category[]
  collections: Collection[]
  tags: Tag[]
}
