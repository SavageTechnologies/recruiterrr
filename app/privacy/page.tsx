import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Privacy Policy</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12, color: 'var(--white)' }}>
          YOUR DATA<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 48 }}>Last updated: February 2026</p>

        {[
          { title: 'What We Collect', body: 'When you sign up, we collect your email address and name via Clerk, our authentication provider. When you run a search, we store the city, state, result count, and the agent data returned. We do not collect payment information directly — billing is handled by Stripe.' },
          { title: 'How We Use It', body: 'Your search history is stored so you can access past results from your dashboard. We use aggregate, anonymized usage data to improve the product. We do not sell, rent, or share your personal data with third parties for marketing purposes.' },
          { title: 'Agent Data', body: 'The agent data in our search results is pulled from publicly available sources — Google local listings, public websites, public job postings, and public YouTube content. We do not store personal consumer data about agents. We are not a consumer reporting agency under FCRA for this data.' },
          { title: 'Cookies', body: 'We use cookies for authentication (via Clerk) and session management. We do not use tracking cookies for advertising.' },
          { title: 'Data Security', body: 'Your data is stored in Supabase with row-level security. We use HTTPS throughout. Authentication is handled by Clerk, which is SOC 2 certified.' },
          { title: 'Third-Party Services', body: 'We use Clerk (authentication), Supabase (database), Upstash (rate limiting), SerpAPI (search data), and Anthropic (AI scoring). Each of these services has their own privacy policies.' },
          { title: 'Data Deletion', body: 'You can request deletion of your account and associated data at any time by emailing support@recruiterrr.com. We will process deletion requests within 30 days.' },
          { title: 'Contact', body: 'Questions about this policy? Email us at privacy@recruiterrr.com. InsuraSafe, LLC, Topeka, Kansas.' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{s.title}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>{s.body}</div>
          </div>
        ))}
      </div>

      <PageFooter />
    </div>
  )
}
