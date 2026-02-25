import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Terms of Service</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12, color: 'var(--white)' }}>
          THE RULES<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 48 }}>Last updated: February 2026</p>

        {[
          { title: '1. Acceptance', body: 'By creating an account or using Recruiterrr, you agree to these Terms of Service. If you do not agree, do not use the service. These terms are between you and InsuraSafe, LLC.' },
          { title: '2. Service Description', body: 'Recruiterrr is an agent intelligence platform that aggregates publicly available data to help insurance recruiters identify and score independent agents. We do not guarantee the accuracy, completeness, or timeliness of search results.' },
          { title: '3. Permitted Use', body: 'You may use Recruiterrr for lawful recruiting, business development, and market research within the insurance industry. You may not use the service to harass, stalk, or target individuals in ways unrelated to legitimate business outreach.' },
          { title: '4. Prohibited Use', body: 'You may not attempt to scrape, copy, or export data in bulk outside of features we provide. You may not use the platform for any purpose that violates applicable law, including any consumer protection or privacy regulations.' },
          { title: '5. Account Responsibility', body: 'You are responsible for maintaining the security of your account credentials. You may not share your account with other individuals. One account per person. Suspected account sharing may result in suspension.' },
          { title: '6. Rate Limits', body: 'We enforce fair use rate limits on searches. These limits exist to protect service quality for all users. Attempting to circumvent rate limits will result in account suspension.' },
          { title: '7. Data Accuracy Disclaimer', body: 'Search results are based on publicly available data and AI analysis. They are provided for informational purposes only. We make no warranties regarding the accuracy of agent scores, carrier information, or other details. Always verify information independently before making business decisions.' },
          { title: '8. Intellectual Property', body: 'The Recruiterrr platform, branding, and software are owned by InsuraSafe, LLC. You may not copy, modify, or distribute any part of the platform without written permission.' },
          { title: '9. Termination', body: 'We reserve the right to suspend or terminate accounts that violate these terms, at our discretion. You may cancel your account at any time by contacting support.' },
          { title: '10. Limitation of Liability', body: 'InsuraSafe, LLC is not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability for any claim is limited to the amount you paid us in the 30 days prior to the claim.' },
          { title: '11. Governing Law', body: 'These terms are governed by the laws of the State of Kansas, without regard to conflict of law principles.' },
          { title: '12. Contact', body: 'Questions about these terms? Email legal@recruiterrr.com. InsuraSafe, LLC, Topeka, Kansas.' },
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
