import { Link } from 'react-router-dom'

const ACCENT = '#3A7BD5'
const GREEN  = '#2E9E68'

const FEATURES_FREE = [
  'Canvas sync',
  'Syllabus summarizer',
  'AI Study Plan',
  'Study timer',
  'Progress tracking',
]

const FEATURES_PAID = [
  'Canvas sync',
  'Syllabus summarizer',
  'AI Study Plan',
  'Study timer',
  'Progress tracking',
  'Priority support',
  'Parent & advisor view',
]

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill={GREEN} opacity="0.15" />
      <path d="M4.5 7.5l2 2 4-4" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Pricing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <h1 style={{
        fontSize: 40,
        fontFamily: 'Playfair Display, serif',
        margin: '0 0 8px',
        textAlign: 'center',
        letterSpacing: '-0.5px',
      }}>
        Simple pricing
      </h1>
      <p style={{
        fontFamily: 'Sora, sans-serif',
        color: 'var(--text-muted)',
        fontSize: 15,
        margin: '0 0 40px',
        textAlign: 'center',
      }}>
        Start free. Stay because it works.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 680,
        width: '100%',
      }}>

        {/* Free Trial card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            fontFamily: 'Sora, sans-serif',
          }}>
            Free Trial
          </p>
          <h2 style={{
            fontSize: 28,
            fontFamily: 'Playfair Display, serif',
            margin: '0 0 4px',
            color: 'var(--text)',
          }}>
            Free
          </h2>
          <p style={{
            margin: '0 0 6px',
            fontSize: 13,
            color: 'var(--text-muted)',
            fontFamily: 'Sora, sans-serif',
          }}>
            1 month
          </p>
          <p style={{
            margin: '0 0 24px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text)',
            fontFamily: 'Sora, sans-serif',
          }}>
            Full access to everything
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            {FEATURES_FREE.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <CheckIcon />
                <span style={{
                  fontSize: 13.5,
                  fontFamily: 'Sora, sans-serif',
                  color: 'var(--text)',
                  lineHeight: 1.4,
                }}>
                  {f}
                </span>
              </div>
            ))}
          </div>

          <p style={{
            margin: '0 0 14px',
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'Sora, sans-serif',
          }}>
            No credit card required
          </p>

          <Link
            to="/register"
            style={{
              display: 'block',
              padding: '12px 0',
              borderRadius: 9,
              background: ACCENT,
              color: '#fff',
              textAlign: 'center',
              textDecoration: 'none',
              fontFamily: 'Sora, sans-serif',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Start Free Trial
          </Link>
        </div>

        {/* Navi paid card */}
        <div style={{
          background: 'var(--surface)',
          border: `1.5px solid ${ACCENT}`,
          borderRadius: 16,
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: ACCENT,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'Sora, sans-serif',
            padding: '3px 12px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
          }}>
            Most popular
          </div>

          <p style={{
            margin: '0 0 4px',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: ACCENT,
            fontFamily: 'Sora, sans-serif',
          }}>
            Navi
          </p>
          <h2 style={{
            fontSize: 28,
            fontFamily: 'Playfair Display, serif',
            margin: '0 0 4px',
            color: 'var(--text)',
          }}>
            $7 <span style={{ fontSize: 16, fontFamily: 'Sora, sans-serif', fontWeight: 400, color: 'var(--text-muted)' }}>/ month</span>
          </h2>
          <p style={{
            margin: '0 0 24px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text)',
            fontFamily: 'Sora, sans-serif',
          }}>
            Everything included
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            {FEATURES_PAID.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <CheckIcon />
                <span style={{
                  fontSize: 13.5,
                  fontFamily: 'Sora, sans-serif',
                  color: 'var(--text)',
                  lineHeight: 1.4,
                }}>
                  {f}
                </span>
              </div>
            ))}
          </div>

          <Link
            to="/register"
            style={{
              display: 'block',
              padding: '12px 0',
              borderRadius: 9,
              background: ACCENT,
              color: '#fff',
              textAlign: 'center',
              textDecoration: 'none',
              fontFamily: 'Sora, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Get Navi
          </Link>
          <p style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            fontFamily: 'Sora, sans-serif',
          }}>
            Cancel anytime
          </p>
        </div>

      </div>
    </div>
  )
}
