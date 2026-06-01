import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const ACCENT       = '#3A7BD5'
const TERRACOTTA   = '#C17B5A'
const GREEN        = '#2E9E68'
const CLASS_COLORS = { 1: '#3A7BD5', 2: '#D4622A', 3: '#2E9E68', 4: '#8052C8' }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function fmtDate(iso) {
  const d = new Date(iso)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
}

function dayLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === tomorrow.toDateString())  return 'Tomorrow'
  return DAY_NAMES[d.getDay()]
}

function groupByDay(assignments) {
  const groups = {}
  for (const a of assignments) {
    const key = new Date(a.dueDate).toDateString()
    if (!groups[key]) groups[key] = { label: dayLabel(a.dueDate), dateStr: fmtDate(a.dueDate), items: [] }
    groups[key].items.push(a)
  }
  return Object.values(groups)
}

export default function ParentView() {
  const { token } = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound,setNotFound]= useState(false)

  useEffect(() => {
    fetch(`/api/view/${token}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) { setData(d); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', border: `3px solid var(--border)`,
            borderTopColor: ACCENT, margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14 }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', color: 'var(--text)', margin: 0 }}>
          Navi<span style={{ color: ACCENT }}>.</span>
        </h2>
        <p style={{ fontSize: 15, fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
          This dashboard is no longer shared.
        </p>
      </div>
    )
  }

  const groups = groupByDay(data.upcomingAssignments || [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 60px' }}>
      {/* Top banner */}
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: 'var(--text)' }}>
          Navi<span style={{ color: ACCENT }}>.</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
          Shared dashboard — view only
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        {/* Heading */}
        <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', margin: '0 0 28px', color: 'var(--text)' }}>
          {data.studentFirstName}'s Dashboard
        </h1>

        {/* Class cards — 2 col desktop, 1 col mobile */}
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif', margin: '0 0 14px' }}>
          Classes
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16, marginBottom: 36,
        }}>
          {data.classes.map(cls => {
            const color = CLASS_COLORS[cls.colorIndex] || ACCENT
            const pct   = cls.currentPercentage || 0
            return (
              <div key={cls.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: `4px solid ${color}`, borderRadius: 12, padding: '18px 20px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color, fontFamily: 'Sora, sans-serif' }}>
                  {cls.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
                    {cls.letterGrade || '—'}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                    {cls.currentPercentage != null ? `${Math.round(cls.currentPercentage)}%` : 'No grade yet'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Coming Up */}
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif', margin: '0 0 14px' }}>
          Coming Up
        </h2>
        {groups.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', marginBottom: 36 }}>Nothing due in the next 7 days.</p>
        ) : (
          <div style={{ marginBottom: 36 }}>
            {groups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
                  {group.label} · {group.dateStr}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map((a, ai) => {
                    const color = CLASS_COLORS[a.colorIndex] || ACCENT
                    return (
                      <div key={ai} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 9, padding: '10px 14px',
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: color }} />
                        <span style={{ flex: 1, fontSize: 13.5, fontFamily: 'Sora, sans-serif', color: 'var(--text)', textDecoration: a.isCompleted ? 'line-through' : 'none', opacity: a.isCompleted ? 0.5 : 1 }}>
                          {a.title}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>{a.className}</span>
                        {a.isCompleted ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="8" cy="8" r="7.5" stroke={GREEN} strokeWidth="1" fill="rgba(46,158,104,0.1)" />
                            <path d="M5 8l2.5 2.5 4-4" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="8" cy="8" r="7.5" stroke="var(--border)" strokeWidth="1.5" fill="none" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Streak card */}
        {data.currentStreak > 0 && (
          <div style={{
            background: 'rgba(193,123,90,0.1)', borderRadius: 12, padding: '16px 20px',
            display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 36,
          }}>
            <span style={{ fontSize: 26 }}>🔥</span>
            <div>
              <span style={{ fontSize: 22, fontWeight: 700, color: TERRACOTTA, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
                {data.currentStreak}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', marginLeft: 6 }}>
                day streak
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '0 20px 24px' }}>
        <a
          href="/"
          style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', textDecoration: 'none', opacity: 0.6 }}
        >
          Powered by Navi
        </a>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .parent-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
