import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveAuth } from '../lib/auth'
import { useToast } from '../lib/ToastContext'
import PasswordStrengthMeter, { getPasswordStrength } from '../components/PasswordStrengthMeter'

export default function Register() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [isStudent, setIsStudent] = useState(true)
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

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isStudent }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      saveAuth(data.token, data.user)
      showToast('Account created! Welcome to Navi.')
      navigate('/onboarding')
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
        <h1 style={{ fontSize: 28, textAlign: 'center', marginBottom: 24 }}>
          Create your account
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input style={inputStyle} type="text" value={form.name}
              onChange={set('name')} placeholder="Alex Rivera" required />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email}
              onChange={set('email')} placeholder="alex@university.edu" required />
            <p style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 5,
              marginBottom: 0,
            }}>
              We recommend your school email for easier Canvas connection.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={form.password}
              onChange={set('password')} placeholder="••••••••" required />
            <PasswordStrengthMeter password={form.password} />
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
            marginTop: 4,
          }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'Sora, sans-serif',
                       fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            <button type="button" onClick={() => setIsStudent(false)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', textDecoration: 'underline', fontSize: 12,
              fontFamily: 'Sora, sans-serif', padding: 0,
            }}>
              Not a student? Continue with a personal account
            </button>
            {!isStudent && (
              <span style={{ color: 'var(--accent)', marginLeft: 6 }}>✓ personal</span>
            )}
          </p>
        </form>

        <p style={{ textAlign: 'center', fontFamily: 'Sora, sans-serif',
                     fontSize: 13, color: 'var(--text-muted)', marginTop: 20, marginBottom: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
