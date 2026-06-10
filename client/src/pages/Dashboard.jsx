import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getToken, getUser, isLoggedIn } from '../lib/auth'
import CustomizePanel from '../components/CustomizePanel'

// ─── Constants ────────────────────────────────────────────────────────────────
const CLASS_COLORS = { 1: '#3A7BD5', 2: '#D4622A', 3: '#2E9E68', 4: '#8052C8' }
const ACCENT       = 'var(--navi-accent)'
const GOLD         = '#C8952A'
const TERRACOTTA   = '#C17B5A'
const GREEN        = '#2E9E68'
const DAY_KEYS     = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_LABELS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW_SHORT    = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth()    === d2.getMonth()    &&
         d1.getDate()     === d2.getDate()
}

function getWeekDays() {
  const today = new Date()
  const dow = today.getDay()
  const daysToMon = dow === 0 ? -6 : 1 - dow
  const mon = new Date(today)
  mon.setDate(today.getDate() + daysToMon)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function buildCalGrid(year, month) {
  const firstDow    = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtPillTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getSeconds() === 0) return ''
  const h = d.getHours()
  const mn = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return mn === 0 ? `${h12}${ampm}` : `${h12}:${String(mn).padStart(2,'0')}${ampm}`
}

function fmtMmSs(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ classes, activeTab, onTabChange }) {
  const navigate = useNavigate()
  const navItems = [
    { label: 'Dashboard',      tab: 0 },
    { label: 'Performance',     tab: 1 },
    { label: 'Study Plan',     tab: 2 },
    { label: 'Syllabus',       path: '/syllabi' },
    { label: 'Reminders',      disabled: true },
    { label: 'Settings',       path: '/settings' },
  ]

  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, width: 210, height: '100vh',
      background: 'var(--surface-side)', borderRight: '2px solid rgba(15, 110, 55, 0.85)',
      display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto',
    }}>
      <div style={{ padding: '24px 20px 20px' }}>
        <h2 style={{ fontSize: 22, margin: 0, fontFamily: 'Playfair Display, serif', color: 'var(--text)' }}>
          Navi<span style={{ color: ACCENT }}>.</span>
        </h2>
      </div>

      <div style={{ padding: '0 10px' }}>
        {navItems.map((item, i) => {
          const isActive = item.tab !== undefined && activeTab === item.tab
          return (
            <button key={i}
              onClick={() => {
                if (item.path)                  navigate(item.path)
                else if (item.tab !== undefined) onTabChange(item.tab)
              }}
              disabled={!!item.disabled}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '6px 9px', marginBottom: 2,
                borderRadius: 8, border: 'none',
                borderLeft: isActive ? '4px solid rgba(15, 110, 55, 0.95)' : '4px solid transparent',
                cursor: item.disabled ? 'default' : 'pointer',
                background: isActive ? `color-mix(in srgb, ${ACCENT} 8%, transparent)` : 'transparent',
                textAlign: 'left', opacity: item.disabled ? 0.4 : 1,
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isActive ? ACCENT : 'var(--navi-border)',
                transition: 'background 150ms',
              }} />
              <span style={{
                flex: 1, fontSize: 12, fontFamily: 'Sora, sans-serif',
                color: isActive ? ACCENT : 'var(--text)',
                fontWeight: isActive ? 600 : 400,
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '20px 20px 8px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
          Classes
        </p>
        {classes.map(cls => (
          <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: CLASS_COLORS[cls.colorIndex] || ACCENT }} />
            <span style={{ fontSize: 12.5, fontFamily: 'Sora, sans-serif', color: 'var(--text)', lineHeight: 1.3 }}>
              {cls.name}
            </span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '0 14px 24px' }}>
        <div style={{ background: 'rgba(193,123,90,0.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TERRACOTTA, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', marginTop: 2 }}>day streak</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TAB_GREEN = 'rgba(15, 110, 55, 0.9)'
const TAB_PILL  = 'rgba(15, 110, 55, 0.12)'

function TabBar({ activeTab, onTabChange, onOpenCustomize }) {
  const tabs    = ['Dashboard', 'Performance', 'Study Plan']
  const btnRefs = useRef([])
  const [pill,  setPill]  = useState({ left: 0, width: 0 })
  const [ready, setReady] = useState(false)

  // Measure pill position whenever activeTab changes or on mount
  useEffect(() => {
    const el = btnRefs.current[activeTab]
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth })
      setReady(true)
    }
  }, [activeTab])

  // Also measure after first paint so pill starts in the right place
  useEffect(() => {
    const el = btnRefs.current[activeTab]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    setReady(true)
  }, [])

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid var(--navi-border)',
      background: 'var(--navi-bg)',
      padding: '0 24px',
    }}>
      {/* ── A) Sliding pill ── */}
      {ready && (
        <div style={{
          position: 'absolute',
          top: 4, bottom: 4,
          left: pill.left,
          width: pill.width,
          background: TAB_PILL,
          borderRadius: 8,
          transition: 'left 0.25s ease, width 0.25s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}

      {tabs.map((tab, i) => {
        const isActive = activeTab === i
        return (
          <button
            key={i}
            ref={el => { btnRefs.current[i] = el }}
            onClick={() => onTabChange(i)}
            style={{
              position: 'relative',
              padding: '14px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Sora, sans-serif',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? ACCENT : 'var(--text-muted)',
              zIndex: 1,
              outline: 'none',
              // ── C) Glow ──
              animation: isActive ? 'tab-glow-pulse 2.5s ease-in-out infinite' : 'none',
              boxShadow: isActive ? '0 2px 12px rgba(15, 110, 55, 0.2)' : 'none',
              borderRadius: 6,
              transition: 'color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 110, 55, 0.15)'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {tab}

            {/* ── B) Animated underline ── */}
            <span style={{
              position: 'absolute',
              bottom: 0, left: 0,
              height: 3,
              width: isActive ? '100%' : '0%',
              background: TAB_GREEN,
              borderRadius: '2px 2px 0 0',
              transition: 'width 0.3s ease',
              display: 'block',
            }} />
          </button>
        )
      })}

      {/* ── Customize button ── */}
      <button
        onClick={onOpenCustomize}
        title="Customize theme"
        style={{
          marginLeft: 'auto',
          alignSelf: 'center',
          padding: '7px 14px',
          border: '1.5px solid var(--navi-accent)',
          borderRadius: 20,
          background: 'color-mix(in srgb, var(--navi-accent) 10%, transparent)',
          cursor: 'pointer',
          color: 'var(--navi-accent)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'Sora, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          animation: 'customize-pulse 2.5s ease-in-out infinite',
          transition: 'background 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--navi-accent) 18%, transparent)'; e.currentTarget.style.transform = 'scale(1.04)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--navi-accent) 10%, transparent)'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 17c0-1.1.9-2 2-2h1.5l8.3-8.3a2.1 2.1 0 0 0-3-3L3.5 12V13.5A2 2 0 0 0 3 17z"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="5" cy="17" r="1" fill="currentColor"/>
        </svg>
        Customize
      </button>
    </div>
  )
}

// ─── Calendar event popup ──────────────────────────────────────────────
function CalEventPopup({ event, anchorRect, onClose }) {
  const POPUP_H = 90
  const POPUP_W = 252
  const spaceAbove = anchorRect.top - 8
  const showAbove  = spaceAbove >= POPUP_H
  const top  = showAbove ? anchorRect.top - POPUP_H - 6 : anchorRect.bottom + 6
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - POPUP_W - 8))

  const isCanvas    = event.type === 'canvas'
  const accentColor = isCanvas ? 'var(--ev-canvas-border)' : 'var(--ev-gcal-border)'
  const dateLabel   = event.fullDate
    ? new Date(event.fullDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  return (
    <div
      data-pill-popup="true"
      style={{
        position: 'fixed', top, left, zIndex: 600,
        width: POPUP_W,
        background: 'var(--surface)',
        border: '1px solid var(--navi-border)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
        fontFamily: 'Sora, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
          {event.title}
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1, padding: 0, flexShrink: 0 }}
        >×</button>
      </div>
      {(dateLabel || event.time) && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {dateLabel}{event.time ? ` · ${event.time}` : ''}
        </p>
      )}
    </div>
  )
}

// ─── Calendar card — week view ──────────────────────────────────────────
function CalendarCard({ year, month, assignments, indicators, selectedDate, onSelectDate, onPrev, onNext, gcalEvents = [] }) {
  // ── Grid constants ──────────────────────────────────────────────────────
  const GUTTER_W      = 40
  const SLOT_H        = 58
  const DISPLAY_START = 6
  const DISPLAY_END   = 22
  const TOTAL_H       = ((DISPLAY_END - DISPLAY_START) / 2) * SLOT_H  // 464px
  const PX_PER_MIN    = TOTAL_H / ((DISPLAY_END - DISPLAY_START) * 60)
  const TIME_LABELS   = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM']
  const DOW_FULL      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today         = new Date()

  // ── State ──────────────────────────────────────────────────────────────
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [activePopup, setActivePopup] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = SLOT_H + 10
  }, [])

  useEffect(() => { setActivePopup(null) }, [weekOffset])

  useEffect(() => {
    if (!activePopup) return
    const handler = e => {
      if (!e.target.closest('[data-pill-popup]') && !e.target.closest('[data-cal-event]'))
        setActivePopup(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activePopup])

  // ── Week dates ──────────────────────────────────────────────────────────
  const weekStart = (() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay() + weekOffset * 7)
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const midWeek     = weekDays[3]
  const headerLabel = `${MONTH_NAMES[midWeek.getMonth()]} ${midWeek.getFullYear()}`

  // ── Event map: dateStr → { timed, allDay } ────────────────────────────────
  const eventMap = {}
  function slot(str) {
    if (!eventMap[str]) eventMap[str] = { timed: [], allDay: [] }
    return eventMap[str]
  }
  for (const a of assignments) {
    if (!a.dueDate) continue
    slot(dateToStr(new Date(a.dueDate))).allDay.push({
      type: 'canvas', title: a.title, fullDate: a.dueDate, time: null,
    })
  }
  for (const ev of gcalEvents) {
    if (!ev.startTime) continue
    const str     = dateToStr(new Date(ev.startTime))
    const timeStr = fmtPillTime(ev.startTime)
    if (!timeStr) {
      slot(str).allDay.push({ type: 'gcal', title: ev.title, fullDate: ev.startTime, time: null })
    } else {
      slot(str).timed.push({
        type: 'gcal', title: ev.title, fullDate: ev.startTime,
        startTime: ev.startTime, endTime: ev.endTime || null, time: timeStr,
      })
    }
  }

  const hasAnyAllDay = weekDays.some(d => (eventMap[dateToStr(d)]?.allDay?.length || 0) > 0)

  // ── Event positioning ───────────────────────────────────────────────────
  function evTop(startTime) {
    const d   = new Date(startTime)
    const min = (d.getHours() - DISPLAY_START) * 60 + d.getMinutes()
    return Math.max(0, Math.min(TOTAL_H - 4, min * PX_PER_MIN))
  }
  function evHeight(startTime, endTime) {
    const sd = new Date(startTime)
    const sm = (sd.getHours() - DISPLAY_START) * 60 + sd.getMinutes()
    if (!endTime) return Math.max(22, 60 * PX_PER_MIN)
    const ed = new Date(endTime)
    const em = (ed.getHours() - DISPLAY_START) * 60 + ed.getMinutes()
    return Math.max(22, (em - sm) * PX_PER_MIN)
  }

  function handleEventClick(e, ev) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setActivePopup(prev => prev && prev.event === ev ? null : { event: ev, anchorRect: rect })
  }

  const navBtnStyle = {
    background: 'none', border: '1px solid var(--navi-border)', borderRadius: 6,
    width: 28, height: 28, cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }

  // Grid lines via CSS variable — updates automatically in dark mode
  const gridLinesBg = `repeating-linear-gradient(to bottom, var(--cal-grid-line) 0px, var(--cal-grid-line) 1px, transparent 1px, transparent ${SLOT_H}px)`

  return (
    <div className="card" style={{ marginBottom: 0, border: '2px solid rgba(15, 110, 55, 0.85)', padding: 0, overflow: 'hidden' }}>

      {/* ── Nav bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 9px' }}>
        <h3 style={{ fontSize: 15, margin: 0, fontFamily: 'Playfair Display, serif', color: 'var(--text)' }}>
          {headerLabel}
        </h3>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={navBtnStyle}>&#8249;</button>
          <button
            onClick={() => setWeekOffset(0)}
            style={{ ...navBtnStyle, fontSize: 11, width: 'auto', padding: '0 10px', fontFamily: 'Sora, sans-serif' }}
          >Today</button>
          <button onClick={() => setWeekOffset(w => w + 1)} style={navBtnStyle}>&#8250;</button>
        </div>
      </div>

      {/*
        All rows share ONE scroll container so the scrollbar (if any) affects all
        rows identically — column borders align pixel-perfect.
        scrollbarGutter:stable reserves the scrollbar track even when not scrolling.
        All rows use display:flex with width:GUTTER_W + flex:1 per day column.
      */}
      <div ref={scrollRef} style={{ overflowY: 'auto', maxHeight: 520, scrollbarGutter: 'stable' }}>

        {/* ── Sticky day column headers (flex, matches time grid exactly) ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 3, background: 'var(--surface)',
          display: 'flex', borderBottom: '1px solid var(--cal-grid-line)',
        }}>
          <div style={{ width: GUTTER_W, flexShrink: 0 }} />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={i}
                onClick={() => onSelectDate(dateToStr(day))}
                style={{ flex: 1, textAlign: 'center', padding: '5px 2px 7px', borderLeft: '1px solid var(--cal-grid-line)', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                {/* Use explicit px lineHeight so header has integer pixel height → no sub-pixel gap */}
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif', lineHeight: '12px' }}>
                  {DOW_FULL[day.getDay()]}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%', marginTop: 2,
                  background: isToday ? ACCENT : 'transparent',
                }}>
                  <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : 'var(--text)', fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
                    {day.getDate()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── All-day strip (flex, same structure) ── */}
        {hasAnyAllDay && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--cal-grid-line)', minHeight: 26 }}>
            <div style={{ width: GUTTER_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', opacity: 0.65 }}>all-day</span>
            </div>
            {weekDays.map((day, i) => {
              const allDay = eventMap[dateToStr(day)]?.allDay || []
              return (
                <div key={i} style={{ flex: 1, borderLeft: '1px solid var(--cal-grid-line)', padding: '2px 3px', display: 'flex', flexDirection: 'column', gap: 2, boxSizing: 'border-box' }}>
                  {allDay.map((ev, j) => {
                    const bc = ev.type === 'canvas' ? 'var(--ev-canvas-border)' : 'var(--ev-gcal-border)'
                    const bg = ev.type === 'canvas' ? 'var(--ev-canvas-bg)' : 'var(--ev-gcal-bg)'
                    const tc = ev.type === 'canvas' ? 'var(--ev-canvas-text)' : 'var(--ev-gcal-text)'
                    return (
                      <div
                        key={j}
                        data-cal-event="true"
                        onClick={e => handleEventClick(e, ev)}
                        title={ev.title}
                        style={{
                          fontSize: 10, fontWeight: 500, color: tc,
                          fontFamily: 'Sora, sans-serif', padding: '1px 4px',
                          borderRadius: 3, border: `1px solid ${bc}`, background: bg,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'pointer', boxSizing: 'border-box',
                        }}
                      >
                        {ev.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Time grid: single flex row (gutter + 7 day columns) ── */}
        <div style={{ display: 'flex', height: TOTAL_H }}>

          {/* Time gutter */}
          <div style={{ width: GUTTER_W, flexShrink: 0, position: 'relative' }}>
            {TIME_LABELS.map((label, i) => (
              <div key={label} style={{ position: 'absolute', top: i * SLOT_H - 5, right: 6, textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', lineHeight: 1, opacity: 0.75 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns — flex:1 each matches header flex:1 exactly */}
          {weekDays.map((day, colIdx) => {
            const dStr    = dateToStr(day)
            const timed   = eventMap[dStr]?.timed || []
            const isToday = isSameDay(day, today)

            return (
              <div
                key={colIdx}
                onClick={() => onSelectDate(dStr)}
                style={{
                  flex: 1, position: 'relative',
                  borderLeft: '1px solid var(--cal-grid-line)',
                  backgroundColor: isToday ? 'rgba(15,110,55,0.022)' : 'transparent',
                  backgroundImage: gridLinesBg,
                  boxSizing: 'border-box', cursor: 'pointer',
                }}
              >
                {timed.map((ev, j) => {
                  const top    = evTop(ev.startTime)
                  const height = evHeight(ev.startTime, ev.endTime)
                  return (
                    <div
                      key={j}
                      data-cal-event="true"
                      onClick={e => { e.stopPropagation(); handleEventClick(e, ev); onSelectDate(dStr) }}
                      style={{
                        position: 'absolute', top, left: 2, right: 2, height,
                        border: '1.5px solid var(--ev-gcal-border)',
                        borderRadius: 4, background: 'var(--ev-gcal-bg)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        overflow: 'hidden', padding: '2px 4px',
                        cursor: 'pointer', boxSizing: 'border-box', zIndex: 2,
                      }}
                    >
                      <div style={{ fontSize: 10, color: 'var(--ev-gcal-text)', opacity: 0.8, fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                        {ev.time}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ev-gcal-text)', fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                        {ev.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

        </div>
      </div>

      {activePopup && (
        <CalEventPopup
          event={activePopup.event}
          anchorRect={activePopup.anchorRect}
          onClose={() => setActivePopup(null)}
        />
      )}
    </div>
  )
}

// ─── Day panel ────────────────────────────────────────────────────────────────
function DayPanel({ date, data, onClose, onNoteSave, onTaskAdd, onTaskComplete, onTaskDelete, gcalEventsForDay = [] }) {
  const [noteText,      setNoteText]      = useState(data.note || '')
  const [savedVisible,  setSavedVisible]  = useState(false)
  const [showTaskInput, setShowTaskInput] = useState(false)
  const [taskInput,     setTaskInput]     = useState('')
  const saveTimerRef = useRef()

  useEffect(() => {
    setNoteText(data.note || '')
    setShowTaskInput(false)
    setTaskInput('')
  }, [date, data.note])

  function handleNoteChange(val) {
    setNoteText(val)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await onNoteSave(date, val)
      setSavedVisible(true)
      setTimeout(() => setSavedVisible(false), 2000)
    }, 900)
  }

  async function handleAddTask() {
    if (!taskInput.trim()) return
    await onTaskAdd(date, taskInput.trim())
    setTaskInput('')
    setShowTaskInput(false)
  }

  const d = parseDateStr(date)
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--navi-border)', borderRadius: 12,
      padding: '16px', display: 'flex', flexDirection: 'column', gap: 0,
      maxHeight: 480, overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', margin: 0, lineHeight: 1.3 }}>{dateLabel}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: '0 2px', lineHeight: 1, marginTop: -2 }}>×</button>
      </div>

      {data.assignments.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {data.assignments.map(a => {
            const color = CLASS_COLORS[a.class.colorIndex] || ACCENT
            return (
              <div key={a.id} className="chip" style={{ '--chip-color': color, marginBottom: 5, cursor: 'default' }}>
                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color, fontFamily: 'Sora, sans-serif' }}>{a.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>{a.class.name}</p>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif' }}>Notes</p>
          {savedVisible && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontStyle: 'italic' }}>saved</span>}
        </div>
        <textarea
          value={noteText}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder="Jot something down for this day..."
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 10px',
            borderRadius: 7, border: '1.5px solid var(--navi-border)', background: 'var(--navi-bg)',
            fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text)',
            resize: 'vertical', lineHeight: 1.5, outline: 'none',
          }}
        />
      </div>

      <div>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif' }}>Tasks</p>

        {data.tasks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <button
              onClick={() => onTaskComplete(t.id, date)}
              style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                background: t.isCompleted ? ACCENT : 'transparent',
                border: t.isCompleted ? 'none' : '1.5px solid var(--navi-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {t.isCompleted && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span style={{ flex: 1, fontSize: 12.5, fontFamily: 'Sora, sans-serif', color: 'var(--text)', textDecoration: t.isCompleted ? 'line-through' : 'none', opacity: t.isCompleted ? 0.5 : 1 }}>{t.title}</span>
            <button onClick={() => onTaskDelete(t.id, date)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '0 2px', lineHeight: 1, opacity: 0.6 }}>×</button>
          </div>
        ))}

        {showTaskInput ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              autoFocus
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTask()
                if (e.key === 'Escape') { setShowTaskInput(false); setTaskInput('') }
              }}
              placeholder="Task name…"
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${ACCENT}`,
                fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text)', background: 'var(--navi-bg)', outline: 'none',
              }}
            />
            <button onClick={handleAddTask} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>Add</button>
          </div>
        ) : (
          <button
            onClick={() => setShowTaskInput(true)}
            style={{ fontSize: 11.5, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', padding: '4px 0', marginTop: 4 }}
          >
            + Add task for this day
          </button>
        )}
      </div>

      {/* Google Calendar events for this day */}
      {gcalEventsForDay.length > 0 && (
        <DayPanelGcalEvents events={gcalEventsForDay} />
      )}
    </div>
  )
}

function DayPanelGcalEvents({ events }) {
  const [activeEvent, setActiveEvent] = useState(null)
  return (
    <>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--navi-border)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
          Calendar Events
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.map(ev => (
            <GCalEventChip key={ev.id} event={ev} onClick={setActiveEvent} />
          ))}
        </div>
      </div>
      <EventModal event={activeEvent} onClose={() => setActiveEvent(null)} />
    </>
  )
}

// ─── Note popup ───────────────────────────────────────────────────────────────
function NotePopup({ assignment, onClose, onSave }) {
  const [text, setText] = useState(assignment?.note || '')
  const ref = useRef()
  useEffect(() => { ref.current?.focus() }, [])
  if (!assignment) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(38,35,31,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div className="card" style={{ width: 440, padding: 24 }}>
        <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{assignment.title}</p>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>{assignment.class.name}</p>
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Quick note — focus on chapter 3, ask prof about Q2."
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            borderRadius: 8, border: '1.5px solid var(--navi-border)', background: 'var(--navi-bg)',
            fontFamily: 'Sora, sans-serif', fontSize: 13, color: 'var(--text)',
            resize: 'vertical', lineHeight: 1.5, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--navi-border)', background: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13, color: 'var(--text)' }}>Cancel</button>
          <button onClick={() => onSave(assignment.id, text)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: ACCENT, cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#fff', fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Week strip ───────────────────────────────────────────────────────────────
function WeekStrip({ weekData, selectedDate, onChipClick, onDayClick, onDifficultyRate, gcalEvents = [] }) {
  const today    = new Date()
  const weekDays = getWeekDays()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20, minWidth: 0 }}>
      {weekDays.map((day, i) => {
        const isToday       = isSameDay(day, today)
        const dayStr        = dateToStr(day)
        const isSelected    = selectedDate === dayStr
        const assignments   = weekData[DAY_KEYS[i]] || []
        const dayGcalEvents = gcalEvents.filter(ev => ev.startTime && isSameDay(new Date(ev.startTime), day))

        return (
          <div key={i}
            onClick={() => onDayClick(dayStr)}
            style={{
              background: isToday
                ? `color-mix(in srgb, ${ACCENT} 10%, var(--surface))`
                : isSelected ? `color-mix(in srgb, ${ACCENT} 5%, var(--surface))` : 'var(--surface)',
              border: isToday
                ? `2px solid ${ACCENT}`
                : isSelected ? `1px solid color-mix(in srgb, ${ACCENT} 40%, var(--navi-border))` : '1px solid var(--navi-border)',
              borderRadius: 10, padding: '8px 6px', cursor: 'pointer',
              transition: 'background 150ms',
              minWidth: 0, overflow: 'hidden',
            }}
          >
            <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 600, color: isToday ? ACCENT : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif' }}>
              {DAY_LABELS[i]}
            </p>
            <p style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: isToday || isSelected ? ACCENT : 'var(--text)', lineHeight: 1 }}>
              {day.getDate()}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {assignments.map(a => {
                const color = CLASS_COLORS[a.class.colorIndex] || ACCENT
                const fromCanvas = !!a.canvasAssignmentId
                const diff = a.difficulty

                const diffStyles = {
                  easy:   { bg: 'rgba(46,158,104,0.15)', color: '#2E9E68' },
                  medium: { bg: 'rgba(200,149,42,0.15)', color: '#C8952A' },
                  hard:   { bg: 'rgba(193,66,42,0.15)',  color: '#C1422A' },
                }

                return (
                  <div key={a.id}
                    className="chip"
                    style={{ '--chip-color': color, cursor: 'pointer', minWidth: 0, overflow: 'hidden' }}
                    onClick={e => { e.stopPropagation(); onChipClick(a) }}
                  >
                    <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, color, lineHeight: 1.3, fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 9.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.class.name}</p>
                    {a.note && <p style={{ margin: '2px 0 0', fontSize: 9.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'📝'} note saved</p>}
                    {fromCanvas && (
                      <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', opacity: 0.65, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>via Canvas</p>
                    )}
                    {diff === null || diff === undefined ? (
                      <p style={{ margin: '4px 0 0', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}
                        onClick={e => e.stopPropagation()}>
                        How hard?{' '}
                        {['easy', 'medium', 'hard'].map(level => (
                          <span
                            key={level}
                            onClick={e => { e.stopPropagation(); onDifficultyRate(a.id, level) }}
                            style={{ cursor: 'pointer', textDecoration: 'underline', marginRight: 4, textTransform: 'capitalize' }}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <span style={{
                        display: 'inline-block', marginTop: 4,
                        fontSize: 8.5, fontWeight: 700, fontFamily: 'Sora, sans-serif',
                        padding: '2px 6px', borderRadius: 99,
                        background: diffStyles[diff]?.bg || 'var(--navi-border)',
                        color: diffStyles[diff]?.color || 'var(--text-muted)',
                        textTransform: 'capitalize',
                      }}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* GCal events for this day */}
              {dayGcalEvents.map((ev, j) => (
                <div key={`gcal-${j}`} style={{
                  fontSize: 9.5, fontFamily: 'Sora, sans-serif',
                  padding: '2px 5px', borderRadius: 4,
                  background: 'var(--ev-gcal-bg)',
                  border: '1px solid var(--ev-gcal-border)',
                  color: 'var(--ev-gcal-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.3, cursor: 'default',
                }}>
                  {fmtPillTime(ev.startTime) ? `${fmtPillTime(ev.startTime)} · ${ev.title}` : ev.title}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Progress grid ────────────────────────────────────────────────────────────
function ProgressGrid({ classes, weekData }) {
  const all = Object.values(weekData).flat()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {classes.map(cls => {
        const color = CLASS_COLORS[cls.colorIndex] || ACCENT
        const clsA  = all.filter(a => a.classId === cls.id)
        const total = clsA.length
        const done  = clsA.filter(a => a.isCompleted).length
        const pct   = total > 0 ? Math.round((done / total) * 100) : 0
        return (
          <div key={cls.id} className="card" style={{ padding: '12px 14px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color, fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cls.name}
            </p>
            <div style={{ height: 5, background: 'var(--navi-border)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
              {total === 0 ? 'No assignments this week' : `${done} of ${total} done`}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Today's Focus card ───────────────────────────────────────────────────────
function TodaysFocusCard({ weekData, todayTasks, onToggleComplete, onToggleDayTask, onAddDayTask, onDeleteDayTask }) {
  const today    = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const [showInput, setShowInput] = useState(false)
  const [inputVal,  setInputVal]  = useState('')
  const inputRef = useRef()

  useEffect(() => { if (showInput) inputRef.current?.focus() }, [showInput])

  const focused = Object.values(weekData).flat()
    .filter(a => {
      if (a.isCompleted) return false
      const d = new Date(a.dueDate)
      return isSameDay(d, today) || isSameDay(d, tomorrow)
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3)

  async function handleAdd() {
    const title = inputVal.trim()
    if (!title) return
    await onAddDayTask(title)
    setInputVal('')
    setShowInput(false)
  }

  const hasContent = focused.length > 0 || todayTasks.length > 0

  return (
    <div className="card" style={{ marginBottom: 16, border: '2px solid rgba(15, 110, 55, 0.85)' }}>
      <h3 style={{ fontSize: 15, margin: '0 0 14px' }}>Today's Focus</h3>

      {!hasContent && !showInput && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', margin: '0 0 10px' }}>No urgent assignments. 🎉</p>
      )}

      {focused.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {focused.map(a => {
            const color = CLASS_COLORS[a.class.colorIndex] || ACCENT
            const dueLabel = isSameDay(new Date(a.dueDate), today) ? 'Due today' : 'Due tomorrow'
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'Sora, sans-serif', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                    {dueLabel} · {a.class.name}
                  </p>
                </div>
                <button onClick={() => onToggleComplete(a.id)}
                  style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, border: '1.5px solid var(--navi-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.3 }}>
                    <path d="M2 6l3 3 5-5" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {todayTasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {todayTasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '3px solid var(--navi-border)', paddingLeft: 10 }}>
              <button onClick={() => onToggleDayTask(t.id)}
                style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                  border: t.isCompleted ? 'none' : '1.5px solid var(--navi-border)',
                  background: t.isCompleted ? ACCENT : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {t.isCompleted && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span style={{ flex: 1, fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)', textDecoration: t.isCompleted ? 'line-through' : 'none', opacity: t.isCompleted ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title}
              </span>
              <button onClick={() => onDeleteDayTask(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '0 2px', lineHeight: 1, opacity: 0.5, flexShrink: 0 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showInput ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setShowInput(false); setInputVal('') }
            }}
            placeholder="Task name…"
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${ACCENT}`,
              fontFamily: 'Sora, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--navi-bg)', outline: 'none',
            }}
          />
          <button onClick={handleAdd} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 500 }}>Add</button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          style={{ fontSize: 12.5, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4, marginTop: hasContent ? 4 : 0 }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add task
        </button>
      )}
    </div>
  )
}

// ─── Syllabus status card ─────────────────────────────────────────────────────
function SyllabusStatusCard({ classes, syllabusStatus }) {
  const navigate = useNavigate()
  return (
    <div className="card" style={{ marginBottom: 16, border: '2px solid rgba(175, 120, 15, 0.85)' }}>
      <h3 style={{ fontSize: 15, margin: '0 0 14px' }}>Syllabus</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {classes.map(cls => {
          const has = syllabusStatus[cls.id]
          return (
            <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cls.name}
              </span>
              {has
                ? <span style={{ fontSize: 10.5, fontWeight: 600, color: GREEN, background: 'rgba(46,158,104,0.12)', borderRadius: 99, padding: '3px 9px', fontFamily: 'Sora, sans-serif', flexShrink: 0 }}>summarized</span>
                : <button onClick={() => navigate('/syllabi')}
                    style={{ fontSize: 10.5, fontWeight: 600, color: GOLD, background: 'rgba(200,149,42,0.12)', borderRadius: 99, padding: '3px 9px', fontFamily: 'Sora, sans-serif', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    + upload
                  </button>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Office Hours Reminder ────────────────────────────────────────────────────
function OfficeHoursReminder({ classes, syllabusData, rolledOverByClass }) {
  const items = []
  for (const cls of classes) {
    const syllabus = syllabusData[cls.id]
    if (!syllabus?.officeHours) continue
    const needsHelp = (cls.currentGrade !== null && cls.currentGrade !== undefined && cls.currentGrade < 75)
      || cls.currentGrade === null
      || (rolledOverByClass[cls.id] || 0) > 2
    if (!needsHelp) continue
    items.push({ cls, officeHours: syllabus.officeHours })
  }

  if (items.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(({ cls, officeHours }) => {
        const color = CLASS_COLORS[cls.colorIndex] || ACCENT
        return (
          <div key={cls.id} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color, fontFamily: 'Sora, sans-serif' }}>
              {cls.name}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 12.5, color: 'var(--text)', fontFamily: 'Sora, sans-serif', lineHeight: 1.4 }}>
              Professor office hours: {officeHours}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
              You might want to stop by this week.
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Connect Your Tools section ──────────────────────────────────────────────
function ConnectToolsSection({ gcalConnected, onGcalDisconnect, token }) {
  // Google Calendar SVG logo
  const GCalLogo = () => (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="6" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/>
      <rect x="6" y="14" width="36" height="4" fill="#4285F4"/>
      <rect x="6" y="14" width="36" height="4" fill="#4285F4"/>
      <text x="24" y="34" textAnchor="middle" fontFamily="Google Sans, sans-serif" fontSize="14" fontWeight="700" fill="#4285F4">31</text>
      <rect x="13" y="6" width="3" height="8" rx="1.5" fill="#4285F4"/>
      <rect x="32" y="6" width="3" height="8" rx="1.5" fill="#4285F4"/>
    </svg>
  )

  // Canvas flame-style SVG logo
  const CanvasLogo = () => (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="6" fill="#E66000"/>
      <text x="24" y="31" textAnchor="middle" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#fff">C</text>
    </svg>
  )

  const cardBase = {
    flex: 1,
    background: 'var(--surface)',
    border: '1px solid var(--navi-border)',
    borderRadius: 16,
    padding: '20px 19px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-muted)', margin: '0 0 12px',
      }}>
        Connect Your Tools
      </p>

      <div style={{ display: 'flex', gap: 14 }}>

        {/* ── Google Calendar card ── */}
        <div style={{
          ...cardBase,
          borderColor: gcalConnected ? 'rgba(46,158,104,0.4)' : 'var(--navi-border)',
          boxShadow: gcalConnected ? '0 0 0 0 transparent' : 'none',
        }}>
          {/* Subtle top-edge colour bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: gcalConnected
              ? 'linear-gradient(90deg,#2E9E68,#34c97e)'
              : 'linear-gradient(90deg,#4285F4,#34A853)',
            borderRadius: '16px 16px 0 0',
          }} />

          <GCalLogo />

          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700,
                           color: 'var(--text)', marginBottom: 4 }}>
              Google Calendar
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 12,
                           color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Sync your events and deadlines automatically.
            </div>
          </div>

          {gcalConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: 'rgba(46,158,104,0.10)', border: '2px solid rgba(15, 110, 55, 0.85)',
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="6.5" fill="#2E9E68"/>
                  <path d="M3.5 6.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 12,
                                fontWeight: 600, color: '#2E9E68' }}>Connected</span>
              </div>
              <button
                onClick={onGcalDisconnect}
                style={{
                  padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent', border: '1px solid var(--navi-border)',
                  fontFamily: 'Sora, sans-serif', fontSize: 12,
                  color: 'var(--text-muted)', fontWeight: 500,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#e55'; e.currentTarget.style.color = '#e55' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--navi-border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => { window.location.href = `/api/google/auth?token=${token}` }}
              style={{
                marginTop: 6,
                padding: '8px 20px', borderRadius: 8, border: '2px solid rgba(15, 110, 55, 0.85)',
                background: '#2E9E68', color: '#fff',
                fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                animation: 'gcal-pulse 2.2s ease-in-out infinite',
              }}
            >
              Connect
            </button>
          )}
        </div>

        {/* ── Canvas card ── */}
        <div style={{ ...cardBase, opacity: 0.72, border: '2px solid rgba(175, 120, 15, 0.85)' }}>
          {/* Top-edge colour bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg,#E66000,#ff8533)',
            borderRadius: '16px 16px 0 0',
            opacity: 0.5,
          }} />

          <CanvasLogo />

          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700,
                           color: 'var(--text)', marginBottom: 4 }}>
              Canvas LMS
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 12,
                           color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Import your assignments and due dates.
            </div>
          </div>

          <button
            disabled
            style={{
              marginTop: 6,
              padding: '8px 20px', borderRadius: 8,
              border: '1px solid rgba(175, 120, 15, 0.85)', background: 'var(--navi-bg)',
              fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
              color: 'var(--text-muted)', cursor: 'not-allowed',
            }}
          >
            Coming Soon
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Google Calendar card ─────────────────────────────────────────────────────
// ─── Shared gcal helpers ──────────────────────────────────────────────────────
function gcalEventColor(title = '') {
  const lower = title.toLowerCase()
  if (lower.includes('assignment') || lower.includes('due') || lower.includes('submit') || lower.includes('deadline'))
    return { border: '#E67E22', bg: 'rgba(230,126,34,0.06)', text: '#C0641A' }
  if (lower.includes('exam') || lower.includes('quiz') || lower.includes('test') || lower.includes('midterm') || lower.includes('final'))
    return { border: '#e55', bg: 'rgba(229,57,53,0.06)', text: '#c62828' }
  if (lower.includes('office') || lower.includes('meeting') || lower.includes('review') || lower.includes('session'))
    return { border: '#2E9E68', bg: 'rgba(46,158,104,0.06)', text: '#1e7a51' }
  return { border: '#4285F4', bg: 'rgba(66,133,244,0.06)', text: '#1a5fc8' }
}

function fmtEventTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  // All-day events come through as midnight UTC — skip time display
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getSeconds() === 0) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtEventDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today    = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (isSameDay(d, today))    return 'Today'
  if (isSameDay(d, tomorrow)) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Event detail modal ───────────────────────────────────────────────────────
function EventModal({ event, onClose }) {
  if (!event) return null
  const colors = gcalEventColor(event.title)
  const startTime = fmtEventTime(event.startTime)
  const dateLabel = fmtEventDate(event.startTime)
  const endTime   = event.endTime ? fmtEventTime(event.endTime) : ''

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 16,
          border: `1px solid var(--navi-border)`,
          borderTop: `4px solid ${colors.border}`,
          padding: '28px 28px 24px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: colors.border,
            }} />
            <h3 style={{
              fontFamily: 'Playfair Display, serif', fontSize: 18,
              fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3,
            }}>
              {event.title}
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text-muted)', lineHeight: 1,
            padding: '0 2px', marginTop: -2, flexShrink: 0,
          }}>×</button>
        </div>

        {/* Date / time row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 9,
          background: colors.bg, marginBottom: 14,
        }}>
          <span style={{ fontSize: 15 }}>🗓</span>
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: colors.text, fontWeight: 600 }}>
            {dateLabel}
            {startTime ? ` · ${startTime}` : ''}
            {endTime   ? ` – ${endTime}`   : ''}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>
              {event.location}
            </span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div style={{
            padding: '12px 14px', borderRadius: 9,
            background: 'var(--navi-bg)', border: '1px solid var(--navi-border)',
            marginBottom: 6,
          }}>
            <p style={{
              fontFamily: 'Sora, sans-serif', fontSize: 13,
              color: 'var(--text)', lineHeight: 1.7, margin: 0,
              whiteSpace: 'pre-line',
            }}>
              {event.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Single styled event chip (reused in sidebar + day panel) ─────────────────
function GCalEventChip({ event, onClick }) {
  const colors  = gcalEventColor(event.title)
  const dateStr = fmtEventDate(event.startTime)
  const timeStr = fmtEventTime(event.startTime)

  return (
    <div
      onClick={() => onClick(event)}
      style={{
        padding: '9px 12px 9px 14px', borderRadius: 9,
        background: colors.bg,
        border: `1px solid ${colors.border}22`,
        borderLeft: '3px solid rgba(175, 120, 15, 0.9)',
        cursor: 'pointer',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${colors.border}28` }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700,
        color: 'var(--text)', marginBottom: 3,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {event.title}
      </div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
        {dateStr}{timeStr ? ` · ${timeStr}` : ''}
        {event.location ? ` · ${event.location}` : ''}
      </div>
    </div>
  )
}

// ─── Upcoming Events sidebar card ─────────────────────────────────────────────
function GoogleCalendarCard({ events, connected }) {
  const [activeEvent, setActiveEvent] = useState(null)

  if (!connected) return null

  return (
    <>
      <div style={{
        background: 'var(--surface)', border: '2px solid rgba(15, 110, 55, 0.85)',
        borderRadius: 14, padding: '18px 20px', marginBottom: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="2" width="14" height="13" rx="2" stroke="#4285F4" strokeWidth="1.4" fill="none"/>
            <path d="M1 6h14" stroke="#4285F4" strokeWidth="1.4"/>
            <rect x="4" y="0.5" width="1.5" height="3" rx="0.75" fill="#4285F4"/>
            <rect x="10.5" y="0.5" width="1.5" height="3" rx="0.75" fill="#4285F4"/>
          </svg>
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700,
                          color: 'var(--text)', letterSpacing: '0.01em' }}>
            Upcoming Events
          </span>
          {events.length > 0 && (
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              fontFamily: 'Sora, sans-serif', color: '#4285F4',
              background: 'rgba(66,133,244,0.1)', borderRadius: 10,
              padding: '2px 8px',
            }}>
              {events.length}
            </span>
          )}
        </div>

        {events.length === 0 ? (
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text-muted)',
                       margin: 0, textAlign: 'center', padding: '10px 0' }}>
            No events in the next 7 days.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {events.map(ev => (
              <GCalEventChip key={ev.id} event={ev} onClick={setActiveEvent} />
            ))}
          </div>
        )}
      </div>

      <EventModal event={activeEvent} onClose={() => setActiveEvent(null)} />
    </>
  )
}

// ─── Dashboard tab content ────────────────────────────────────────────────────
function DashboardTab({
  greetingName,
  classes, weekData, monthAssignments, monthIndicators,
  calYear, calMonth, onCalPrev, onCalNext,
  syllabusStatus, syllabusData, rolledOverByClass, canvasStatus,
  selectedDate, onSelectDate,
  dayData,
  onChipClick, onToggleComplete,
  todayTasks, onToggleDayTask, onAddDayTask, onDeleteDayTask,
  onDayNoteS, onDayTaskAdd, onDayTaskComplete, onDayTaskDelete,
  onDifficultyRate,
  gcalEvents, gcalConnected, onGcalDisconnect,
}) {
  const user      = getUser()
  const today     = new Date()
  const canvasCount = Object.values(weekData).flat().filter(a => a.canvasAssignmentId).length
  const dateStr   = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const [checkinSummary,  setCheckinSummary]  = useState(null)
  const [checkinLoading,  setCheckinLoading]  = useState(false)
  const [checkinVisible,  setCheckinVisible]  = useState(false)
  const h = { Authorization: `Bearer ${getToken()}` }

  async function handleOnTrack() {
    setCheckinLoading(true)
    setCheckinVisible(true)
    setCheckinSummary(null)
    try {
      const data = await fetch('/api/checkin/ontrack', {
        method: 'POST', headers: h,
      }).then(r => r.json())
      setCheckinSummary(data.summary || 'Unable to generate summary.')
    } catch (e) {
      setCheckinSummary('Could not connect to the server. Please try again.')
    } finally {
      setCheckinLoading(false)
    }
  }

  return (
    <div style={{ padding: 19 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: checkinVisible ? 12 : 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, margin: 0, fontFamily: 'Playfair Display, serif' }}>
            {getGreeting()}, {greetingName || user?.name?.split(' ')[0]}.
          </h2>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
            {dateStr} · {canvasCount} assignment{canvasCount !== 1 ? 's' : ''} pulled from Canvas this week
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          {/* Am I on track button */}
          <button
            onClick={handleOnTrack}
            disabled={checkinLoading}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid rgba(175, 120, 15, 0.85)', background: 'transparent',
              color: ACCENT, fontFamily: 'Sora, sans-serif', fontSize: 13,
              fontWeight: 500, cursor: checkinLoading ? 'default' : 'pointer',
              opacity: checkinLoading ? 0.6 : 1,
            }}
          >
            {checkinLoading ? 'Checking in…' : 'Am I on track?'}
          </button>
        </div>
      </div>

      {/* On-track card */}
      {checkinVisible && (
        <div style={{
          marginBottom: 22,
          borderLeft: `3px solid ${ACCENT}`,
          padding: '14px 18px',
          background: 'var(--surface)',
          borderRadius: 10,
          border: `1px solid var(--navi-border)`,
          borderLeftColor: ACCENT,
          borderLeftWidth: 3,
          position: 'relative',
        }}>
          {checkinLoading ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontStyle: 'italic' }}>
              Checking in…
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif', lineHeight: 1.6 }}>
              {checkinSummary}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>Updated just now</span>
            <button
              onClick={() => setCheckinVisible(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1, padding: '0 2px' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Connect Your Tools */}
      <style>{`
        @keyframes gcal-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(46,158,104,0.45); }
          50%       { box-shadow: 0 0 0 7px rgba(46,158,104,0); }
        }
      `}</style>
      <ConnectToolsSection gcalConnected={gcalConnected} onGcalDisconnect={onGcalDisconnect} token={getToken()} />

      {/* Two-column main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 17, alignItems: 'start' }}>

        {/* Left column */}
        <div>
          {/* Calendar + day panel */}
          {/* Calendar always full-width; DayPanel floats as an overlay */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <CalendarCard
              year={calYear} month={calMonth}
              assignments={monthAssignments}
              indicators={monthIndicators}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              onPrev={onCalPrev} onNext={onCalNext}
              gcalEvents={gcalEvents}
            />
            {selectedDate && dayData && (
              <div style={{ position: 'absolute', top: 10, right: 10, width: 275, maxWidth: 275, zIndex: 50 }}>
                <DayPanel
                  date={selectedDate}
                  data={dayData}
                  onClose={() => onSelectDate(selectedDate)}
                  onNoteSave={onDayNoteS}
                  onTaskAdd={onDayTaskAdd}
                  onTaskComplete={onDayTaskComplete}
                  onTaskDelete={onDayTaskDelete}
                  gcalEventsForDay={gcalEvents.filter(ev => {
                    const d = new Date(ev.startTime)
                    return dateToStr(d) === selectedDate
                  })}
                />
              </div>
            )}
          </div>

          <WeekStrip
            weekData={weekData}
            selectedDate={selectedDate}
            onChipClick={onChipClick}
            onDayClick={onSelectDate}
            onDifficultyRate={onDifficultyRate}
            gcalEvents={gcalEvents}
          />
          <ProgressGrid classes={classes} weekData={weekData} />
        </div>

        {/* Right column */}
        <div>
          <TodaysFocusCard
            weekData={weekData}
            todayTasks={todayTasks}
            onToggleComplete={onToggleComplete}
            onToggleDayTask={onToggleDayTask}
            onAddDayTask={onAddDayTask}
            onDeleteDayTask={onDeleteDayTask}
          />
          <GoogleCalendarCard events={gcalEvents} connected={gcalConnected} />
          <SyllabusStatusCard classes={classes} syllabusStatus={syllabusStatus} />
          <OfficeHoursReminder
            classes={classes}
            syllabusData={syllabusData}
            rolledOverByClass={rolledOverByClass}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Performance tab ─────────────────────────────────────────────────────────
function SpotlightCard({ type, cls }) {
  const color = CLASS_COLORS[cls.colorIndex] || ACCENT
  const isStrongest = type === 'strongest'
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--navi-border)',
      borderLeft: `4px solid ${color}`, borderRadius: 12, padding: '18px 20px',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
        {isStrongest ? 'Strongest Class' : 'Needs Attention'}
      </p>
      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color, fontFamily: 'Sora, sans-serif' }}>{cls.name}</p>
      <p style={{ margin: '0 0 8px', fontSize: 34, fontWeight: 700, color, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>
        {cls.letterGrade || '—'}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', lineHeight: 1.4 }}>
        {isStrongest ? 'Keep it up.' : 'A little extra time here goes a long way.'}
      </p>
    </div>
  )
}

function PerformanceTab() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const h = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    fetch('/api/performance', { headers: h })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14 }}>Loading performance data…</p>
      </div>
    )
  }

  if (!data || !data.classes || data.classes.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14 }}>No classes found. Add classes to see your performance.</p>
      </div>
    )
  }

  const { classes, weekMinutesByClass } = data
  const withGrades = classes.filter(c => c.currentGrade != null)
  const sorted = [...withGrades].sort((a, b) => b.currentGrade - a.currentGrade)
  const strongest = sorted[0]
  const weakest   = sorted[sorted.length - 1]

  function getTrajectory(lastGraded) {
    if (!lastGraded || lastGraded.length < 2) return 'stable'
    const scores = lastGraded.map(a => (a.pointsEarned / a.pointsPossible) * 100)
    const half = Math.floor(scores.length / 2)
    const avg  = arr => arr.reduce((s, v) => s + v, 0) / arr.length
    const diff = avg(scores.slice(half)) - avg(scores.slice(0, half))
    if (diff > 3)  return 'up'
    if (diff < -3) return 'down'
    return 'stable'
  }

  function getTrajectoryText(traj, lastGraded) {
    if (!lastGraded || lastGraded.length < 2) return 'Not enough data yet.'
    const scores = lastGraded.map(a => (a.pointsEarned / a.pointsPossible) * 100)
    const half = Math.floor(scores.length / 2)
    const avg  = arr => arr.reduce((s, v) => s + v, 0) / arr.length
    const diff = Math.abs(Math.round(avg(scores.slice(half)) - avg(scores.slice(0, half))))
    if (traj === 'up')   return `Up about ${diff} point${diff !== 1 ? 's' : ''} over your last ${lastGraded.length} assignments.`
    if (traj === 'down') return `Down about ${diff} point${diff !== 1 ? 's' : ''} recently.`
    return 'Holding steady.'
  }

  function getNeededScore(cls) {
    const { currentGrade, lastGradedAssignments: graded, remainingAssignments: remaining } = cls
    if (!remaining || remaining.length === 0) return null
    const grade = currentGrade || 0
    let targetPct, targetLabel
    if (grade >= 80)      { targetPct = 90; targetLabel = 'A' }
    else if (grade >= 70) { targetPct = 80; targetLabel = 'B' }
    else                  { targetPct = 70; targetLabel = 'C' }

    const totalEarned   = graded.reduce((s, a) => s + (a.pointsEarned  || 0), 0)
    const totalPossible = graded.reduce((s, a) => s + (a.pointsPossible || 0), 0)
    const remPossible   = remaining.reduce((s, a) => s + (a.pointsPossible || 0), 0)

    if (totalPossible === 0 || remPossible === 0) return null

    const needed    = ((targetPct / 100) * (totalPossible + remPossible) - totalEarned) / remPossible
    const neededPct = Math.round(needed * 100)

    if (neededPct > 100)  return { impossible: true, targetLabel }
    if (neededPct <= 0)   return { alreadyThere: true, targetLabel }
    return { neededPct, targetLabel }
  }

  function getStudyInsight(classId, currentGrade) {
    const minutes = weekMinutesByClass[classId] || 0
    const grade   = currentGrade || 0
    if (minutes >= 120 && grade >= 85) return "Your effort is showing."
    if (minutes >= 90  && grade < 75)  return "You've put in solid time here — keep that momentum going."
    if (minutes < 30   && grade < 75)  return "A few extra sessions this week could make a real difference."
    if (minutes >= 60  && grade >= 75) return "Keep up the consistent work."
    if (minutes === 0  && grade < 80)  return "Even one focused session this week can shift your momentum."
    return "Stay consistent and you'll keep moving forward."
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 26, margin: '0 0 4px', fontFamily: 'Playfair Display, serif' }}>Performance</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
        How you're doing across all your classes.
      </p>

      {/* Spotlight cards */}
      {withGrades.length >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {strongest && <SpotlightCard type="strongest" cls={strongest} />}
          {weakest && weakest.id !== strongest?.id && <SpotlightCard type="weakest" cls={weakest} />}
        </div>
      )}

      {/* Per-class cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {classes.map(cls => {
          const color      = CLASS_COLORS[cls.colorIndex] || ACCENT
          const pct        = cls.currentGrade || 0
          const traj       = getTrajectory(cls.lastGradedAssignments)
          const trajText   = getTrajectoryText(traj, cls.lastGradedAssignments)
          const needed     = getNeededScore(cls)
          const weekMin    = weekMinutesByClass[cls.id] || 0
          const insight    = getStudyInsight(cls.id, cls.currentGrade)
          const trajColor  = traj === 'up' ? '#2E9E68' : traj === 'down' ? '#C17B5A' : 'var(--text-muted)'
          const trajSymbol = traj === 'up' ? '↑' : traj === 'down' ? '↓' : '—'

          return (
            <div key={cls.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
              <h3 style={{ fontSize: 16, margin: '0 0 12px', color, fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                {cls.name}
              </h3>

              {/* Grade */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 38, fontWeight: 700, fontFamily: 'Sora, sans-serif', color, lineHeight: 1 }}>
                  {cls.letterGrade || '—'}
                </span>
                <span style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                  {cls.currentGrade != null ? `${Math.round(cls.currentGrade)}%` : 'No grade yet'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, background: 'var(--navi-border)', borderRadius: 99, overflow: 'hidden', marginBottom: 18 }}>
                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
              </div>

              {/* Trajectory */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
                  Grade Trend
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, color: trajColor, fontWeight: 700, lineHeight: 1 }}>{trajSymbol}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif', lineHeight: 1.4 }}>{trajText}</span>
                </div>
              </div>

              {/* What you need */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
                  What You Need
                </p>
                <div style={{ background: 'var(--navi-bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--navi-border)' }}>
                  {needed === null ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                      No graded assignments to calculate from yet.
                    </p>
                  ) : needed.impossible ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                      Focus on doing your best on remaining work.
                    </p>
                  ) : needed.alreadyThere ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>
                      You're already on track for a <strong>{needed.targetLabel}</strong>. Keep it up.
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>
                      Averaging <strong>{needed.neededPct}%</strong> on remaining work would get you to a <strong>{needed.targetLabel}</strong>.
                    </p>
                  )}
                </div>
              </div>

              {/* Study insight */}
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Sora, sans-serif' }}>
                  Study Insight
                </p>
                <p style={{ margin: '0 0 3px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                  {weekMin > 0 ? `${weekMin} min studied this week` : 'No study sessions logged this week'}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif', lineHeight: 1.5 }}>{insight}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Study Plan — StudyPlanUnlocked ───────────────────────────────────────────
function StudyPlanUnlocked({ classes, canvasStatus, syllabusStatus, lastSyncedAt }) {
  const navigate = useNavigate()
  const [plan,          setPlan]          = useState(null)
  const [loadingPlan,   setLoadingPlan]   = useState(true)
  const [generating,    setGenerating]    = useState(false)
  const [genError,      setGenError]      = useState(null)
  const [stale,         setStale]         = useState(false)
  const [rolledOver,    setRolledOver]    = useState([])
  const [todayMinutes,  setTodayMinutes]  = useState(0)
  const [activeTimer,   setActiveTimer]   = useState(null)
  // activeTimer shape: { taskId, mode: 'free'|'focus', phase: 'study'|'break'|'done',
  //   elapsed: seconds, countdown: seconds, round: number, totalRounds: number,
  //   studyDuration: seconds, breakDuration: seconds, isPaused: boolean }
  const [openTimerTaskId, setOpenTimerTaskId] = useState(null) // which task has timer panel open
  const [focusSetup,    setFocusSetup]    = useState({ studyMin: 25, breakMin: 5, rounds: 3, customStudy: '', customBreak: '', customRounds: '' })

  const timerRef = useRef(null)
  const h = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    loadPlan()
    loadRolledOver()
    loadTodayMinutes()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function loadPlan() {
    try {
      const data = await fetch('/api/studyplan', { headers: h }).then(r => r.json())
      if (Array.isArray(data) && data.length > 0) {
        setPlan(data)
        if (lastSyncedAt && data[0]?.createdAt) {
          if (new Date(lastSyncedAt).getTime() > new Date(data[0].createdAt).getTime()) setStale(true)
        }
      } else {
        setPlan([])
      }
    } catch (e) {
      console.error('[StudyPlan] Load error:', e)
      setPlan([])
    } finally {
      setLoadingPlan(false)
    }
  }

  async function loadRolledOver() {
    try {
      const data = await fetch('/api/studyplan/rollover', { headers: h }).then(r => r.json())
      if (Array.isArray(data)) setRolledOver(data)
    } catch (e) {
      console.error('[StudyPlan] Rollover load error:', e)
    }
  }

  async function loadTodayMinutes() {
    try {
      const data = await fetch('/api/studyplan/today-minutes', { headers: h }).then(r => r.json())
      if (typeof data.totalMinutes === 'number') setTodayMinutes(data.totalMinutes)
    } catch (e) {
      console.error('[StudyPlan] Today minutes load error:', e)
    }
  }

  async function saveSession(taskId, studiedMinutes, sessionType) {
    try {
      await fetch('/api/studyplan/session', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskId || null, studiedMinutes, sessionType }),
      })
      loadTodayMinutes()
    } catch (e) {
      console.error('[StudyPlan] Save session error:', e)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError(null)
    try {
      const data = await fetch('/api/studyplan/generate', {
        method: 'POST', headers: h,
      }).then(r => r.json())
      if (data.error) throw new Error(data.error)
      setPlan(data)
      setStale(false)
      loadRolledOver()
    } catch (e) {
      console.error('[StudyPlan] Generate error:', e)
      setGenError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggleTask(taskId) {
    const res = await fetch(`/api/studyplan/task/${taskId}/complete`, {
      method: 'PATCH', headers: h,
    }).then(r => r.json())
    setPlan(prev => prev.map(day => ({
      ...day,
      tasks: day.tasks.map(t => t.id === taskId ? { ...t, isCompleted: res.isCompleted } : t),
    })))
    // Also remove from rolledOver if completed
    if (res.isCompleted) {
      setRolledOver(prev => prev.filter(t => t.taskId !== taskId))
    }
  }

  async function handlePushTomorrow(taskId) {
    try {
      await fetch(`/api/studyplan/task/${taskId}/push-tomorrow`, {
        method: 'PATCH', headers: h,
      })
      setRolledOver(prev => prev.filter(t => t.taskId !== taskId))
    } catch (e) {
      console.error('[StudyPlan] Push tomorrow error:', e)
    }
  }

  // ── Timer functions ──────────────────────────────────────────────────────────
  function stopCurrentTimer(save = true) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (save && activeTimer) {
      const mins = Math.max(1, Math.ceil(activeTimer.elapsed / 60))
      saveSession(activeTimer.taskId, mins, activeTimer.mode)
    }
    setActiveTimer(null)
  }

  function startFreeTimer(taskId) {
    stopCurrentTimer(true)
    setActiveTimer({ taskId, mode: 'free', phase: 'study', elapsed: 0, isPaused: false, countdown: 0, round: 1, totalRounds: 1, studyDuration: 0, breakDuration: 0 })
    timerRef.current = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || prev.isPaused) return prev
        return { ...prev, elapsed: prev.elapsed + 1 }
      })
    }, 1000)
  }

  function startFocusSession(taskId, studyDuration, breakDuration, totalRounds) {
    stopCurrentTimer(true)
    const timer = {
      taskId, mode: 'focus', phase: 'study',
      elapsed: 0, countdown: studyDuration,
      round: 1, totalRounds,
      studyDuration, breakDuration,
      isPaused: false,
    }
    setActiveTimer(timer)
    timerRef.current = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || prev.isPaused) return prev
        if (prev.mode === 'free') return { ...prev, elapsed: prev.elapsed + 1 }

        // Focus session tick
        const newCountdown = prev.countdown - 1
        const newElapsed   = prev.phase === 'study' ? prev.elapsed + 1 : prev.elapsed

        if (newCountdown <= 0) {
          // Phase transition
          if (prev.phase === 'study') {
            // Start break (or done if infinite = -1 and we just finished, but we track rounds)
            const isLastRound = prev.totalRounds !== -1 && prev.round >= prev.totalRounds
            if (isLastRound) {
              // No more rounds — done
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
              const mins = Math.max(1, Math.ceil(newElapsed / 60))
              // async save
              fetch('/api/studyplan/session', {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: prev.taskId || null, studiedMinutes: mins, sessionType: 'focus' }),
              }).then(() => {
                fetch('/api/studyplan/today-minutes', { headers: { Authorization: `Bearer ${getToken()}` } })
                  .then(r => r.json()).then(d => { if (typeof d.totalMinutes === 'number') setTodayMinutes(d.totalMinutes) })
              }).catch(() => {})
              return { ...prev, phase: 'done', elapsed: newElapsed, countdown: 0 }
            }
            return { ...prev, phase: 'break', countdown: prev.breakDuration, elapsed: newElapsed }
          } else {
            // Break ended — next round
            return { ...prev, phase: 'study', countdown: prev.studyDuration, round: prev.round + 1, elapsed: newElapsed }
          }
        }

        return { ...prev, countdown: newCountdown, elapsed: newElapsed }
      })
    }, 1000)
  }

  function togglePause() {
    setActiveTimer(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null)
  }

  function handleStopTimer() {
    stopCurrentTimer(true)
    setOpenTimerTaskId(null)
  }

  function handleOpenTimer(taskId) {
    if (openTimerTaskId === taskId) {
      setOpenTimerTaskId(null)
      return
    }
    // Stop existing timer if for a different task
    if (activeTimer && activeTimer.taskId !== taskId) {
      stopCurrentTimer(true)
    }
    setOpenTimerTaskId(taskId)
    setFocusSetup({ studyMin: 25, breakMin: 5, rounds: 3, customStudy: '', customBreak: '', customRounds: '' })
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loadingPlan) {
    return (
      <div style={{ padding: '60px 24px 24px', display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14 }}>Loading study plan…</p>
      </div>
    )
  }

  if (generating) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🧠</div>
        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, color: 'var(--text)', fontWeight: 500 }}>Navi is building your plan…</p>
        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>This usually takes 10–20 seconds</p>
      </div>
    )
  }

  // ── Setup screen (no plan yet) ───────────────────────────────────────────────
  if (Array.isArray(plan) && plan.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <h2 style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', margin: '0 0 10px' }}>Let's build your study plan</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', lineHeight: 1.6, margin: '0 0 28px' }}>
          Navi builds your plan using your Canvas assignments and syllabus. The more complete your syllabus uploads, the more tailored your plan becomes.
        </p>

        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          {/* Canvas row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--navi-border)', marginBottom: 14 }}>
            {canvasStatus.isConnected ? (
              <>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>Assignments synced from Canvas</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)' }}>Canvas not connected</span>
                </div>
                <button style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: ACCENT, border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                  Sync Canvas now
                </button>
              </>
            )}
          </div>

          {/* Per-class rows */}
          {classes.map((cls, i) => {
            const has = syllabusStatus[cls.id]
            return (
              <div key={cls.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: i < classes.length - 1 ? 12 : 0,
                marginBottom: i < classes.length - 1 ? 12 : 0,
                borderBottom: i < classes.length - 1 ? '1px solid var(--navi-border)' : 'none',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: CLASS_COLORS[cls.colorIndex] || ACCENT, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{cls.name}</span>
                {has ? (
                  <>
                    <span style={{ fontSize: 14 }}>✅</span>
                    <span style={{ fontSize: 11.5, color: GREEN, fontFamily: 'Sora, sans-serif', fontWeight: 500 }}>Syllabus uploaded</span>
                  </>
                ) : (
                  <button onClick={() => navigate('/syllabi')} style={{ fontSize: 11.5, color: '#C8952A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600, textDecoration: 'underline', padding: 0 }}>
                    Upload syllabus
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', marginBottom: 20, lineHeight: 1.5 }}>
          You can still build a plan without all syllabi — it just gets smarter as you add more.
        </p>

        {genError && (
          <p style={{ fontSize: 12, color: '#D4622A', fontFamily: 'Sora, sans-serif', marginBottom: 12 }}>{genError}</p>
        )}

        <button
          onClick={handleGenerate}
          style={{
            padding: '12px 28px', borderRadius: 9, border: 'none',
            background: ACCENT, color: '#fff',
            fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            width: '100%',
          }}
        >
          Build My Study Plan
        </button>
      </div>
    )
  }

  // ── Plan view ─────────────────────────────────────────────────────────────────
  const classMap = {}
  classes.forEach(c => { classMap[c.id] = c })

  const sortedDays = [...(plan || [])].sort((a, b) => a.date.localeCompare(b.date))

  function formatPlanDate(str) {
    const [y, m, d] = str.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  // Exam countdowns: check assignments in plan days + classes
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const examKeyword = /\b(exam|midterm|final|test|quiz)\b/i

  // Build map: date -> list of { className, classId, color, daysUntil }
  const examBanners = {}
  for (const cls of classes) {
    const color = CLASS_COLORS[cls.colorIndex] || ACCENT
    // Check all assignments across all plan days
    if (plan) {
      for (const day of plan) {
        for (const task of day.tasks) {
          if (task.classId === cls.id && examKeyword.test(task.description)) {
            // Treat plan task as exam if keyword in description
            const dayDate = parseDateStr(day.date)
            const daysUntil = Math.round((dayDate - today) / 86400000)
            if (daysUntil >= 0 && daysUntil <= 5) {
              if (!examBanners[day.date]) examBanners[day.date] = []
              examBanners[day.date].push({ className: cls.name, classId: cls.id, color, daysUntil })
            }
          }
        }
      }
    }
  }
  // Also check all assignments in classes data loaded from weekData (passed via classes prop which may have them)
  // We'll rely on what's available from plan tasks since weekData/monthAssignments aren't passed here

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      {/* Stale data banner */}
      {stale && (
        <div style={{
          background: 'rgba(58,123,213,0.07)', border: '1px solid rgba(58,123,213,0.2)',
          borderRadius: 9, padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: ACCENT, fontFamily: 'Sora, sans-serif' }}>
            Your Canvas assignments have been updated. Regenerate for a fresh plan?
          </p>
          <button onClick={handleGenerate} style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: ACCENT, border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Sora, sans-serif', flexShrink: 0 }}>
            Regenerate
          </button>
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', margin: 0 }}>Study Plan</h2>
          <span style={{
            fontSize: 11, fontWeight: 500, color: GREEN,
            background: 'rgba(46,158,104,0.1)', border: '1px solid rgba(46,158,104,0.2)',
            borderRadius: 99, padding: '3px 10px', fontFamily: 'Sora, sans-serif',
          }}>
            Built from your Canvas assignments and syllabus data
          </span>
        </div>
        <button onClick={handleGenerate} style={{
          fontSize: 12, color: 'var(--text-muted)', background: 'none',
          border: '1px solid var(--navi-border)', borderRadius: 7, padding: '5px 12px',
          cursor: 'pointer', fontFamily: 'Sora, sans-serif',
        }}>
          ↺ Regenerate plan
        </button>
      </div>

      {/* Today's minutes */}
      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
        ⏱ {todayMinutes} minute{todayMinutes !== 1 ? 's' : ''} studied today
      </p>

      {genError && (
        <p style={{ fontSize: 12, color: '#D4622A', fontFamily: 'Sora, sans-serif', marginBottom: 12 }}>{genError}</p>
      )}

      {/* Carried forward section */}
      {rolledOver.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Sora, sans-serif' }}>
            Carried forward
          </p>
          <div className="card" style={{ padding: '4px 0' }}>
            {rolledOver.map((item, idx) => {
              const cls = classMap[item.classId]
              const color = cls ? (CLASS_COLORS[cls.colorIndex] || ACCENT) : ACCENT
              return (
                <div key={item.taskId} style={{
                  padding: '12px 16px',
                  borderTop: idx > 0 ? '1px solid var(--navi-border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                      {cls?.name || 'Unknown'} · {item.estimatedMinutes} min · from {item.originalDate}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePushTomorrow(item.taskId)}
                    style={{
                      fontSize: 11, color: 'var(--text-muted)', background: 'none',
                      border: '1px solid var(--navi-border)', borderRadius: 6, padding: '3px 8px',
                      cursor: 'pointer', fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    Push to tomorrow →
                  </button>
                  <button
                    onClick={() => handleToggleTask(item.taskId)}
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                      background: 'transparent', border: '1.5px solid var(--navi-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Mark complete"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Days */}
      <div className="card" style={{ padding: '4px 0' }}>
        {sortedDays.map((day, di) => (
          <div key={day.id} style={{
            borderTop: di > 0 ? '1px solid var(--navi-border)' : 'none',
          }}>
            {/* Exam banners for this day */}
            {(examBanners[day.date] || []).map((banner, bi) => (
              <div key={bi} style={{
                margin: '8px 20px 0',
                padding: '5px 10px',
                borderRadius: 7,
                background: `color-mix(in srgb, ${banner.color} 10%, transparent)`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 12 }}>📅</span>
                <span style={{ fontSize: 11.5, fontFamily: 'Sora, sans-serif', color: banner.color, fontWeight: 500 }}>
                  {banner.className} exam in {banner.daysUntil} day{banner.daysUntil !== 1 ? 's' : ''}
                </span>
              </div>
            ))}

            <div style={{ padding: '18px 20px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* Date label */}
              <div style={{ width: 110, flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: ACCENT, fontFamily: 'Sora, sans-serif', lineHeight: 1.4 }}>
                  {formatPlanDate(day.date)}
                </p>
              </div>

              {/* Tasks */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {day.tasks.map(task => {
                  const cls = classMap[task.classId]
                  const color = cls ? (CLASS_COLORS[cls.colorIndex] || ACCENT) : ACCENT
                  const isTimerOpen = openTimerTaskId === task.id
                  const isActiveTask = activeTimer?.taskId === task.id

                  return (
                    <div key={task.id}>
                      {/* Task row */}
                      <div
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', paddingBottom: isTimerOpen ? 8 : 0 }}
                      >
                        <span
                          onClick={() => handleToggleTask(task.id)}
                          style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }}
                        />
                        <div
                          onClick={() => handleToggleTask(task.id)}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <p style={{
                            margin: 0, fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif',
                            lineHeight: 1.45,
                            textDecoration: task.isCompleted ? 'line-through' : 'none',
                            opacity: task.isCompleted ? 0.45 : 1,
                          }}>
                            {task.description}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                            {cls?.name || 'Unknown class'}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', flexShrink: 0, paddingTop: 3 }}>
                          {task.estimatedMinutes} min
                        </p>
                        {/* Timer button */}
                        <button
                          onClick={e => { e.stopPropagation(); handleOpenTimer(task.id) }}
                          title="Start timer"
                          style={{
                            background: isTimerOpen || isActiveTask ? `color-mix(in srgb, ${ACCENT} 12%, transparent)` : 'none',
                            border: isTimerOpen || isActiveTask ? `1px solid ${ACCENT}` : '1px solid var(--navi-border)',
                            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: 14, color: isActiveTask ? ACCENT : 'var(--text-muted)',
                          }}
                        >
                          ⏱
                        </button>
                      </div>

                      {/* Timer panel */}
                      {isTimerOpen && (
                        <TimerPanel
                          task={task}
                          activeTimer={activeTimer}
                          onStartFree={() => startFreeTimer(task.id)}
                          onStartFocus={(studyDur, breakDur, rounds) => startFocusSession(task.id, studyDur, breakDur, rounds)}
                          onPause={togglePause}
                          onStop={handleStopTimer}
                          focusSetup={focusSetup}
                          setFocusSetup={setFocusSetup}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Timer Panel (inline) ─────────────────────────────────────────────────────
function TimerPanel({ task, activeTimer, onStartFree, onStartFocus, onPause, onStop, focusSetup, setFocusSetup }) {
  const [mode, setMode] = useState(activeTimer?.taskId === task.id ? activeTimer.mode : null)
  // mode: null (choose), 'free', 'focus'
  const [focusStarted, setFocusStarted] = useState(activeTimer?.taskId === task.id && activeTimer?.mode === 'focus')

  // Determine if this panel's task has an active timer
  const isActive = activeTimer?.taskId === task.id
  const timer    = isActive ? activeTimer : null

  function handleStartFocus() {
    let studyMin = focusSetup.customStudy ? parseInt(focusSetup.customStudy) : focusSetup.studyMin
    let breakMin = focusSetup.customBreak ? parseInt(focusSetup.customBreak) : focusSetup.breakMin
    let rounds   = focusSetup.customRounds ? (focusSetup.customRounds === '∞' ? -1 : parseInt(focusSetup.customRounds)) : focusSetup.rounds
    if (!studyMin || studyMin < 1) studyMin = 25
    if (!breakMin || breakMin < 1) breakMin = 5
    if (!rounds   || rounds   < 1) rounds   = 3
    setFocusStarted(true)
    onStartFocus(studyMin * 60, breakMin * 60, rounds)
  }

  // Show active timer display if this task is the active one
  if (timer) {
    const isPhaseStudy = timer.phase === 'study'
    const isDone       = timer.phase === 'done'

    return (
      <div style={{
        marginLeft: 18, marginBottom: 8, padding: '12px 14px',
        background: `color-mix(in srgb, ${ACCENT} 5%, var(--navi-bg))`,
        border: `1px solid color-mix(in srgb, ${ACCENT} 20%, var(--navi-border))`,
        borderRadius: 9,
      }}>
        {isDone ? (
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: GREEN, fontFamily: 'Sora, sans-serif' }}>
              Session complete!
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
              {Math.max(1, Math.ceil(timer.elapsed / 60))} minutes studied
            </p>
            <button onClick={onStop} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
              Done
            </button>
          </div>
        ) : timer.mode === 'free' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 20, fontFamily: 'Sora, sans-serif', fontWeight: 700, color: ACCENT, minWidth: 60 }}>
              {fmtMmSs(timer.elapsed)}
            </span>
            <button onClick={onPause} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--navi-border)', background: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>
              {timer.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={onStop} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#C1422A', color: '#fff', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
              Stop
            </button>
          </div>
        ) : (
          // Focus session active
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)', fontWeight: 500 }}>
                {isPhaseStudy ? `Round ${timer.round}${timer.totalRounds === -1 ? '' : ` of ${timer.totalRounds}`} · Study` : 'Break time!'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
                {Math.max(1, Math.ceil(timer.elapsed / 60))} min studied
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', fontWeight: 700, color: isPhaseStudy ? ACCENT : GREEN, minWidth: 70 }}>
                {fmtMmSs(timer.countdown)}
              </span>
              <button onClick={onPause} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--navi-border)', background: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>
                {timer.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={onStop} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#C1422A', color: '#fff', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                End early
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Mode selection or setup
  return (
    <div style={{
      marginLeft: 18, marginBottom: 8, padding: '12px 14px',
      background: 'var(--navi-bg)', border: '1px solid var(--navi-border)',
      borderRadius: 9,
    }}>
      {/* Mode selector */}
      {mode === null && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setMode('free'); onStartFree() }}
            style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 7, border: `1px solid ${ACCENT}`, background: 'none', color: ACCENT, cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 500 }}
          >
            Free timer
          </button>
          <button
            onClick={() => setMode('focus')}
            style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 7, border: '1px solid var(--navi-border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
          >
            Focus session
          </button>
        </div>
      )}

      {/* Focus setup */}
      {mode === 'focus' && !focusStarted && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Focus session setup</p>

          {/* Study duration */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 5px', fontSize: 11.5, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>Study duration</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {[25, 35, 45].map(m => (
                <button
                  key={m}
                  onClick={() => setFocusSetup(s => ({ ...s, studyMin: m, customStudy: '' }))}
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: `1px solid ${focusSetup.studyMin === m && !focusSetup.customStudy ? ACCENT : 'var(--navi-border)'}`, background: focusSetup.studyMin === m && !focusSetup.customStudy ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : 'none', color: focusSetup.studyMin === m && !focusSetup.customStudy ? ACCENT : 'var(--text)', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
                >{m}m</button>
              ))}
              <input
                placeholder="Custom"
                value={focusSetup.customStudy}
                onChange={e => setFocusSetup(s => ({ ...s, customStudy: e.target.value }))}
                style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: `1px solid ${focusSetup.customStudy ? ACCENT : 'var(--navi-border)'}`, fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}
              />
            </div>
          </div>

          {/* Break duration */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 5px', fontSize: 11.5, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>Break duration</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {[5, 10, 15].map(m => (
                <button
                  key={m}
                  onClick={() => setFocusSetup(s => ({ ...s, breakMin: m, customBreak: '' }))}
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: `1px solid ${focusSetup.breakMin === m && !focusSetup.customBreak ? ACCENT : 'var(--navi-border)'}`, background: focusSetup.breakMin === m && !focusSetup.customBreak ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : 'none', color: focusSetup.breakMin === m && !focusSetup.customBreak ? ACCENT : 'var(--text)', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
                >{m}m</button>
              ))}
              <input
                placeholder="Custom"
                value={focusSetup.customBreak}
                onChange={e => setFocusSetup(s => ({ ...s, customBreak: e.target.value }))}
                style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: `1px solid ${focusSetup.customBreak ? ACCENT : 'var(--navi-border)'}`, fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}
              />
            </div>
          </div>

          {/* Rounds */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 5px', fontSize: 11.5, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>Rounds</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {[2, 3, 4].map(r => (
                <button
                  key={r}
                  onClick={() => setFocusSetup(s => ({ ...s, rounds: r, customRounds: '' }))}
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: `1px solid ${focusSetup.rounds === r && !focusSetup.customRounds ? ACCENT : 'var(--navi-border)'}`, background: focusSetup.rounds === r && !focusSetup.customRounds ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : 'none', color: focusSetup.rounds === r && !focusSetup.customRounds ? ACCENT : 'var(--text)', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
                >{r}</button>
              ))}
              <button
                onClick={() => setFocusSetup(s => ({ ...s, customRounds: '∞', rounds: -1 }))}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: `1px solid ${focusSetup.rounds === -1 ? ACCENT : 'var(--navi-border)'}`, background: focusSetup.rounds === -1 ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : 'none', color: focusSetup.rounds === -1 ? ACCENT : 'var(--text)', cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}
              >∞</button>
            </div>
          </div>

          <button
            onClick={handleStartFocus}
            style={{ fontSize: 13, padding: '7px 18px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          >
            Start session
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate  = useNavigate()
  const todayDate = new Date()
  const todayStr  = dateToStr(todayDate)

  const [activeTab,        setActiveTab]        = useState(0)
  const [classes,          setClasses]          = useState([])
  const [weekData,         setWeekData]         = useState({ mon: [], tue: [], wed: [], thu: [], fri: [] })
  const [monthAssignments, setMonthAssignments] = useState([])
  const [monthIndicators,  setMonthIndicators]  = useState([])
  const [calYear,          setCalYear]          = useState(todayDate.getFullYear())
  const [calMonth,         setCalMonth]         = useState(todayDate.getMonth() + 1)
  const [syllabusStatus,   setSyllabusStatus]   = useState({})
  const [syllabusData,     setSyllabusData]     = useState({})   // classId -> parsed summarizedJSON
  const [rolledOverByClass, setRolledOverByClass] = useState({}) // classId -> count
  const [canvasStatus,     setCanvasStatus]     = useState({ isConnected: false })
  const [gcalConnected,    setGcalConnected]    = useState(false)
  const [gcalEvents,       setGcalEvents]       = useState([])
  const [notePopup,        setNotePopup]        = useState({ open: false, assignment: null })
  const [selectedDate,     setSelectedDate]     = useState(null)
  const [dayData,          setDayData]          = useState(null)
  const [todayTasks,       setTodayTasks]       = useState([])
  const [loading,          setLoading]          = useState(true)
  const [showCustomize,    setShowCustomize]    = useState(false)
  const [greetingName,     setGreetingName]     = useState('')

  useEffect(() => {
    if (!isLoggedIn())           { navigate('/login');      return }
    const u = getUser()
    if (u && !u.onboardingComplete) { navigate('/onboarding'); return }
    loadAll()
  }, [])

  useEffect(() => {
    if (!isLoggedIn()) return
    loadMonthData(calYear, calMonth)
  }, [calYear, calMonth])

  useEffect(() => {
    if (!selectedDate || !isLoggedIn()) return
    loadDayData(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setSelectedDate(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function loadAll() {
    const h = { Authorization: `Bearer ${getToken()}` }
    try {
      const [cls, week, canvas, todayDay, gcalStatus] = await Promise.all([
        fetch('/api/classes',         { headers: h }).then(r => r.json()),
        fetch('/api/assignments/week', { headers: h }).then(r => r.json()),
        fetch('/api/canvas/status',   { headers: h }).then(r => r.json()),
        fetch(`/api/day/${todayStr}`, { headers: h }).then(r => r.json()),
        fetch('/api/google/status',   { headers: h }).then(r => r.json()).catch(() => ({ connected: false })),
      ])
      setClasses(Array.isArray(cls) ? cls : [])
      if (week && typeof week === 'object') setWeekData(week)
      if (canvas) setCanvasStatus(canvas)

      if (gcalStatus?.connected) {
        setGcalConnected(true)
        try {
          const events = await fetch('/api/google/events', { headers: h }).then(r => r.json())
          if (Array.isArray(events)) setGcalEvents(events)
        } catch (_) {}
      }
      setTodayTasks(Array.isArray(todayDay?.tasks) ? todayDay.tasks : [])

      if (Array.isArray(cls)) {
        const statusMap   = {}
        const dataMap     = {}
        await Promise.all(cls.map(async c => {
          const syllabi = await fetch(`/api/syllabus/${c.id}`, { headers: h }).then(r => r.json())
          const hasSyllabus = Array.isArray(syllabi) && syllabi.length > 0
          statusMap[c.id] = hasSyllabus
          if (hasSyllabus && syllabi[0].summarizedJSON) {
            try { dataMap[c.id] = JSON.parse(syllabi[0].summarizedJSON) } catch (_) {}
          }
        }))
        setSyllabusStatus(statusMap)
        setSyllabusData(dataMap)

        // Load rolled over tasks for office hours logic
        try {
          const rollover = await fetch('/api/studyplan/rollover', { headers: h }).then(r => r.json())
          if (Array.isArray(rollover)) {
            const byClass = {}
            for (const t of rollover) {
              byClass[t.classId] = (byClass[t.classId] || 0) + 1
            }
            setRolledOverByClass(byClass)
          }
        } catch (_) {}
      }
    } catch (e) {
      console.error('[Dashboard] loadAll:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleGcalDisconnect() {
    try {
      await fetch('/api/google/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      setGcalConnected(false)
      setGcalEvents([])
    } catch (e) {
      console.error('[Dashboard] gcal disconnect:', e)
    }
  }

  async function loadMonthData(year, month) {
    if (!isLoggedIn()) return
    const h = { Authorization: `Bearer ${getToken()}` }
    try {
      const [assignments, indicators] = await Promise.all([
        fetch(`/api/assignments/month?year=${year}&month=${month}`, { headers: h }).then(r => r.json()),
        fetch(`/api/day/indicators?year=${year}&month=${month}`,    { headers: h }).then(r => r.json()),
      ])
      if (Array.isArray(assignments))       setMonthAssignments(assignments)
      if (Array.isArray(indicators?.dates)) setMonthIndicators(indicators.dates)
    } catch (e) {
      console.error('[Dashboard] loadMonthData:', e)
    }
  }

  async function loadDayData(date) {
    try {
      const data = await fetch(`/api/day/${date}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then(r => r.json())
      setDayData(data)
    } catch (e) {
      console.error('[Dashboard] loadDayData:', e)
    }
  }

  function handleCalPrev() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12) }
    else setCalMonth(m => m - 1)
  }
  function handleCalNext() {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1) }
    else setCalMonth(m => m + 1)
  }

  function handleSelectDate(dateStr) {
    if (selectedDate === dateStr) setSelectedDate(null)
    else setSelectedDate(dateStr)
  }

  async function handleSaveNote(assignmentId, note) {
    await fetch(`/api/assignments/${assignmentId}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ note }),
    })
    setWeekData(prev => {
      const updated = {}
      for (const [day, list] of Object.entries(prev))
        updated[day] = list.map(a => a.id === assignmentId ? { ...a, note } : a)
      return updated
    })
    setNotePopup({ open: false, assignment: null })
  }

  async function handleToggleComplete(assignmentId) {
    await fetch(`/api/assignments/${assignmentId}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setWeekData(prev => {
      const updated = {}
      for (const [day, list] of Object.entries(prev))
        updated[day] = list.map(a => a.id === assignmentId ? { ...a, isCompleted: !a.isCompleted } : a)
      return updated
    })
  }

  async function handleDifficultyRate(assignmentId, difficulty) {
    const res = await fetch(`/api/assignments/${assignmentId}/difficulty`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ difficulty }),
    }).then(r => r.json())
    setWeekData(prev => {
      const updated = {}
      for (const [day, list] of Object.entries(prev))
        updated[day] = list.map(a => a.id === assignmentId ? { ...a, difficulty: res.difficulty } : a)
      return updated
    })
  }

  async function handleToggleDayTask(id) {
    const res = await fetch(`/api/day/task/${id}/complete`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json())
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: res.isCompleted } : t))
    if (selectedDate === todayStr) {
      setDayData(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, isCompleted: res.isCompleted } : t) } : prev)
    }
  }

  async function handleAddDayTask(title) {
    const task = await fetch(`/api/day/${todayStr}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title }),
    }).then(r => r.json())
    setTodayTasks(prev => [...prev, task])
    if (selectedDate === todayStr) {
      setDayData(prev => prev ? { ...prev, tasks: [...(prev.tasks || []), task] } : prev)
    }
    setMonthIndicators(prev => prev.includes(todayStr) ? prev : [...prev, todayStr])
  }

  async function handleDeleteDayTask(id) {
    await fetch(`/api/day/task/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
    })
    setTodayTasks(prev => prev.filter(t => t.id !== id))
    if (selectedDate === todayStr) {
      setDayData(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : prev)
    }
  }

  async function handleDayNoteS(date, note) {
    await fetch(`/api/day/${date}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ note }),
    })
    if (note.trim()) {
      setMonthIndicators(prev => prev.includes(date) ? prev : [...prev, date])
    }
  }

  async function handleDayTaskAdd(date, title) {
    const task = await fetch(`/api/day/${date}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title }),
    }).then(r => r.json())
    setDayData(prev => prev ? { ...prev, tasks: [...(prev.tasks || []), task] } : prev)
    if (date === todayStr) setTodayTasks(prev => [...prev, task])
    setMonthIndicators(prev => prev.includes(date) ? prev : [...prev, date])
  }

  async function handleDayTaskComplete(id, date) {
    const res = await fetch(`/api/day/task/${id}/complete`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json())
    setDayData(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, isCompleted: res.isCompleted } : t) } : prev)
    if (date === todayStr) setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: res.isCompleted } : t))
  }

  async function handleDayTaskDelete(id, date) {
    await fetch(`/api/day/task/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
    })
    setDayData(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : prev)
    if (date === todayStr) setTodayTasks(prev => prev.filter(t => t.id !== id))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navi-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navi-bg)' }}>
      <Sidebar classes={classes} activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ marginLeft: 210, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} onOpenCustomize={() => setShowCustomize(true)} />

        <div style={{ flex: 1 }}>
          {activeTab === 0 && (
            <DashboardTab
              greetingName={greetingName}
              classes={classes}
              weekData={weekData}
              monthAssignments={monthAssignments}
              monthIndicators={monthIndicators}
              calYear={calYear} calMonth={calMonth}
              onCalPrev={handleCalPrev} onCalNext={handleCalNext}
              syllabusStatus={syllabusStatus}
              syllabusData={syllabusData}
              rolledOverByClass={rolledOverByClass}
              canvasStatus={canvasStatus}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              dayData={dayData}
              onChipClick={a => setNotePopup({ open: true, assignment: a })}
              onToggleComplete={handleToggleComplete}
              todayTasks={todayTasks}
              onToggleDayTask={handleToggleDayTask}
              onAddDayTask={handleAddDayTask}
              onDeleteDayTask={handleDeleteDayTask}
              onDayNoteS={handleDayNoteS}
              onDayTaskAdd={handleDayTaskAdd}
              onDayTaskComplete={handleDayTaskComplete}
              onDayTaskDelete={handleDayTaskDelete}
              onDifficultyRate={handleDifficultyRate}
              gcalEvents={gcalEvents}
              gcalConnected={gcalConnected}
              onGcalDisconnect={handleGcalDisconnect}
            />
          )}
          {activeTab === 1 && <PerformanceTab />}
          {activeTab === 2 && (
            <StudyPlanUnlocked
              classes={classes}
              canvasStatus={canvasStatus}
              syllabusStatus={syllabusStatus}
              lastSyncedAt={canvasStatus.lastSyncedAt}
            />
          )}
        </div>
      </div>

      {notePopup.open && (
        <NotePopup
          assignment={notePopup.assignment}
          onClose={() => setNotePopup({ open: false, assignment: null })}
          onSave={handleSaveNote}
        />
      )}

      {/* Customize panel + floating trigger button */}
      <CustomizePanel
        open={showCustomize}
        onClose={() => setShowCustomize(false)}
        onGreetingNameChange={setGreetingName}
      />

      {/* Footer */}
      <footer style={{
        marginLeft: 0, borderTop: '1px solid var(--navi-border)',
        padding: '14px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 20,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
          © {new Date().getFullYear()} Navi
        </span>
        <Link to="/privacy" style={{
          fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif',
          textDecoration: 'none', fontWeight: 500,
        }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--navi-accent)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Privacy Policy
        </Link>
        <a href="mailto:yonathan@mynaviapp.com" style={{
          fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif',
          textDecoration: 'none', fontWeight: 500,
        }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--navi-accent)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Contact
        </a>
      </footer>
    </div>
  )
}
