import { useState, useEffect } from 'react'
import { getToken } from '../lib/auth'

// ─── Preset definitions ───────────────────────────────────────────────────────
const PRESETS = [
  {
    name: 'Forest',
    bgColor: '#F5F0E8', borderColor: '#C5A028', accentColor: '#2D5A3D',
    textColor: '#26231F', textMuted: '#8C887F', surface: '#FFFFFF', surfaceSide: '#EDE8DF',
  },
  {
    name: 'Ocean',
    bgColor: '#EAF0FB', borderColor: '#4A7FD4', accentColor: '#1A4F9E',
    textColor: '#1A2942', textMuted: '#5A7090', surface: '#FFFFFF', surfaceSide: '#D8E5F5',
  },
  {
    name: 'Midnight',
    bgColor: '#1C1C1E', borderColor: '#555555', accentColor: '#A0A0A0',
    textColor: '#E8E8E8', textMuted: '#888888', surface: '#2C2C2E', surfaceSide: '#252527',
  },
  {
    name: 'Sand',
    bgColor: '#FDF3E3', borderColor: '#D4845A', accentColor: '#A0522D',
    textColor: '#3D2B1A', textMuted: '#8C6F56', surface: '#FFFFFF', surfaceSide: '#F0E6D0',
  },
  {
    name: 'Lavender',
    bgColor: '#F0EBF8', borderColor: '#9B6DD6', accentColor: '#6A3DAA',
    textColor: '#2A1E3D', textMuted: '#7B6690', surface: '#FFFFFF', surfaceSide: '#E4DCF0',
  },
  {
    name: 'Sage',
    bgColor: '#E8F5EE', borderColor: '#3A9E6B', accentColor: '#1E6B45',
    textColor: '#1A2E23', textMuted: '#567A60', surface: '#FFFFFF', surfaceSide: '#D8EDE2',
  },
]

const DEFAULTS = {
  bgColor: '#F5F0E8', borderColor: '#C5A028', accentColor: '#2D5A3D',
  borderStyle: 'solid', greetingName: '', presetName: 'Forest',
}

// ─── CSS variable helpers ─────────────────────────────────────────────────────
function applyFullPreset(preset) {
  const r = document.documentElement.style
  r.setProperty('--navi-bg',      preset.bgColor)
  r.setProperty('--surface',      preset.surface)
  r.setProperty('--surface-side', preset.surfaceSide)
  r.setProperty('--navi-border',  preset.borderColor)
  r.setProperty('--navi-accent',  preset.accentColor)
  r.setProperty('--text',         preset.textColor)
  r.setProperty('--text-muted',   preset.textMuted)
}

function applyColors({ bgColor, borderColor, accentColor }) {
  const r = document.documentElement.style
  r.setProperty('--navi-bg',     bgColor)
  r.setProperty('--navi-border', borderColor)
  r.setProperty('--navi-accent', accentColor)
}

function applyBorderStyle(style) {
  const r = document.documentElement.style
  r.setProperty('--navi-border-style', style === 'rounded' ? 'solid' : style)
  r.setProperty('--navi-card-radius',  style === 'rounded' ? '20px'  : '12px')
}

