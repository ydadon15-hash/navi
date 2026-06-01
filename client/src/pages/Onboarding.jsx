import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, getUser, updateStoredUser } from '../lib/auth'

// ── Constants ──────────────────────────────────────────────────────────────

const CLASS_COLORS = { 1: '#3A7BD5', 2: '#D4622A', 3: '#2E9E68', 4: '#8052C8' }

const SCHOOLS = [
  { name: 'Arizona State University',        url: 'canvas.asu.edu' },
  { name: 'Boston University',               url: 'learn.bu.edu' },
  { name: 'Carnegie Mellon University',      url: 'canvas.cmu.edu' },
  { name: 'Cornell University',              url: 'canvas.cornell.edu' },
  { name: 'Duke University',                 url: 'canvas.duke.edu' },
  { name: 'Emory University',                url: 'canvas.emory.edu' },
  { name: 'Georgetown University',           url: 'canvas.georgetown.edu' },
  { name: 'Georgia Tech',                    url: 'canvas.gatech.edu' },
  { name: 'Harvard University',              url: 'canvas.harvard.edu' },
  { name: 'Indiana University',              url: 'canvas.iu.edu' },
  { name: 'MIT',                             url: 'canvas.mit.edu' },
  { name: 'New York University',             url: 'brightspace.nyu.edu' },
  { name: 'Ohio State University',           url: 'osu.instructure.com' },
  { name: 'Penn State University',           url: 'canvas.psu.edu' },
  { name: 'Purdue University',               url: 'purdue.instructure.com' },
  { name: 'Stanford University',             url: 'canvas.stanford.edu' },
  { name: 'UC Berkeley',                     url: 'bcourses.berkeley.edu' },
  { name: 'UCLA',                            url: 'bruinlearn.ucla.edu' },
  { name: 'University of Michigan',          url: 'umich.instructure.com' },
  { name: 'University of Texas at Austin',   url: 'canvas.utexas.edu' },
  { name: 'University of Washington',        url: 'canvas.uw.edu' },
  { name: 'Yale University',                 url: 'canvas.yale.edu' },
]

// ── DropZone ──────────────────────────────────────────────────────────────

