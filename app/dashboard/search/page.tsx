'use client'

import { useState } from 'react'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

type Agent = {
  name: string
  type: string
  phone: string
  address: string
  rating: number
  reviews: number
  website: string | null
  carriers: string[]
  captive: boolean
  score: number
  flag: 'hot' | 'warm' | 'cold'
  notes: string
  years: number | null
}

const LOADING_STEPS = [
  'Querying Google local listings',
  'Crawling agent websites',
  'Identifying carrier appointments',
  'Checking license history',
  'Scoring recruitability',
]

function ScoreCircle({ score }: { score: number }) {
  const cls = score >= 75 ? 'high' : score >= 50 ? 'med' : 'low'
  const color = cls === 'high' ? 'var(--green)' : cls === 'med' ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{
      width: 64, height: 64, borderRadius: '50%',
      border: `2px solid ${color}`,
      background: `${color}0d`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
        color, lineHeight: 1,
      }}>
        {score}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 8,
        color, letterSpacing: 1, textTransform: 'uppercase',
      }}>
        SCORE
      </div>
    </div>
  )
}

function RecruitBadge({ flag }: { flag: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot: { color: 'var(--green)', label: '🔥 HOT' },
    warm: { color: 'var(--yellow)', label: 'WARM' },
    cold: { color: '#333', label: 'PASS' },
  }
  const { color, label } = map[flag]
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 9,
      padding: '3px 8px', border: `1px solid ${color}`,
      color, letterSpacing: 1, textTransform: 'uppercase',
      textAlign: 'center',
    }}>
      {label}
    </div>
  )
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        padding: '24px 28px', cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        animation: `slideIn 0.3s ease ${index * 0.07}s both`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-light)'
        ;(e.currentTarget as HTMLDivElement).style.background = '#181818'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.background = 'var(--card)'
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>
            {agent.name}
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {agent.type}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
            {agent.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                📞 {agent.phone}
              </div>
            )}
            {agent.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                ⭐ {agent.rating} ({agent.reviews} reviews)
              </div>
            )}
            {agent.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                📍 {agent.address}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                padding: '3px 8px', border: '1px solid var(--border-light)',
                color: c === 'Unknown' ? '#333' : 'var(--muted)',
                letterSpacing: 1, textTransform: 'uppercase',
              }}>
                {c}
              </span>
            ))}
          </div>
          {expanded && agent.notes && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)',
              color: 'var(--muted)', lineHeight: 1.6,
              fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5,
            }}>
              {agent.notes}
            </div>
          )}
          {agent.website && expanded && (
            <a
              href={agent.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-block', marginTop: 12,
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: 'var(--orange)', letterSpacing: 1,
                textDecoration: 'none',
              }}
            >
              {agent.website} ↗
            </a>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 80 }}>
          <ScoreCircle score={agent.score} />
          <RecruitBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  const [city, setCity] = useState('')
  const [state, setState] = useState('KS')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [agents, setAgents] = useState<Agent[]>([])
  const [searched, setSearched] = useState(false)
  const [searchLabel, setSearchLabel] = useState('')
  const [error, setError] = useState('')

  async function runSearch() {
    if (!city.trim() || !state) return
    setLoading(true)
    setSearched(false)
    setAgents([])
    setError('')
    setCurrentStep(0)

    // Animate steps
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, 600))
    }

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), state }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAgents(data.agents || [])
      setSearchLabel(`${city.toUpperCase()}, ${state}`)
    } catch (err: any) {
      setError(err.message || 'Search failed. Try again.')
    }

    setCurrentStep(-1)
    setLoading(false)
    setSearched(true)
  }

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadSlide {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Market Search
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 56,
          letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9,
        }}>
          FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
      </div>

      {/* SEARCH BOX */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 48,
        border: `1px solid ${loading ? 'var(--orange)' : 'var(--border-light)'}`,
        background: 'var(--card)',
        transition: 'border-color 0.2s',
        boxShadow: loading ? '0 0 0 1px var(--orange)' : 'none',
      }}>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch()}
          placeholder="City (e.g. Topeka)"
          disabled={loading}
          style={{
            flex: 1, padding: '18px 24px',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14,
            letterSpacing: 1,
          }}
        />
        <div style={{ width: 1, background: 'var(--border-light)' }} />
        <select
          value={state}
          onChange={e => setState(e.target.value)}
          disabled={loading}
          style={{
            width: 100, padding: '18px 16px',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14,
            cursor: 'pointer', appearance: 'none',
          }}
        >
          {STATES.map(s => <option key={s} value={s} style={{ background: 'var(--dark)' }}>{s}</option>)}
        </select>
        <button
          onClick={runSearch}
          disabled={loading || !city.trim()}
          style={{
            padding: '18px 32px',
            background: loading ? '#333' : 'var(--orange)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2,
            color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'SCANNING...' : 'SEARCH'}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ marginBottom: 48 }}>
          <div style={{
            height: 2, background: 'var(--border)',
            position: 'relative', overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              position: 'absolute', left: '-40%', width: '40%', height: '100%',
              background: 'var(--orange)',
              animation: 'loadSlide 1s ease-in-out infinite',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LOADING_STEPS.map((step, i) => (
              <div key={step} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10,
                color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--orange)' : '#333',
                transition: 'color 0.3s',
              }}>
                <span style={{ fontSize: 8 }}>
                  {i < currentStep ? '●' : i === currentStep ? '◐' : '○'}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{
          padding: '16px 20px', border: '1px solid var(--red)',
          background: 'rgba(255,23,68,0.05)', color: 'var(--red)',
          fontFamily: "'DM Mono', monospace", fontSize: 12,
          letterSpacing: 1, marginBottom: 32,
        }}>
          {error}
        </div>
      )}

      {/* RESULTS */}
      {searched && !loading && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 24,
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {searchLabel} — Medicare Agents
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
              color: 'var(--orange)',
            }}>
              {agents.length} FOUND
            </div>
          </div>

          {agents.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 0',
              background: 'var(--card)', border: '1px solid var(--border)',
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
                color: '#222', marginBottom: 12,
              }}>
                NO AGENTS FOUND
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                Try a different city or check your SerpAPI key.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 2 }}>
              {agents.map((agent, i) => (
                <AgentCard key={i} agent={agent} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
