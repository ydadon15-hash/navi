export default function Design() {
  const classes = [
    { label: 'Calculus II',       color: 'var(--class-1)', name: 'Blue'       },
    { label: 'Art History',       color: 'var(--class-2)', name: 'Terracotta' },
    { label: 'Intro to Biology',  color: 'var(--class-3)', name: 'Sage Green' },
    { label: 'Philosophy 101',    color: 'var(--class-4)', name: 'Violet'     },
  ]

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const baseDate = 12

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 32px' }}>

      {/* Logo */}
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, marginBottom: 40 }}>
        Navi
      </h1>

      <div style={{ display: 'grid', gap: 40, maxWidth: 720 }}>

        {/* Card sample */}
        <section>
          <h2 style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 600,
                       textTransform: 'uppercase', letterSpacing: '0.08em',
                       color: 'var(--text-muted)', marginBottom: 12 }}>
            Card
          </h2>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Sample Card</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Surface color · 1px border · 12px radius · 20px padding · no shadows
            </p>
          </div>
        </section>

        {/* Class color chips */}
        <section>
          <h2 style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 600,
                       textTransform: 'uppercase', letterSpacing: '0.08em',
                       color: 'var(--text-muted)', marginBottom: 12 }}>
            Assignment Chips
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {classes.map(({ label, color, name }) => (
              <div
                key={label}
                className="chip"
                style={{ '--chip-color': color }}
              >
                <span style={{ fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                  — {name} · left border only, 10% tinted bg
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar row — today marker */}
        <section>
          <h2 style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 600,
                       textTransform: 'uppercase', letterSpacing: '0.08em',
                       color: 'var(--text-muted)', marginBottom: 12 }}>
            Calendar — Today Marker
          </h2>
          <div className="card" style={{ display: 'flex', gap: 0 }}>
            {weekDays.map((day, i) => (
              <div
                key={day}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px 4px',
                  borderRight: i < weekDays.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6,
                               fontFamily: 'Sora, sans-serif' }}>
                  {day}
                </div>
                {i === todayIdx ? (
                  <span className="today-marker" style={{ fontFamily: 'Sora, sans-serif', fontSize: 15 }}>
                    {baseDate + i}
                  </span>
                ) : (
                  <span style={{ fontSize: 15, fontFamily: 'Sora, sans-serif',
                                  color: 'var(--text)' }}>
                    {baseDate + i}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'Sora, sans-serif' }}>
            Today's date shown in accent blue with 2.5px underline — no fill, no background
          </p>
        </section>

        {/* Accent blue button */}
        <section>
          <h2 style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 600,
                       textTransform: 'uppercase', letterSpacing: '0.08em',
                       color: 'var(--text-muted)', marginBottom: 12 }}>
            Button
          </h2>
          <button
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontFamily: 'Sora, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Accent Blue Button
          </button>
        </section>

      </div>
    </div>
  )
}
