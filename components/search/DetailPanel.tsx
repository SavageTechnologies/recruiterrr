import type { Agent } from './types'
import { ScoreCircle, FlagBadge } from './AgentBadges'

function socialLabel(link: string) {
  if (link.includes('facebook'))                         return { label: 'Facebook',    short: 'FB', color: '#4267B2' }
  if (link.includes('linkedin'))                         return { label: 'LinkedIn',    short: 'LI', color: '#0077B5' }
  if (link.includes('instagram'))                        return { label: 'Instagram',   short: 'IG', color: '#E1306C' }
  if (link.includes('twitter') || link.includes('x.com')) return { label: 'X / Twitter', short: 'TW', color: '#1DA1F2' }
  return { label: 'Social', short: '↗', color: 'var(--text-2)' }
}

export function DetailPanel({ agent, city, state }: { agent: Agent | null; city: string; state: string }) {
  if (!agent) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'fadeUp 0.2s ease both' }}>

      {/* Header */}
      <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 4, fontWeight: 500,
              color: agent.captive ? 'var(--sig-red)' : 'var(--sig-green)',
            }}>
              {agent.captive ? '⚠ CAPTIVE — LOW RECRUITABILITY' : '● INDEPENDENT SIGNAL'}
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.15, marginBottom: 3 }}>{agent.name}</h2>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase' }}>{agent.type}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ScoreCircle score={agent.score} size={60} />
            <FlagBadge flag={agent.flag} />
          </div>
        </div>

        {/* Contact */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'var(--sig-green-dim)', border: '1px solid var(--sig-green-border)',
              color: 'var(--sig-green)', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 0.5,
              borderRadius: 'var(--radius)', transition: 'opacity 0.15s',
            }}>
              📞 {agent.phone}
            </a>
          )}
          {agent.contact_email && (
            <a href={`mailto:${agent.contact_email}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'transparent', border: '1px solid var(--border-strong)',
              color: 'var(--text-2)', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 0.5,
              borderRadius: 'var(--radius)',
            }}>
              @ {agent.contact_email}
            </a>
          )}
        </div>
      </div>

      {/* Website */}
      {agent.website && (
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 8, fontWeight: 500 }}>WEBSITE</div>
          <a href={agent.website} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 13px', background: 'var(--orange-dim)',
            border: '1px solid var(--orange-border)', color: 'var(--orange)',
            textDecoration: 'none', borderRadius: 'var(--radius)', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--orange-mid)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--orange-dim)')}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
              {agent.website}
            </span>
            <span style={{ fontSize: 14, flexShrink: 0 }}>↗</span>
          </a>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 0.5, marginTop: 5 }}>
            Carrier logos = independent · FMO branding = captive
          </div>
        </div>
      )}

      {/* Signals */}
      <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {agent.hiring && (
          <div style={{
            padding: '6px 11px', background: 'var(--sig-green-dim)',
            border: '1px solid var(--sig-green-border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-green)',
            letterSpacing: 0.5, borderRadius: 'var(--radius)', fontWeight: 500,
          }}>
            ▸ HIRING{agent.hiring_roles.length > 0 ? ` — ${agent.hiring_roles[0]}` : ''}
          </div>
        )}
        {agent.youtube_channel && (
          <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer" style={{
            padding: '6px 11px', background: 'var(--sig-red-dim)',
            border: '1px solid var(--sig-red-border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-red)',
            letterSpacing: 0.5, textDecoration: 'none', borderRadius: 'var(--radius)', fontWeight: 500,
          }}>
            ▸ YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''} ↗
          </a>
        )}
        {agent.rating > 0 && (
          <div style={{
            padding: '6px 11px', background: 'var(--bg)',
            border: '1px solid var(--border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: agent.reviews >= 100 ? 'var(--sig-yellow)' : 'var(--text-2)',
            letterSpacing: 0.5, borderRadius: 'var(--radius)',
          }}>
            ★ {agent.rating} · {agent.reviews} REVIEWS{agent.reviews >= 100 ? ' — ESTABLISHED' : agent.reviews >= 50 ? ' — ACTIVE' : ''}
          </div>
        )}
        {agent.address && (
          <div style={{
            padding: '6px 11px', background: 'transparent', border: '1px solid var(--border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)',
            letterSpacing: 0.5, borderRadius: 'var(--radius)',
          }}>
            ◎ {agent.address}
          </div>
        )}
      </div>

      {/* AI Intel */}
      {agent.notes && (
        <div style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>AI RECRUITER INTEL</div>
          <div style={{
            padding: '13px 15px', background: 'var(--orange-dim)',
            borderLeft: '3px solid var(--orange)', borderRadius: '0 var(--radius) var(--radius) 0',
            fontFamily: "'DM Sans', sans-serif", fontSize: 'var(--text-sm)',
            letterSpacing: 0.3, color: 'var(--text-1)', lineHeight: 1.8,
          }}>
            {agent.notes}
          </div>
        </div>
      )}

      {/* About */}
      {agent.about && (
        <div style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>ABOUT THIS AGENCY</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.8 }}>{agent.about}</p>
        </div>
      )}

      {/* Carriers */}
      {agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>CARRIERS IDENTIFIED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: '4px 10px',
                border: '1px solid var(--border)', color: 'var(--text-2)',
                background: 'var(--bg)', letterSpacing: 0.5, borderRadius: 'var(--radius)',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hiring detail */}
      {agent.hiring && agent.hiring_roles.length > 0 && (
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--sig-green)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>ACTIVE JOB POSTINGS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {agent.hiring_roles.map(r => (
              <div key={r} style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-1)', padding: '7px 10px',
                background: 'var(--sig-green-dim)', border: '1px solid var(--sig-green-border)',
                borderRadius: 'var(--radius)',
              }}>
                ▸ {r}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 0.5, marginTop: 8 }}>
            Opener: "I saw you're building a team — what kind of support are you getting from your upline?"
          </div>
        </div>
      )}

      {/* Social links */}
      {(agent.social_links || []).length > 0 && (
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>SOCIAL PROFILES</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(agent.social_links || []).map((link, i) => {
              const s = socialLabel(link)
              return (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: '5px 11px',
                  border: `1px solid ${s.color}40`, color: s.color, textDecoration: 'none',
                  letterSpacing: 0.5, background: `${s.color}0d`, borderRadius: 'var(--radius)',
                }}>
                  {s.short} — {s.label} ↗
                </a>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
