import { Bot, Sparkles, MessageSquare, Star } from 'lucide-react'
import type { DashboardStats } from '../types'

interface StatsCardsProps {
  stats: DashboardStats
  loading: boolean
}

const STAT_SKELETON = { width: '48px', height: '28px' }

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      id: 'stat-resources',
      label: 'Saved resources',
      value: stats.saved_resources,
      visual: (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '30px' }}>
          {[0.35, 0.55, 0.45, 0.7, 0.6, 0.85, 1.0].map((h, i) => (
            <div key={i} style={{ width: '5px', height: `${h * 100}%`, background: 'var(--accent-green)', borderRadius: '2px', opacity: 0.85 }} />
          ))}
        </div>
      ),
    },
    {
      id: 'stat-collections',
      label: 'Collections',
      value: stats.collections,
      visual: (
        <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
          <polyline
            points="2,24 12,18 24,20 36,10 46,14 58,4"
            stroke="var(--accent-green)" strokeWidth="2"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'stat-ai-chats',
      label: 'AI chats',
      value: stats.ai_chats,
      visual: (
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <div style={{
            width: '22px', height: '22px',
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={11} color="#c084fc" />
          </div>
          <div style={{
            width: '22px', height: '22px',
            background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={11} color="#38bdf8" />
          </div>
          <div style={{
            width: '22px', height: '22px',
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={11} color="#34d399" />
          </div>
        </div>
      ),
    },
    {
      id: 'stat-favorites',
      label: 'Favorites',
      value: stats.favorites,
      visual: (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '30px' }}>
          {[0.45, 0.7, 0.5, 0.9, 0.65, 0.85, 0.75].map((h, i) => (
            <div key={i} style={{ width: '5px', height: `${h * 100}%`, background: '#f59e0b', borderRadius: '2px', opacity: 0.85 }} />
          ))}
          <div style={{
            marginLeft: '6px', width: '22px', height: '22px',
            borderRadius: '4px',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={11} fill="#f59e0b" color="#f59e0b" />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1px',
      background: 'var(--border)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      {cards.map(card => (
        <div
          key={card.id}
          id={card.id}
          style={{
            background: 'var(--bg-card)',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '400', letterSpacing: '-0.01em' }}>
              {card.label}
            </span>
            {stats.saved_resources > 0 && (
              <span style={{
                fontSize: '11px', color: 'var(--accent-green)',
                background: 'var(--accent-green-dim)',
                padding: '2px 7px', borderRadius: '12px', fontWeight: '500',
                fontVariantNumeric: 'tabular-nums',
              }}>
                +{Math.max(1, Math.floor(card.value * 0.12))}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {loading ? (
              <div className="skeleton" style={{ ...STAT_SKELETON }} />
            ) : (
              <span style={{
                fontSize: '30px', fontWeight: '700',
                letterSpacing: '-0.03em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-primary)',
              }}>
                {card.value}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {card.visual}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
