export function getPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  let level
  if (score <= 1) level = 'Weak'
  else if (score === 2) level = 'Fair'
  else if (score <= 4) level = 'Good'
  else level = 'Strong'
  return { checks, score, level }
}

const LEVEL_COLOR = {
  Weak:   '#e74c3c',
  Fair:   '#e67e22',
  Good:   '#f1c40f',
  Strong: '#22a355',
}

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const { checks, score, level } = getPasswordStrength(password)
  const color = LEVEL_COLOR[level]

  const checkItems = [
    { key: 'length',  label: 'At least 8 characters' },
    { key: 'upper',   label: 'Contains uppercase letter' },
    { key: 'lower',   label: 'Contains lowercase letter' },
    { key: 'number',  label: 'Contains a number' },
    { key: 'special', label: 'Contains a special character (!@#$%^&*)' },
  ]

  return (
    <div style={{ marginTop: 8 }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: n <= score ? color : '#DDD9D1',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <p style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        color,
        margin: '0 0 8px',
      }}>
        {level}
      </p>
      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {checkItems.map(({ key, label }) => (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Sora, sans-serif',
            fontSize: 12,
            color: checks[key] ? '#22a355' : 'var(--text-muted)',
            transition: 'color 0.2s',
          }}>
            <span style={{ fontSize: 13 }}>{checks[key] ? '✓' : '○'}</span>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