// ─── Mini dashboard preview thumbnail ─────────────────────────────────────────
function PresetThumb({ preset, isSelected, onClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <button
        onClick={onClick}
        title={preset.name}
        style={{
          width: 82, height: 60,
          background: preset.bgColor,
          border: `2px solid ${isSelected ? preset.accentColor : preset.borderColor + '66'}`,
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          padding: 0,
          outline: isSelected ? `2px solid ${preset.accentColor}` : 'none',
          outlineOffset: 1,
          transition: 'outline 0.15s, border-color 0.15s',
        }}
      >
        {/* Sidebar strip */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 15,
          background: preset.surfaceSide,
          borderRight: `1px solid ${preset.borderColor}44`,
        }} />

        {/* Content area */}
        <div style={{ marginLeft: 17, padding: '5px 5px 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Accent header bar */}
          <div style={{ height: 5, background: preset.accentColor, borderRadius: 2, opacity: 0.85, width: '70%' }} />
          {/* Card lines */}
          <div style={{ height: 9, background: preset.surface, border: `1px solid ${preset.borderColor}88`, borderRadius: 3 }} />
          <div style={{ height: 9, background: preset.surface, border: `1px solid ${preset.borderColor}88`, borderRadius: 3 }} />
          <div style={{ height: 6, background: preset.surface, border: `1px solid ${preset.borderColor}88`, borderRadius: 3, width: '55%' }} />
        </div>

        {/* Selection checkmark */}
        {isSelected && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 14, height: 14, borderRadius: '50%',
            background: preset.accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      <span style={{
        fontSize: 11, fontFamily: 'Sora, sans-serif',
        color: isSelected ? 'var(--navi-accent)' : 'var(--text-muted)',
        fontWeight: isSelected ? 600 : 400,
        letterSpacing: '0.01em',
      }}>
        {preset.name}
      </span>
    </div>
  )
}

// ─── Border style option button ───────────────────────────────────────────────
function BorderStyleOption({ value, label, selected, onClick }) {
  const preview =
    value === 'solid' ? (
      <div style={{ width: 36, borderTop: '2px solid var(--navi-border)' }} />
    ) : value === 'dashed' ? (
      <div style={{ width: 36, borderTop: '2px dashed var(--navi-border)' }} />
    ) : (
      <div style={{ width: 36, height: 18, border: '2px solid var(--navi-border)', borderRadius: 18 }} />
    )

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '9px 6px',
        borderRadius: 8,
        border: `2px solid ${selected ? 'var(--navi-accent)' : 'var(--navi-border)'}`,
        background: selected
          ? 'color-mix(in srgb, var(--navi-accent) 8%, var(--surface))'
          : 'var(--navi-bg)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {preview}
      <span style={{
        fontSize: 11, fontFamily: 'Sora, sans-serif',
        color: selected ? 'var(--navi-accent)' : 'var(--text-muted)',
        fontWeight: selected ? 600 : 400,
      }}>
        {label}
      </span>
    </button>
  )
}

// ─── Section label helper ─────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.09em', textTransform: 'uppercase',
      color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif',
    }}>
      {children}
    </p>
  )
}

