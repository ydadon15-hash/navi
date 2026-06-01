import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../lib/auth'

const ACCENT = '#3A7BD5'

const canvasFeatures = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.4A6.4 6.4 0 1 1 10 3.6a6.4 6.4 0 0 1 0 12.8z" fill={ACCENT}/>
        <path d="M10 6v4l3 1.5-.75 1.3L9 11V6h1z" fill={ACCENT}/>
      </svg>
    ),
    text: 'Connects to Canvas automatically',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke={ACCENT} strokeWidth="1.5" fill="none"/>
        <path d="M6 8h8M6 11h5" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    text: 'Pulls every assignment without you lifting a finger',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="4" stroke={ACCENT} strokeWidth="1.5" fill="none"/>
        <circle cx="10" cy="10" r="1.5" fill={ACCENT}/>
      </svg>
    ),
    text: 'Stays updated every 4 hours on its own',
  },
]

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn()) navigate('/dashboard', { replace: true })
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
    }}>
      {/* Hero */}
      <h1 style={{ fontSize: 52, marginBottom: 10, letterSpacing: '-1px', textAlign: 'center' }}>
        Navi
      </h1>
      <p style={{
        fontFamily: 'Sora, sans-serif',
        color: 'var(--text-muted)',
        fontSize: 18,
        marginBottom: 32,
        marginTop: 0,
        textAlign: 'center',
      }}>
        Your AI-powered student planner
      </p>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 44 }}>
        <Link to="/login" style={{
          padding: '11px 28px',
          background: ACCENT,
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontFamily: 'Sora, sans-serif',
          fontSize: 14,
          fontWeight: 500,
        }}>
          Log In
        </Link>
        <Link to="/register" style={{
          padding: '11px 28px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          borderRadius: 8,
          textDecoration: 'none',
          fontFamily: 'Sora, sans-serif',
          fontSize: 14,
        }}>
          Sign Up
        </Link>
      </div>

      {/* Canvas value proposition */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px 28px',
        maxWidth: 560,
        width: '100%',
      }}>
        <p style={{
          margin: '0 0 16px',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'Sora, sans-serif',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          textAlign: 'center',
        }}>
          Powered by your Canvas
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {canvasFeatures.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{f.icon}</span>
              <span style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 14,
                color: 'var(--text)',
                lineHeight: 1.4,
              }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
