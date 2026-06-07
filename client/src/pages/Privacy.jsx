import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const LAST_UPDATED = 'June 7, 2026'
const CONTACT_EMAIL = 'yonathan@mynaviapp.com'

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: `Navi ("we," "us," or "our") is a student productivity platform that helps you stay on top of your coursework, calendar, and academic goals. This Privacy Policy explains how we collect, use, and protect your personal information when you use Navi at mynaviapp.com or any related services.

By creating an account or using Navi, you agree to the practices described in this policy. If you do not agree, please discontinue use of the service.

This policy applies to all users of Navi, including students who connect their Google Calendar, use the study planner, or access any other feature of the platform.`,
  },
  {
    id: 'information-we-collect',
    title: '2. Information We Collect',
    content: null,
    subsections: [
      {
        subtitle: 'Account Information',
        text: 'When you register, we collect your name, email address, and password (stored as a secure hash — your plaintext password is never stored). We also collect your school or university name if you provide it during onboarding.',
      },
      {
        subtitle: 'Google Calendar Data',
        text: 'If you choose to connect Google Calendar, we collect your OAuth refresh token (encrypted in our database) and the event data returned by the Google Calendar API — including event titles, start/end times, locations, and descriptions. This data is fetched and stored solely to power the Navi dashboard.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We automatically collect information about how you interact with Navi, such as features used, pages visited, and session duration. This data is aggregated and used to improve the product. We do not sell or share individual usage profiles.',
      },
      {
        subtitle: 'Device and Technical Data',
        text: 'We may collect your browser type, operating system, IP address, and general location (country/region) for security and analytics purposes. This data is not linked to your identity beyond what is necessary for service delivery.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    content: `We use the information we collect exclusively to operate and improve Navi. Specifically:

• To create and manage your account and authenticate your identity.
• To display your upcoming assignments, deadlines, and calendar events on your dashboard.
• To sync your Google Calendar events on a daily basis so your schedule stays up to date.
• To generate AI-powered study plans and progress insights tailored to your workload.
• To send you transactional communications (e.g., account verification, billing receipts).
• To diagnose errors, monitor system performance, and improve the reliability of the platform.
• To comply with our legal obligations.

We do not use your data for advertising, we do not sell your data to third parties, and we do not share your personal information with anyone outside of the service providers listed in this policy.`,
  },
  {
    id: 'google-calendar',
    title: '4. Google Calendar Integration',
    content: `When you click "Connect" on the Google Calendar card in your Navi dashboard, you are redirected to Google's secure OAuth consent screen. You choose exactly what permissions to grant. Navi requests only the minimum scope required: read-only access to your primary calendar events.

What we access:
• Event titles, start and end times, locations, and descriptions from your primary Google Calendar.

What we never do:
• We never create, edit, or delete any events on your Google Calendar.
• We never access other Google services (Gmail, Drive, Contacts, etc.).
• We never share your calendar data with third parties.

Your calendar data is fetched automatically once per day at 7 AM and stored in our secure database so your dashboard loads instantly. You can revoke Navi's access to your Google Calendar at any time by visiting your Google Account at myaccount.google.com → Security → Third-party apps with account access, and removing Navi. You can also disconnect from within your Navi account settings.

Navi's use of Google Calendar data complies with the Google API Services User Data Policy, including the Limited Use requirements.`,
  },
  {
    id: 'canvas',
    title: '5. Canvas LMS Integration',
    content: `Canvas LMS integration is coming soon. When available, it will follow the same read-only principles as our Google Calendar integration. We will only request the minimum permissions necessary to import your assignments and due dates, we will never modify any data in your Canvas account, and you will always be able to revoke access with a single click.

Full details of the Canvas integration — including what data is accessed and how long it is retained — will be added to this Privacy Policy before the feature launches.`,
  },
  {
    id: 'payments',
    title: '6. Payment Information',
    content: `Navi uses Stripe, a PCI-DSS-compliant payment processor, to handle all subscription billing. When you enter your credit card or payment details, that information goes directly to Stripe's secure servers — it never passes through Navi's servers and is never stored in our database.

We receive only non-sensitive metadata from Stripe, such as your subscription status, plan tier, and the last four digits of your card, which we use to manage your account. Stripe's privacy practices are governed by the Stripe Privacy Policy (stripe.com/privacy).`,
  },
  {
    id: 'security',
    title: '7. Data Storage and Security',
    content: `Navi stores your data on Railway's managed PostgreSQL infrastructure, hosted in secure cloud data centers. Our frontend is deployed on Vercel's global edge network. Both providers maintain industry-standard security certifications and practices.

We protect your data through multiple layers:

• Encryption in transit: All data between your browser and our servers is encrypted using TLS 1.2 or higher (HTTPS). Unencrypted HTTP connections are automatically redirected.
• Encryption at rest: Sensitive fields — including your Google OAuth refresh token — are stored encrypted in the database.
• Authentication: Passwords are hashed using bcrypt with a strong cost factor. Authentication tokens are signed JWTs with short expiry windows.
• Access controls: Production database credentials are stored exclusively as environment variables in Railway's secret store, inaccessible to anyone outside the engineering team.

Despite these measures, no system is 100% secure. If you believe your account has been compromised, please contact us immediately at ${CONTACT_EMAIL}.`,
  },
  {
    id: 'your-rights',
    title: '8. Your Rights',
    content: `You have the following rights regarding your personal data:

• Access: You can request a copy of all personal data we hold about you.
• Correction: You can update your name, email, or school at any time in Settings.
• Deletion: You can request that we delete your account and all associated data. We will fulfill deletion requests within 30 days. Note that some data may be retained for a short period for legal or accounting purposes.
• Portability: You can request an export of your data in a machine-readable format.
• Opt-out: You can revoke any third-party integration (e.g., Google Calendar) at any time without deleting your account.

To exercise any of these rights, email us at ${CONTACT_EMAIL} with the subject line "Data Request." We will respond within 10 business days.`,
  },
  {
    id: 'cookies',
    title: '9. Cookies',
    content: `Navi uses a minimal number of cookies and similar local storage mechanisms to operate the service:

• Authentication token: We store your JWT authentication token in localStorage so you remain logged in between sessions. This is essential for the app to function and cannot be opted out of while using the service.
• Session preferences: We may store lightweight preferences (such as your selected theme) in localStorage. These contain no personal information.

We do not use tracking cookies, advertising cookies, or third-party analytics cookies that follow you across the web. We do not use Google Analytics or similar behavioral tracking tools.`,
  },
  {
    id: 'childrens-privacy',
    title: "10. Children's Privacy",
    content: `Navi is not intended for use by children under the age of 13. We do not knowingly collect personal information from anyone under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at ${CONTACT_EMAIL} and we will delete the information promptly.

If you are between 13 and 18 years old, please review this policy with a parent or guardian before creating an account.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time as the product evolves or as legal requirements change. When we make material changes, we will:

• Update the "Last Updated" date at the top of this page.
• Send a notification to your registered email address if the changes significantly affect how your data is used.
• Display a notice on the Navi dashboard for a reasonable period after the update.

Your continued use of Navi after any changes take effect constitutes your acceptance of the updated policy. We encourage you to review this page periodically.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or how Navi handles your data, please reach out:

Email: ${CONTACT_EMAIL}
Website: mynaviapp.com

We aim to respond to all privacy-related inquiries within 5 business days.`,
  },
]

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Privacy Policy — Navi'
    return () => { document.title = 'Navi' }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', fontFamily: 'Sora, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e8e8e4',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #3A7BD5 0%, #6a4fd4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 12L8 4L13 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.5 9h5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 20, fontWeight: 700, color: '#1a1a1a',
            letterSpacing: '-0.01em',
          }}>Navi</span>
        </Link>

        <Link to="/dashboard" style={{
          fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#3A7BD5',
          textDecoration: 'none', fontWeight: 500,
        }}>
          ← Back to Dashboard
        </Link>
      </header>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #3A7BD5 0%, #6a4fd4 100%)',
        padding: '56px 40px 52px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.15)', borderRadius: 20,
          padding: '5px 16px', marginBottom: 20,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Legal
        </div>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 40, fontWeight: 700, margin: '0 0 14px',
          letterSpacing: '-0.02em',
        }}>
          Privacy Policy
        </h1>
        <p style={{
          fontSize: 15, opacity: 0.85, margin: '0 auto',
          maxWidth: 520, lineHeight: 1.7,
        }}>
          We believe privacy is a right, not a feature. This policy explains exactly
          what data Navi collects, how we use it, and the controls you have over it.
        </p>
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 18 }}>
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Table of contents */}
        <nav style={{
          background: '#fff', border: '1px solid #e8e8e4',
          borderRadius: 14, padding: '24px 28px', marginBottom: 48,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#999', margin: '0 0 14px',
          }}>
            Table of Contents
          </p>
          <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
            {SECTIONS.map(s => (
              <li key={s.id} style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                <a
                  href={`#${s.id}`}
                  style={{ color: '#3A7BD5', textDecoration: 'none', fontWeight: 500 }}
                  onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {SECTIONS.map((section, idx) => (
            <section key={section.id} id={section.id} style={{ scrollMarginTop: 80 }}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #3A7BD5 0%, #6a4fd4 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {idx + 1}
                </div>
                <h2 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 22, fontWeight: 700, color: '#1a1a1a',
                  margin: 0, letterSpacing: '-0.01em',
                }}>
                  {section.title.replace(/^\d+\.\s/, '')}
                </h2>
              </div>

              <div style={{
                background: '#fff', border: '1px solid #e8e8e4',
                borderRadius: 14, padding: '28px 32px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                {/* Plain content */}
                {section.content && (
                  <p style={{
                    fontSize: 14.5, lineHeight: 1.85, color: '#3a3a3a',
                    margin: 0, whiteSpace: 'pre-line',
                  }}>
                    {section.content}
                  </p>
                )}

                {/* Subsections */}
                {section.subsections && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {section.subsections.map(sub => (
                      <div key={sub.subtitle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #3A7BD5, #6a4fd4)',
                          }} />
                          <span style={{
                            fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700,
                            color: '#1a1a1a', letterSpacing: '0.01em',
                          }}>
                            {sub.subtitle}
                          </span>
                        </div>
                        <p style={{
                          fontSize: 14.5, lineHeight: 1.85, color: '#3a3a3a',
                          margin: 0, paddingLeft: 14,
                        }}>
                          {sub.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider between sections (not after last) */}
              {idx < SECTIONS.length - 1 && (
                <div style={{ height: 1, background: '#e8e8e4', marginTop: 0 }} />
              )}
            </section>
          ))}
        </div>

        {/* ── Contact CTA ── */}
        <div style={{
          marginTop: 56,
          background: 'linear-gradient(135deg, #3A7BD5 0%, #6a4fd4 100%)',
          borderRadius: 18, padding: '36px 40px',
          textAlign: 'center', color: '#fff',
        }}>
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 22, fontWeight: 700, margin: '0 0 10px',
          }}>
            Questions about your privacy?
          </h3>
          <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 22px', lineHeight: 1.6 }}>
            We're happy to answer any questions about how Navi handles your data.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{
              display: 'inline-block',
              background: '#fff', color: '#3A7BD5',
              fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700,
              padding: '12px 28px', borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #e8e8e4',
        background: '#fff',
        padding: '24px 40px',
        textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, color: '#999' }}>
          © {new Date().getFullYear()} Navi. All rights reserved.
        </span>
        <Link to="/" style={{ fontSize: 13, color: '#3A7BD5', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        <Link to="/pricing" style={{ fontSize: 13, color: '#3A7BD5', textDecoration: 'none', fontWeight: 500 }}>Pricing</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize: 13, color: '#3A7BD5', textDecoration: 'none', fontWeight: 500 }}>Contact</a>
      </footer>
    </div>
  )
}
