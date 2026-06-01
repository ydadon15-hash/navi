import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, getUser, isLoggedIn } from '../lib/auth'

const CLASS_COLORS = { 1: '#3A7BD5', 2: '#D4622A', 3: '#2E9E68', 4: '#8052C8' }

function GradingBar({ label, percent, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>{percent}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(percent, 100)}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 600ms ease',
        }} />
      </div>
    </div>
  )
}

function SyllabusCard({ syllabus, color }) {
  const [open, setOpen] = useState(false)
  const s = syllabus.summary

  const date = new Date(syllabus.uploadedAt)
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: color, flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{ fontSize: 14, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>
            Uploaded {dateLabel}
          </span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms ease' }}
        >
          <path d="M4 6l4 4 4-4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && s && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          {s.gradingBreakdown && s.gradingBreakdown.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'Sora, sans-serif' }}>
                Grading
              </p>
              {s.gradingBreakdown.map((item, i) => (
                <GradingBar key={i} label={item.label} percent={item.percent} color={color} />
              ))}
            </div>
          )}

          {s.examDates && s.examDates.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'Sora, sans-serif' }}>
                Exams
              </p>
              {s.examDates.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{e.title}</span>
                  <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)' }}>{e.date}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {s.latePolicy && (
              <PolicyBlock label="Late Policy" value={s.latePolicy} />
            )}
            {s.attendancePolicy && (
              <PolicyBlock label="Attendance" value={s.attendancePolicy} />
            )}
            {s.officeHours && (
              <PolicyBlock label="Office Hours" value={s.officeHours} />
            )}
          </div>

          {s.requiredMaterials && s.requiredMaterials.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>
                Required Materials
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.requiredMaterials.map((m, i) => (
                  <li key={i} style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)', marginBottom: 4 }}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {s.weeklyTopics && s.weeklyTopics.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'Sora, sans-serif' }}>
                Weekly Topics
              </p>
              {s.weeklyTopics.map((wt, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontFamily: 'Sora, sans-serif', color: 'var(--text-muted)', minWidth: 52 }}>Week {wt.week}</span>
                  <span style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>{wt.topic}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PolicyBlock({ label, value }) {
  return (
    <div style={{ background: 'var(--hover-faint)', borderRadius: 8, padding: '10px 12px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px', fontFamily: 'Sora, sans-serif' }}>
        {label}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.5, fontFamily: 'Sora, sans-serif' }}>
        {value}
      </p>
    </div>
  )
}

function ClassSection({ cls, syllabi, onUpload }) {
  const color = CLASS_COLORS[cls.colorIndex] || '#3A7BD5'
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const hasSyllabus = syllabi && syllabi.length > 0

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('classId', cls.id)
      const res = await fetch('/api/syllabus/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      const data = await res.json()
      onUpload(cls.id, data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            background: color, display: 'inline-block', flexShrink: 0,
          }} />
          <h3 style={{ fontSize: 18, margin: 0 }}>{cls.name}</h3>
          {hasSyllabus
            ? <span style={{ fontSize: 11, fontWeight: 600, color: '#2E9E68', background: 'rgba(46,158,104,0.12)', borderRadius: 99, padding: '3px 9px', fontFamily: 'Sora, sans-serif' }}>Uploaded</span>
            : <span style={{ fontSize: 11, fontWeight: 600, color: '#C8952A', background: 'rgba(200,149,42,0.12)', borderRadius: 99, padding: '3px 9px', fontFamily: 'Sora, sans-serif' }}>No syllabus</span>
          }
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            style={{
              fontSize: 13,
              fontFamily: 'Sora, sans-serif',
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: 8,
              border: `1.5px solid ${color}`,
              color: color,
              background: 'none',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              transition: 'background 150ms',
            }}
          >
            {uploading ? 'Processing…' : hasSyllabus ? 'Replace PDF' : 'Upload PDF'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#c0392b', fontFamily: 'Sora, sans-serif', marginBottom: 10 }}>{error}</p>
      )}

      {hasSyllabus
        ? syllabi.map(s => <SyllabusCard key={s.id} syllabus={s} color={color} />)
        : (
          <div style={{
            border: '1.5px dashed var(--border)',
            borderRadius: 10,
            padding: '24px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'Sora, sans-serif',
            fontSize: 13,
          }}>
            Upload a PDF to see your syllabus summary here.
          </div>
        )
      }
    </div>
  )
}

export default function Syllabi() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [syllabusMap, setSyllabusMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    const user = getUser()
    if (user && !user.onboardingComplete) { navigate('/onboarding'); return }
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const token = getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const cls = await fetch('/api/classes', { headers }).then(r => r.json())
      setClasses(cls)

      const map = {}
      await Promise.all(
        cls.map(async (c) => {
          const syllabi = await fetch(`/api/syllabus/${c.id}`, { headers }).then(r => r.json())
          map[c.id] = syllabi
        })
      )
      setSyllabusMap(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleUpload(classId, data) {
    setSyllabusMap(prev => ({
      ...prev,
      [classId]: [{ id: data.id, classId: data.classId, uploadedAt: new Date().toISOString(), summary: data.summary }, ...(prev[classId] || [])],
    }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', padding: 0, marginBottom: 16 }}
          >
            ← Dashboard
          </button>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Syllabus</h1>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14, margin: 0 }}>
            Upload a PDF and Navi will extract your grading breakdown, exam dates, and policies.
          </p>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14 }}>Loading…</p>
        ) : classes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 14, margin: 0 }}>
              No classes found. Add classes first.
            </p>
          </div>
        ) : (
          classes.map(cls => (
            <ClassSection
              key={cls.id}
              cls={cls}
              syllabi={syllabusMap[cls.id] || []}
              onUpload={handleUpload}
            />
          ))
        )}
      </div>
    </div>
  )
}
