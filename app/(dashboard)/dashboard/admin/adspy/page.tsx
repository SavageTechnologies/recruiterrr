'use client'

import { useState } from 'react'

type AdResult = {
  advertiser_name: string
  advertiser_page_url: string | null
  ad_text: string
  spend_range: string | null
  start_date: string | null
  is_active: boolean
  platforms: string[]
  ad_type: 'recruiting' | 'sales' | 'brand' | 'unknown'
  recruitable: boolean
  claude_take: string
}

type ContactResult = {
  phone: string | null
  email: string | null
  website: string | null
  found: boolean
}

const KEYWORDS = [
  'Medicare',
  'Medicare Advantage',
  'Medicare supplement',
  'Medicare insurance agent',
  'join my insurance team',
  'become a Medicare agent',
  'turn 65 Medicare',
  'final expense',
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const AD_TYPE_COLOR: Record<string, string> = {
  recruiting: 'var(--green)',
  sales:      'var(--orange)',
  brand:      '#a78bfa',
  unknown:    '#444',
}

export default function AdSpyPage() {
  const [keyword, setKeyword] = useState('Medicare')
  const [stateFilter, setStateFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Record<string, ContactResult & { loading?: boolean }>>({})

  async function findContact(advertiserName: string, pageUrl: string | null) {
    const key = advertiserName
    setContacts(prev => ({ ...prev, [key]: { loading: true, found: false, phone: null, email: null, website: null } }))
    try {
      const res = await fetch('/api/admin/adspy/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: advertiserName, page_url: pageUrl, state: stateFilter }),
      })
      const data = await res.json()
      setContacts(prev => ({ ...prev, [key]: { ...data, loading: false } }))
    } catch {
      setContacts(prev => ({ ...prev, [key]: { loading: false, found: false, phone: null, email: null, website: null } }))
    }
  }
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    ads: AdResult[]
    total: number
    recruitable_count: number
    recruiting_count: number
    keyword: string
  } | null>(null)
  const [filter, setFilter] = useState<'all' | 'recruiting' | 'recruitable'>('recruitable')

  async function runScan() {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/admin/adspy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: stateFilter ? `${keyword} ${stateFilter}` : keyword, country: 'US' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredAds = results?.ads.filter(ad => {
    if (filter === 'recruiting') return ad.ad_type === 'recruiting'
    if (filter === 'recruitable') return ad.recruitable
    return true
  }) || []

  return (
    <div style={{ maxWidth: 1100, padding: '40px 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
          Admin Tool · Experimental
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, lineHeight: 1, marginBottom: 8 }}>
          AD SPY
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.7 }}>
          Scrape the Facebook Ad Library for Medicare-related ads. Reverse into the agencies running them. Find agents spending their own money — those are your best prospects.
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 2, marginBottom: 32 }}>

        {/* Keyword dropdown */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>KEYWORD</div>
          <select
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 13,
              cursor: 'pointer', padding: '18px 0',
            }}
          >
            {KEYWORDS.map(k => (
              <option key={k} value={k} style={{ background: '#1a1814' }}>{k}</option>
            ))}
          </select>
        </div>

        {/* State dropdown */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>STATE</div>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: stateFilter ? 'var(--white)' : 'var(--muted)',
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              cursor: 'pointer', padding: '18px 0',
            }}
          >
            <option value="" style={{ background: '#1a1814' }}>All US</option>
            {US_STATES.map(s => (
              <option key={s} value={s} style={{ background: '#1a1814' }}>{s}</option>
            ))}
          </select>
        </div>

        {/* Run */}
        <button
          onClick={runScan}
          disabled={loading || !keyword.trim()}
          style={{
            padding: '0 40px',
            background: loading ? '#333' : 'var(--orange)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2,
            color: 'var(--black)', whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'SCANNING...' : 'RUN SCAN'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>
            ◐ Firing Apify actor — scraping Facebook Ad Library for "{keyword}"{stateFilter ? ` in ${stateFilter}` : ' across the US'}...
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1, marginTop: 6 }}>
            This takes 60–90 seconds. Apify is doing the heavy lifting.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Summary bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 16 }}>
            {[
              { label: 'Total Ads', value: results.total, color: 'var(--white)' },
              { label: 'Recruitable Agencies', value: results.recruitable_count, color: 'var(--green)' },
              { label: 'Actively Recruiting', value: results.recruiting_count, color: 'var(--orange)' },
              { label: 'Keyword', value: `"${results.keyword}"`, color: 'var(--muted)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '14px 18px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
            {(['recruitable', 'recruiting', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', border: '1px solid var(--border)',
                  background: filter === f ? 'var(--orange)' : 'var(--card)',
                  color: filter === f ? 'var(--black)' : 'var(--muted)',
                  fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2,
                  textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {f === 'recruitable' ? `Recruitable (${results.recruitable_count})` :
                 f === 'recruiting' ? `Recruiting Ads (${results.recruiting_count})` :
                 `All (${results.total})`}
              </button>
            ))}
          </div>

          {/* Ad cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredAds.length === 0 ? (
              <div style={{ padding: '40px', background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444' }}>
                No ads match this filter.
              </div>
            ) : filteredAds.map((ad, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${ad.recruitable ? AD_TYPE_COLOR[ad.ad_type] : '#333'}`,
                  padding: '16px 20px',
                  opacity: ad.recruitable ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                  <div>
                    {/* Advertiser name + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
                        {ad.advertiser_name}
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: 2,
                        padding: '2px 6px', border: `1px solid ${AD_TYPE_COLOR[ad.ad_type]}`,
                        color: AD_TYPE_COLOR[ad.ad_type],
                      }}>
                        {ad.ad_type.toUpperCase()}
                      </div>
                      {ad.recruitable && (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: 2, padding: '2px 6px', border: '1px solid var(--green)', color: 'var(--green)' }}>
                          RECRUITABLE
                        </div>
                      )}
                      {!ad.recruitable && (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: 2, padding: '2px 6px', border: '1px solid #333', color: '#444' }}>
                          CARRIER / NOT RECRUITABLE
                        </div>
                      )}
                    </div>

                    {/* Ad text */}
                    {ad.ad_text && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8, maxWidth: 680 }}>
                        "{ad.ad_text.slice(0, 200)}{ad.ad_text.length > 200 ? '...' : ''}"
                      </div>
                    )}

                    {/* Claude take */}
                    {ad.claude_take && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', lineHeight: 1.5 }}>
                        ◈ {ad.claude_take}
                      </div>
                    )}

                    {/* Contact enrichment */}
                    {(() => {
                      const contact = contacts[ad.advertiser_name]
                      if (!contact) {
                        return ad.recruitable ? (
                          <button
                            onClick={() => findContact(ad.advertiser_name, ad.advertiser_page_url)}
                            style={{
                              marginTop: 10, padding: '5px 12px',
                              background: 'transparent', border: '1px solid var(--green)',
                              color: 'var(--green)', fontFamily: "'DM Mono', monospace",
                              fontSize: 8, letterSpacing: 2, cursor: 'pointer',
                            }}
                          >
                            + FIND CONTACT
                          </button>
                        ) : null
                      }
                      if (contact.loading) {
                        return (
                          <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1 }}>
                            ◐ searching...
                          </div>
                        )
                      }
                      if (!contact.found) {
                        return (
                          <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1 }}>
                            ✕ no contact info found
                          </div>
                        )
                      }
                      return (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {contact.phone && (
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', letterSpacing: 1 }}>
                              ☎ {contact.phone}
                            </div>
                          )}
                          {contact.email && (
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', letterSpacing: 1 }}>
                              ✉ {contact.email}
                            </div>
                          )}
                          {contact.website && (
                            <a href={contact.website} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none' }}>
                              ⬡ {contact.website}
                            </a>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Right side metadata */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    {ad.spend_range && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 1 }}>
                        SPEND: {ad.spend_range}
                      </div>
                    )}
                    {ad.start_date && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1 }}>
                        SINCE: {new Date(ad.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {ad.platforms.length > 0 && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 1 }}>
                        {ad.platforms.slice(0, 2).join(' · ')}
                      </div>
                    )}
                    {ad.advertiser_page_url && (
                      <a
                        href={ad.advertiser_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none' }}
                      >
                        VIEW PAGE →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', lineHeight: 1.7 }}>
            ◎ This is experimental. Data is pulled live from the Facebook Ad Library via Apify — each run costs ~$0.50-1.00 in Apify credits. When this proves useful, replace Apify with direct Meta Ad Library API calls for free.
          </div>
        </>
      )}

      <style>{`
        @keyframes loadSlide {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
