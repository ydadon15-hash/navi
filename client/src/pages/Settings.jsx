import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, getUser, isLoggedIn } from '../lib/auth'

const ACCENT      = '#3A7BD5'
const TERRACOTTA  = '#C17B5A'
const GREEN       = '#2E9E68'
const CLASS_COLORS = { 1: '#3A7BD5', 2: '#D4622A', 3: '#2E9E68', 4: '#8052C8' }

function Sidebar({ activeSection, onSection }) {
  const navigate = useNavigate()
  const navItems = [
    { label: 'Dashboard',   action: () => navigate('/dashboard') },
    { label: 'Performance', action: () => navigate('/dashboard') },
    { label: 'Study Plan',  action: () => navigate('/dashboard') },
    { label: 'Syllabus',    action: () => navigate('/syllabi') },
    { label: 'Reminders',   disabled: true },
    { label: 'Settings',    active: true },
  ]

  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, width: 210, height: '100vh',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto',
    }}>
      <div style={{ padding: '24px 20px 20px' }}>
        <h2 style={{ fontSize: 22, margin: 0, fontFamily: 'Playfair Display, serif', color: 'var(--text)' }}>
          Navi<span style={{ color: ACCENT }}>.</span>
        </h2>
      </div>
      <div style={{ padding: '0 10px' }}>
        {navItems.map((item, i) => (
          <button key={i}
            onClick={() => !item.disabled && item.action && item.action()}
            disabled={!!item.disabled}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', marginBottom: 2, borderRadius: 8, border: 'none',
              cursor: item.disabled ? 'default' : 'pointer',
              background: item.active ? `color-mix(in srgb, ${ACCENT} 8%, transparent)` : 'transparent',
              textAlign: 'left', opacity: item.disabled ? 0.4 : 1,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: item.active ? ACCENT : 'var(--border)',
            }} />
            <span style={{
              flex: 1, fontSize: 13, fontFamily: 'Sora, sans-serif',
              color: item.active ? ACCENT : 'var(--text)',
              fontWeight: item.active ? 600 : 400,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '32px 0' }} />
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif', color: 'var(--text)', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
      {children}
    </h3>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 38, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: checked ? ACCENT : 'var(--border)',
        position: 'relative', flexShrink: 0, transition: 'background 200ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 19 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 200ms',
      }} />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings]     = useState(null)
  const [loading,  setLoading]      = useState(true)

  // Profile
  const [name,        setName]        = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameSaved,   setNameSaved]   = useState(false)
  const nameRef = useRef()

  // Share
  const [copied,      setCopied]      = useState(false)

  // Delete account
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting,    setDeleting]    = useState(false)

  const h = { Authorization: `Bearer ${getToken()}` }
  const hj = { ...h, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    fetch('/api/settings', { headers: h })
      .then(r => r.json())
      .then(d => { setSettings(d); setName(d.name); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (editingName) nameRef.current?.focus()
  }, [editingName])

  async function saveName() {
    if (!name.trim() || name.trim() === settings.name) { setEditingName(false); return }
    const res = await fetch('/api/settings/profile', { method: 'PATCH', headers: hj, body: JSON.stringify({ name }) })
    const d   = await res.json()
    if (d.name) {
      setSettings(s => ({ ...s, name: d.name }))
      // update localStorage
      const u = JSON.parse(localStorage.getItem('bp_user') || '{}')
      localStorage.setItem('bp_user', JSON.stringify({ ...u, name: d.name }))
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    }
    setEditingName(false)
  }

  async function enableSharing() {
    const res = await fetch('/api/settings/share/enable', { method: 'POST', headers: h })
    const d   = await res.json()
    setSettings(s => ({ ...s, shareToken: d.shareToken, sharingEnabled: true }))
  }

  async function disableSharing() {
    await fetch('/api/settings/share/disable', { method: 'POST', headers: h })
    setSettings(s => ({ ...s, sharingEnabled: false }))
  }

  async function regenerateLink() {
    const res = await fetch('/api/settings/share/regenerate', { method: 'POST', headers: h })
    const d   = await res.json()
    setSettings(s => ({ ...s, shareToken: d.shareToken }))
  }

  async function saveNotificationPref(key, val) {
    const prefs = { ...settings.notificationPreferences, [key]: val }
    setSettings(s => ({ ...s, notificationPreferences: prefs }))
    await fetch('/api/settings/notifications', { method: 'PATCH', headers: hj, body: JSON.stringify(prefs) })
  }

  async function deleteAccount() {
    if (deleteInput !== 'delete my account') return
    setDeleting(true)
    await fetch('/api/settings/account', { method: 'DELETE', headers: h })
    localStorage.removeItem('bp_token')
    localStorage.removeItem('bp_user')
    navigate('/')
  }

  async function handleCheckout() {
    const res = await fetch('/api/subscription/checkout', { method: 'POST', headers: h })
    const d   = await res.json()
    if (d.url) window.location.href = d.url
  }

  async function handlePortal() {
    const res = await fetch('/api/subscription/portal', { method: 'POST', headers: h })
    const d   = await res.json()
    if (d.url) window.location.href = d.url
    else alert('Billing portal not available.')
  }

  function copyLink() {
    const link = `${window.location.origin}/view/${settings.shareToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>Loading…</p>
      </div>
    )
  }

  const np = settings?.notificationPreferences || {}
  const trialDays = settings?.trialStartDate
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(settings.trialStartDate).getTime()) / 86400000))
    : 30
  const shareLink = settings?.shareToken ? `${window.location.origin}/view/${settings.shareToken}` : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: 210, padding: '40px 32px', maxWidth: 640 }}>
        <h1 style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', margin: '0 0 32px', color: 'var(--text)' }}>
          Account Settings
        </h1>

        {/* ── Profile ─────────────────────────────────────────────── */}
        <SectionTitle>Profile</SectionTitle>

        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {editingName ? (
              <input
                ref={nameRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setName(settings.name) } }}
                onBlur={saveName}
                style={{ fontSize: 15, fontFamily: 'Sora, sans-serif', padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${ACCENT}`, color: 'var(--text)', background: 'var(--surface)', outline: 'none', width: 220 }}
              />
            ) : (
              <span style={{ fontSize: 15, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{settings?.name}</span>
            )}
            {!editingName && (
              <button onClick={() => setEditingName(true)} style={{ fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', padding: 0 }}>Edit</button>
            )}
            {nameSaved && <span style={{ fontSize: 11, color: GREEN, fontFamily: 'Sora, sans-serif' }}>Saved</span>}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</p>
          <span style={{ fontSize: 15, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{settings?.email}</span>
        </div>

        <Divider />

        {/* ── Subscription ──────────────────────────────────────────── */}
        <SectionTitle>Subscription</SectionTitle>

        {settings?.subscriptionTier === 'free' || settings?.subscriptionTier === undefined ? (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontFamily: 'Sora, sans-serif', color: 'var(--text)', fontWeight: 500 }}>
              Free Trial — <span style={{ color: ACCENT }}>{trialDays} day{trialDays !== 1 ? 's' : ''} remaining</span>
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>
              Upgrade to keep access after your trial ends.{' '}
              <span
                onClick={handleCheckout}
                style={{ color: ACCENT, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Sora, sans-serif' }}
              >
                Upgrade now
              </span>
            </p>
            <button
              onClick={handleCheckout}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Upgrade to Navi — $7/mo
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontFamily: 'Sora, sans-serif', color: 'var(--text)', fontWeight: 500 }}>
              Navi — $7 / month
            </p>
            <button
              onClick={handlePortal}
              style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid var(--border)`, background: 'none', color: 'var(--text)', fontFamily: 'Sora, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              Manage billing
            </button>
          </div>
        )}

        <Divider />

        {/* ── Share Dashboard ───────────────────────────────────────── */}
        <SectionTitle>Share Dashboard</SectionTitle>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontFamily: 'Sora, sans-serif', color: 'var(--text)', fontWeight: 500 }}>Enable shared view</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>Let a parent or advisor view your dashboard</p>
          </div>
          <Toggle
            checked={settings?.sharingEnabled || false}
            onChange={val => val ? enableSharing() : disableSharing()}
          />
        </div>

        {settings?.sharingEnabled && settings?.shareToken && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Sora, sans-serif' }}>
              Shareable link
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontFamily: 'Sora, sans-serif', color: 'var(--text)', wordBreak: 'break-all', flex: 1 }}>
                {shareLink}
              </span>
              <button
                onClick={copyLink}
                style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${ACCENT}`, background: 'none', color: ACCENT, fontFamily: 'Sora, sans-serif', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontWeight: 500 }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={regenerateLink}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', padding: 0, textDecoration: 'underline' }}
            >
              Regenerate link
            </button>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', lineHeight: 1.5 }}>
              Your parent or advisor will only see your classes, grades, upcoming assignments, and streak. Your notes, study plan, and personal tasks are never shared.
            </p>
          </div>
        )}

        <Divider />

        {/* ── Notifications ─────────────────────────────────────────── */}
        <SectionTitle>Notifications</SectionTitle>

        {[
          { key: 'dueDateReminders',    label: 'Due date reminders' },
          { key: 'examCountdown',       label: 'Exam countdown alerts' },
          { key: 'officeHoursReminders',label: 'Office hours reminders' },
          { key: 'weeklySummary',       label: 'Weekly summary' },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{label}</span>
            <Toggle
              checked={np[key] !== false}
              onChange={val => saveNotificationPref(key, val)}
            />
          </div>
        ))}

        <Divider />

        {/* ── Danger Zone ───────────────────────────────────────────── */}
        <SectionTitle>Danger Zone</SectionTitle>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'none', color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Delete account
          </button>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, fontFamily: 'Sora, sans-serif', color: 'var(--text)', lineHeight: 1.5 }}>
              This will permanently delete all your data. Type <strong>delete my account</strong> to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="delete my account"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 7,
                border: '1.5px solid var(--border)', fontFamily: 'Sora, sans-serif', fontSize: 13,
                color: 'var(--text)', background: 'var(--bg)', outline: 'none', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowDelete(false); setDeleteInput('') }}
                style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', fontFamily: 'Sora, sans-serif', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteInput !== 'delete my account' || deleting}
                style={{
                  padding: '7px 16px', borderRadius: 7, border: 'none',
                  background: deleteInput === 'delete my account' ? '#C1422A' : 'var(--border)',
                  color: deleteInput === 'delete my account' ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'Sora, sans-serif', fontSize: 13, cursor: deleteInput === 'delete my account' ? 'pointer' : 'default',
                  fontWeight: 600,
                }}
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </div>
  )
}
