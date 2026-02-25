import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const POSTS = [
  { handle: '@jgreenfeld_fmo', time: '2 days ago', text: 'ran a search on tulsa this morning. had 3 HOT agents on the phone by noon. one of them is already contracted. this is insane.' },
  { handle: '@recruitmedicare', time: '4 days ago', text: 'the hiring badge is underrated. found an agency in phoenix that was actively posting for medicare sales reps. called the owner directly. he said he wanted to join an FMO not hire someone himself lol. easy win.' },
  { handle: '@imobuilderdave', time: '6 days ago', text: 'used to buy lists from databrokers for $400. recruiterrr costs less and the data is 10x better because it\'s live. no-brainer.' },
  { handle: '@seniorbenefitspro', time: '1 week ago', text: 'the youtube badge found a guy who had 12 medicare explainer videos and 800 subscribers. completely independent. hadn\'t heard of us. now he\'s our top producer.' },
  { handle: '@fmolife', time: '1 week ago', text: 'searched my own city to test it. it found my agency, scored me HOT, and correctly identified my 4 carriers. product works.' },
  { handle: '@healthbizbuilder', time: '9 days ago', text: 'previously spent 2 hours per market doing manual google research. recruiterrr does it in 90 seconds. i can cover 10 markets a day now vs 2.' },
  { handle: '@agentgrowthlab', time: '11 days ago', text: 'the cold score is as valuable as the hot score. now i know exactly who NOT to call. saves as much time as the hot list.' },
  { handle: '@medicaregrowth', time: '2 weeks ago', text: 'asked it to find agents in a small town in rural kansas. found 6 agents, 2 were HOT. called both. one is setting a meeting next week. i would never have found these guys without this tool.' },
]

export default function WallPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>The Wall</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12, color: 'var(--white)' }}>
          WHAT PEOPLE<br /><span style={{ color: 'var(--orange)' }}>ARE SAYING.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#333', fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 48 }}>real feedback. no edits.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {POSTS.map((p, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 1 }}>{p.handle}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>{p.time}</div>
              </div>
              <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic' }}>"{p.text}"</div>
            </div>
          ))}
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