// ─── Color picker row ─────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {value.toUpperCase()}
        </span>
        <div style={{ position: 'relative', width: 30, height: 30 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: value,
            border: '2px solid var(--navi-border)',
            cursor: 'pointer',
          }} />
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              position: 'absolute', inset: 0,
              opacity: 0, width: '100%', height: '100%',
              cursor: 'pointer', border: 'none', padding: 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CustomizePanel({ open, onClose, onGreetingNameChange }) {
  const [prefs,   setPrefs]   = useState(DEFAULTS)
  const [saved,   setSaved]   = useState(DEFAULTS)
  const [saving,  setSaving]  = useState(false)
  const [saveMsg, setSaveMsg] = useState('')   // '' | 'saved' | 'error'

  // ── Load prefs on mount and apply them immediately ──────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/preferences', {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const p = {
          bgColor:      data.bgColor      || DEFAULTS.bgColor,
          borderColor:  data.borderColor  || DEFAULTS.borderColor,
          accentColor:  data.accentColor  || DEFAULTS.accentColor,
          borderStyle:  data.borderStyle  || DEFAULTS.borderStyle,
          greetingName: data.greetingName || '',
          presetName:   data.presetName   || DEFAULTS.presetName,
        }
        setPrefs(p)
        setSaved(p)
        // Apply preset text/surface colors, then overlay stored colors
        const preset = PRESETS.find(x => x.name === p.presetName)
        if (preset) applyFullPreset(preset)
        applyColors(p)
        applyBorderStyle(p.borderStyle)
      } catch (e) {
        console.error('[CustomizePanel] load:', e)
      }
    }
    load()
  }, [])

  // ── Live preview: apply color CSS vars whenever prefs change ─────────────────
  useEffect(() => {
    applyColors(prefs)
    applyBorderStyle(prefs.borderStyle)
  }, [prefs.bgColor, prefs.borderColor, prefs.accentColor, prefs.borderStyle])

  // ── Notify parent whenever greeting name changes ──────────────────────────
  useEffect(() => {
    if (onGreetingNameChange) onGreetingNameChange(prefs.greetingName)
  }, [prefs.greetingName, onGreetingNameChange])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function selectPreset(preset) {
    applyFullPreset(preset)  // apply text/surface colors immediately
    setPrefs(p => ({
      ...p,
      bgColor:     preset.bgColor,
      borderColor: preset.borderColor,
      accentColor: preset.accentColor,
      presetName:  preset.name,
    }))
  }

  function updateField(key, value) {
    setPrefs(p => ({ ...p, [key]: value, presetName: key === 'greetingName' ? p.presetName : 'Custom' }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const saved = {
        bgColor:      data.bgColor      || prefs.bgColor,
        borderColor:  data.borderColor  || prefs.borderColor,
        accentColor:  data.accentColor  || prefs.accentColor,
        borderStyle:  data.borderStyle  || prefs.borderStyle,
        greetingName: data.greetingName ?? prefs.greetingName,
        presetName:   data.presetName   || prefs.presetName,
      }
      setSaved(saved)
      setPrefs(saved)
      setSaveMsg('saved')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch (e) {
      console.error('[CustomizePanel] save:', e)
      setSaveMsg('error')
      setTimeout(() => setSaveMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    setPrefs(saved)
    // Re-apply the saved state fully
    const preset = PRESETS.find(x => x.name === saved.presetName)
    if (preset) applyFullPreset(preset)
    applyColors(saved)
    applyBorderStyle(saved.borderStyle)
  }

  const isDirty = JSON.stringify(prefs) !== JSON.stringify(saved)

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 320,
          background: 'var(--surface)',
          borderLeft: '1.5px solid var(--navi-border)',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.12)' : 'none',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--navi-border)',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{
              margin: 0, fontSize: 16,
              fontFamily: 'Playfair Display, serif',
              color: 'var(--text)',
            }}>
              Customize
            </h3>
            <p style={{
              margin: '2px 0 0', fontSize: 11,
              fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)',
            }}>
              Changes preview instantly
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, color: 'var(--text-muted)', lineHeight: 1,
              padding: '2px 4px', borderRadius: 6,
            }}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── Presets ── */}
          <SectionLabel>Presets</SectionLabel>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px 8px',
            marginBottom: 24,
          }}>
            {PRESETS.map(preset => (
              <PresetThumb
                key={preset.name}
                preset={preset}
                isSelected={prefs.presetName === preset.name}
                onClick={() => selectPreset(preset)}
              />
            ))}
          </div>

          {/* ── Colors ── */}
          <SectionLabel>Colors</SectionLabel>
          <div style={{
            background: 'var(--navi-bg)', borderRadius: 10,
            border: '1px solid var(--navi-border)',
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
            marginBottom: 24,
          }}>
            <ColorRow
              label="Background"
              value={prefs.bgColor}
              onChange={v => updateField('bgColor', v)}
            />
            <div style={{ height: 1, background: 'var(--navi-border)', opacity: 0.6 }} />
            <ColorRow
              label="Card border"
              value={prefs.borderColor}
              onChange={v => updateField('borderColor', v)}
            />
            <div style={{ height: 1, background: 'var(--navi-border)', opacity: 0.6 }} />
            <ColorRow
              label="Accent"
              value={prefs.accentColor}
              onChange={v => updateField('accentColor', v)}
            />
          </div>

          {/* ── Border style ── */}
          <SectionLabel>Border style</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { value: 'solid',   label: 'Solid'   },
              { value: 'dashed',  label: 'Dashed'  },
              { value: 'rounded', label: 'Rounded' },
            ].map(opt => (
              <BorderStyleOption
                key={opt.value}
                value={opt.value}
                label={opt.label}
                selected={prefs.borderStyle === opt.value}
                onClick={() => updateField('borderStyle', opt.value)}
              />
            ))}
          </div>

          {/* ── Greeting name ── */}
          <SectionLabel>Greeting name</SectionLabel>
          <input
            type="text"
            value={prefs.greetingName}
            onChange={e => updateField('greetingName', e.target.value)}
            placeholder="e.g. Alex (overrides your display name)"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px',
              border: '1.5px solid var(--navi-border)',
              borderRadius: 8,
              background: 'var(--navi-bg)',
              color: 'var(--text)',
              fontFamily: 'Sora, sans-serif', fontSize: 13,
              outline: 'none',
              marginBottom: 24,
            }}
          />
        </div>

        {/* Footer — Save / Discard */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--navi-border)',
          display: 'flex', flexDirection: 'column', gap: 8,
          flexShrink: 0,
        }}>
          {saveMsg === 'saved' && (
            <p style={{
              margin: 0, textAlign: 'center',
              fontSize: 12, fontFamily: 'Sora, sans-serif',
              color: '#22a355', fontWeight: 500,
            }}>
              ✓ Preferences saved
            </p>
          )}
          {saveMsg === 'error' && (
            <p style={{
              margin: 0, textAlign: 'center',
              fontSize: 12, fontFamily: 'Sora, sans-serif',
              color: '#c0392b',
            }}>
              Failed to save — please try again
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '10px',
              borderRadius: 8, border: 'none',
              background: 'var(--navi-accent)', color: '#fff',
              fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          <button
            onClick={handleDiscard}
            disabled={!isDirty}
            style={{
              width: '100%', padding: '9px',
              borderRadius: 8,
              border: '1px solid var(--navi-border)',
              background: 'transparent',
              color: isDirty ? 'var(--text)' : 'var(--text-muted)',
              fontFamily: 'Sora, sans-serif', fontSize: 13,
              cursor: isDirty ? 'pointer' : 'default',
              opacity: isDirty ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
          >
            Discard changes
          </button>
        </div>
      </div>
    </>
  )
}
