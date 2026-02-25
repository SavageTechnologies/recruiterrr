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
          {
            title: 'What We Collect',
            body: 'When you create an account, we collect your name and email address. When you use the platform, we store your search activity and results so you can access them from your dashboard. Billing information is handled entirely by our payment processor — we never see or store your card details.',
          },
          {
            title: 'How We Use It',
            body: 'We use your data to operate the platform, surface your search history, and improve the product over time. We use aggregate, anonymized usage patterns to understand how the product is being used. We do not sell, rent, or share your personal data with third parties for marketing purposes — ever.',
          },
          {
            title: 'Agent Data',
            body: 'The agent intelligence in our platform is sourced from publicly available information — public business listings, public websites, public job postings, and publicly accessible content. We do not collect or store personal consumer data. Recruiterrr is not a consumer reporting agency and our data should not be used as a basis for any FCRA-covered decision.',
          },
          {
            title: 'Cookies & Tracking',
            body: 'We use cookies strictly for authentication and session management. We do not use advertising trackers, third-party analytics pixels, or behavioral tracking cookies.',
          },
          {
            title: 'Data Security',
            body: 'All data is encrypted in transit and at rest. Access controls are enforced at the database level so your data is isolated from other users. We maintain security best practices throughout the stack.',
          },
          {
            title: 'Data Deletion',
            body: 'You can request deletion of your account and all associated data at any time by emailing support@recruiterrr.com. We will process all deletion requests within 30 days.',
          },
          {
            title: 'Contact',
            body: 'Questions about this policy? Reach us at privacy@recruiterrr.com. InsuraSafe, LLC — Topeka, Kansas.',
          },
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