function DropZone({ cls, accepted, onAccept }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const color = CLASS_COLORS[cls.colorIndex] || CLASS_COLORS[1]

  function handleFiles(files) {
    const file = files[0]
    if (!file) return
    if (file.type !== 'application/pdf') return
    if (file.size > 10 * 1024 * 1024) return
    onAccept({ name: file.name, size: file.size })
  }

  if (accepted) {
    return (
      <div style={{
        border: `1px solid ${CLASS_COLORS[3]}`,
        borderRadius: 8, padding: '14px 16px',
        background: 'rgba(46,158,104,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ color: CLASS_COLORS[3], fontSize: 18, lineHeight: 1 }}>✓</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 500,
                         color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap' }}>
            {accepted.name}
          </div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {(accepted.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
        <button onClick={() => onAccept(null)} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1,
        }}>×</button>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      style={{
        border: `2px dashed ${dragging ? color : 'var(--border)'}`,
        borderRadius: 8, padding: '18px 16px', textAlign: 'center', cursor: 'pointer',
        background: dragging ? `${color}12` : 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />
      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>
        Drop PDF here or{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>browse</span>
      </div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        Max 10 MB
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────

const btn = {
  primary: {
    width: '100%', padding: '12px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 8, fontFamily: 'Sora, sans-serif',
    fontSize: 15, fontWeight: 500, cursor: 'pointer',
  },
  ghost: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontFamily: 'Sora, sans-serif', fontSize: 13, cursor: 'pointer',
    textDecoration: 'underline', padding: 0,
  },
}

const input = {
  width: '100%', padding: '12px 14px', border: '1px solid var(--border)',
  borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 15,
  background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box',
}

// ── Main Component ────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate  = useNavigate()
  const token     = getToken()
  const storedUser = getUser()

  const [step,            setStep]           = useState(1)
  const [isStudent,       setIsStudent]      = useState(true)
  const [schoolQuery,     setSchoolQuery]    = useState('')
  const [selectedSchool,  setSelectedSchool] = useState(null)
  const [showDropdown,    setShowDropdown]   = useState(false)
  const [canvasState,     setCanvasState]    = useState('idle')  // idle|loading|success|error
  const [classes,         setClasses]        = useState([])
  const [syllabi,         setSyllabi]        = useState({})      // id -> { name, size }
  const [showAddClass,    setShowAddClass]   = useState(false)
  const [newClassName,    setNewClassName]   = useState('')
  const [manualToken,     setManualToken]    = useState('')
  const [saving,          setSaving]         = useState(false)

  // Guards
  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    if (storedUser?.onboardingComplete) { navigate('/dashboard', { replace: true }); return }
  }, [])

  // Auto-start Canvas simulation on step 3
  useEffect(() => {
    if (step === 3 && canvasState === 'idle') connectCanvas()
  }, [step])

  const filteredSchools = schoolQuery.length >= 2
    ? SCHOOLS.filter(s => s.name.toLowerCase().includes(schoolQuery.toLowerCase())).slice(0, 7)
    : []

  const progress = Math.round((step / 5) * 100)

  // ── Actions ────────────────────────────────────────────────────────────

  async function connectCanvas() {
    setCanvasState('loading')
    await new Promise(r => setTimeout(r, 2000))
    try {
      const res = await fetch('/api/classes/canvas-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const { classes: c } = await res.json()
      setClasses(c)
      setCanvasState('success')
    } catch {
      setCanvasState('error')
    }
  }

  async function fetchClasses() {
    try {
      const res = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setClasses(await res.json())
    } catch {}
  }

  async function addClassManually() {
    if (!newClassName.trim()) return
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newClassName.trim() }),
      })
      if (res.ok) {
        const cls = await res.json()
        setClasses(prev => [...prev, cls])
        setNewClassName('')
        setShowAddClass(false)
      }
    } catch {}
  }

  async function completeOnboarding() {
    setSaving(true)
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onboardingComplete: true }),
      })
      updateStoredUser({ onboardingComplete: true })
      navigate('/dashboard')
    } catch { setSaving(false) }
  }

  function goTo(n) { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (!token) return null

  // ── Layout wrapper ─────────────────────────────────────────────────────

  const wrap = (content) => (
    <div style={{ width: '100%', maxWidth: 520 }}>
      {content}
    </div>
  )

  const stepLabel = (n) => (
    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text-muted)',
                   marginBottom: 16, textAlign: 'center', letterSpacing: '0.04em' }}>
      STEP {n} OF 5
    </div>
  )

  const heading = (text, sub) => (
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <h1 style={{ fontSize: 30, marginBottom: sub ? 10 : 0 }}>{text}</h1>
      {sub && <p style={{ fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)',
                           fontSize: 15, margin: 0 }}>{sub}</p>}
    </div>
  )

  // ── Step 1: Student check ──────────────────────────────────────────────

  const renderStep1 = () => wrap(
    <>
      {stepLabel(1)}
      {heading('Are you a student?', 'This helps us personalize your experience.')}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'Yes, I\'m a student', icon: '🎓', value: true,  next: () => { setIsStudent(true);  goTo(2) } },
          { label: 'No, personal use',    icon: '👤', value: false, next: async () => { setIsStudent(false); await fetchClasses(); goTo(4) } },
        ].map(({ label, icon, next }) => (
          <button key={label} onClick={next} style={{
            flex: 1, padding: '20px 16px', cursor: 'pointer',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, fontFamily: 'Sora, sans-serif', fontSize: 14,
            fontWeight: 500, color: 'var(--text)', textAlign: 'center',
            transition: 'border-color 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>
    </>
  )

  // ── Step 2: School search ──────────────────────────────────────────────

  const renderStep2 = () => wrap(
    <>
      {stepLabel(2)}
      {heading('Find your school', 'We\'ll connect to your Canvas account automatically.')}

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Search your school or university"
          value={schoolQuery}
          style={input}
          onChange={e => { setSchoolQuery(e.target.value); setSelectedSchool(null); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          autoFocus
        />
        {showDropdown && filteredSchools.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, marginTop: 4,
            boxShadow: '0 6px 20px rgba(0,0,0,0.09)', overflow: 'hidden',
          }}>
            {filteredSchools.map(s => (
              <div key={s.name}
                onMouseDown={() => { setSelectedSchool(s); setSchoolQuery(s.name); setShowDropdown(false) }}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--hover-faint)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14,
                               fontWeight: 500, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 12,
                               color: 'var(--text-muted)', marginTop: 2 }}>{s.url}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'var(--text-muted)',
                   margin: '0 0 28px' }}>
        Canvas sync works at most schools. If your school restricts third-party apps we'll walk you through a manual option.
      </p>

      {selectedSchool ? (
        <button onClick={() => goTo(3)} style={btn.primary}>Connect Canvas</button>
      ) : (
        <button disabled style={{ ...btn.primary, opacity: 0.4, cursor: 'not-allowed' }}>
          Connect Canvas
        </button>
      )}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={async () => { await fetchClasses(); goTo(4) }} style={btn.ghost}>
          Skip Canvas setup for now
        </button>
      </div>
    </>
  )

  // ── Step 3: Canvas connection ──────────────────────────────────────────

  const renderStep3 = () => wrap(
    <>
      {stepLabel(3)}
      {heading('Connecting to Canvas')}

      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        {canvasState === 'loading' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16,
                           animation: 'spin 1s linear infinite' }}>⟳</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            <p style={{ fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)',
                         fontSize: 15, margin: 0 }}>
              Connecting to {selectedSchool?.name || 'Canvas'}…
            </p>
          </>
        )}

        {canvasState === 'success' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Connected successfully</h2>
            <p style={{ fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)',
                         fontSize: 14, margin: '0 0 28px' }}>
              Found {classes.length} course{classes.length !== 1 ? 's' : ''} in your Canvas account.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {classes.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                          padding: '8px 12px', background: 'var(--bg)',
                                          borderRadius: 8, textAlign: 'left' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                  background: CLASS_COLORS[c.colorIndex] || CLASS_COLORS[1] }} />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14,
                                  color: 'var(--text)' }}>{c.name}</span>
                </div>
              ))}
            </div>
            <button onClick={() => goTo(4)} style={btn.primary}>Continue</button>
          </>
        )}

        {canvasState === 'error' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Couldn't connect automatically</h2>
            <p style={{ fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)',
                         fontSize: 14, margin: '0 0 20px' }}>
              No problem — paste a Canvas personal access token below and we'll connect that way.
            </p>
            <input
              type="text"
              placeholder="Paste your Canvas access token"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              style={{ ...input, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setCanvasState('idle') }} style={{
                ...btn.primary, background: 'var(--surface)',
                color: 'var(--text)', border: '1px solid var(--border)', flex: 1,
              }}>
                Retry
              </button>
              <button onClick={async () => { await fetchClasses(); goTo(4) }}
                style={{ ...btn.primary, flex: 1 }}>
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )

  // ── Step 4: Review classes ─────────────────────────────────────────────

  const renderStep4 = () => wrap(
    <>
      {stepLabel(4)}
      {heading("Here's what we found", `${classes.length} class${classes.length !== 1 ? 'es' : ''} ready to track.`)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {classes.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)',
                                          fontFamily: 'Sora, sans-serif', fontSize: 14 }}>
            No classes yet — add one below.
          </div>
        )}
        {classes.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
              background: CLASS_COLORS[c.colorIndex] || CLASS_COLORS[1],
            }} />
            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 500,
                            color: 'var(--text)' }}>
              {c.name}
            </span>
            {c.letterGrade && (
              <span style={{ marginLeft: 'auto', fontFamily: 'Sora, sans-serif',
                              fontSize: 13, color: 'var(--text-muted)' }}>
                {c.letterGrade}
              </span>
            )}
          </div>
        ))}
      </div>

      {showAddClass ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Class name"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addClassManually()}
            style={{ ...input, marginBottom: 0 }}
            autoFocus
          />
          <button onClick={addClassManually} style={{
            ...btn.primary, width: 'auto', padding: '12px 20px', flexShrink: 0,
          }}>
            Add
          </button>
          <button onClick={() => setShowAddClass(false)} style={{
            ...btn.primary, width: 'auto', padding: '12px 16px', flexShrink: 0,
            background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
          }}>
            ✕
          </button>
        </div>
      ) : null}

      <button onClick={() => goTo(5)} style={btn.primary}>Looks good, let's go</button>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={() => setShowAddClass(true)} style={btn.ghost}>
          Something's missing — add a class
        </button>
      </div>
    </>
  )

  // ── Step 5: Syllabus upload ────────────────────────────────────────────

  const renderStep5 = () => wrap(
    <>
      {stepLabel(5)}
      {heading('Upload your syllabus', 'We\'ll summarize key dates and requirements for you.')}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {classes.map(c => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: CLASS_COLORS[c.colorIndex] || CLASS_COLORS[1],
              }} />
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 500,
                              color: 'var(--text)' }}>
                {c.name}
              </span>
            </div>
            <DropZone
              cls={c}
              accepted={syllabi[c.id] || null}
              onAccept={fileInfo => setSyllabi(prev =>
                fileInfo ? { ...prev, [c.id]: fileInfo } : (() => { const s = { ...prev }; delete s[c.id]; return s })()
              )}
            />
          </div>
        ))}

        {classes.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)',
                                          fontFamily: 'Sora, sans-serif', fontSize: 14 }}>
            No classes to upload syllabi for.
          </div>
        )}
      </div>

      <button onClick={completeOnboarding} disabled={saving} style={{
        ...btn.primary, opacity: saving ? 0.7 : 1,
        cursor: saving ? 'not-allowed' : 'pointer',
      }}>
        {saving ? 'Saving…' : 'Continue'}
      </button>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={completeOnboarding} style={btn.ghost}>
          I'll do this later
        </button>
      </div>
    </>
  )

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Fixed top progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0,
                     height: 3, background: 'var(--border)', zIndex: 100 }}>
        <div style={{
          height: '100%', background: 'var(--accent)',
          width: `${progress}%`, transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Step counter */}
      <div style={{
        position: 'fixed', top: 14, right: 20,
        fontFamily: 'Sora, sans-serif', fontSize: 12,
        color: 'var(--text-muted)', zIndex: 100,
      }}>
        {step} / 5
      </div>

      {/* Content */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '64px 16px 48px',
      }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  )
}
