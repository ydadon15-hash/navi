import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      setSubmitted(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontFamily: 'Sora, sans-serif',
    fontSize: 14,
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Sora, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text)',
    marginBottom: 6,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 26, textAlign: 'center', marginBottom: 8 }}>
          Forgot your password?
        </h1>
        <p style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 14,
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: 0,
          marginBottom: 28,
        }}>
          Enter your email and we'll send you a reset link.
        </p>

        {submitted ? (
          <div style={{
            background: '#f0faf4',
            border: '1px solid #22a355',
            borderRadius: 8,
            padding: '16px 20px',
            fontFamily: 'Sora, sans-serif',
            fontSize: 14,
            color: '#22a355',
            textAlign: 'center',
            marginBottom: 20,
          }}>
            Check your email — we sent you a reset link
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                required
              />
            </div>

            {error && (
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13,
                           color: '#c0392b', margin: 0 }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '11px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'Sora, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontFamily: 'Sora, sans-serif',
                     fontSize: 13, color: 'var(--text-muted)', marginTop: 20, marginBottom: 0 }}>
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
