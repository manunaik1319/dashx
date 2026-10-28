// Maps tag names to CSS classes for color-coded tag badges matching the reference
const TAG_MAP: Record<string, string> = {
  'ui/ux': 'tag-uiux',
  'ui': 'tag-uiux',
  'ux': 'tag-uiux',
  'design system': 'tag-design',
  'design': 'tag-design',
  'inspiration': 'tag-inspiration',
  'coding': 'tag-coding',
  'code': 'tag-coding',
  'javascript': 'tag-coding',
  'typescript': 'tag-coding',
  'react': 'tag-coding',
  'frontend': 'tag-frontend',
  'backend': 'tag-coding',
  'documentation': 'tag-docs',
  'docs': 'tag-docs',
  'ai tools': 'tag-aitools',
  'ai': 'tag-aitools',
  'productivity': 'tag-productivity',
  'tools': 'tag-tools',
  'tool': 'tag-tools',
  'graphics': 'tag-graphics',
  'graphics design': 'tag-graphics',
  'colors': 'tag-colors',
  'color': 'tag-colors',
}

export function getTagClass(name: string): string {
  const lower = name.toLowerCase().trim()
  return TAG_MAP[lower] ?? 'tag-default'
}

export function tagNameToColor(name: string): string {
  // Simple deterministic color from name for user-created tags
  const colors = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899', '#ef4444', '#6b7280']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
