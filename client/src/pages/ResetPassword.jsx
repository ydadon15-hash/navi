import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PasswordStrengthMeter, { getPasswordStrength } from '../components/PasswordStrengthMeter'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const { level } = getPasswordStrength(form.password)
    if (level === 'Weak') {
      setError('Please choose a stronger password')
      return
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Reset failed'); return }
      sessionStorage.setItem('toast', 'Password updated — please log in')
      navigate('/login')
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

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div className="card" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, color: '#c0392b' }}>
            This reset link has expired. Please request a new one.
          </p>
        </div>
      </div>
    )
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
          Set a new password
        </h1>
        <p style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 14,
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: 0,
          marginBottom: 28,
        }}>
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input style={inputStyle} type="password" value={form.password}
              onChange={set('password')} placeholder="••••••••" required />
            <PasswordStrengthMeter password={form.password} />
          </div>

          <div>
            <label style={labelStyle}>Confirm password</label>
            <input style={inputStyle} type="password" value={form.confirm}
              onChange={set('confirm')} placeholder="••••••••" required />
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
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
