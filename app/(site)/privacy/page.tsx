const SECTIONS = [
  { title: 'What We Collect', body: 'When you create an account, we collect your name and email address. When you use the platform, we store your search activity, scan results, and observations so you can access them from your dashboard. Billing information is handled entirely by Stripe, our payment processor — we never see or store your card details. We collect usage data such as scan counts, feature activity, and session information to operate and improve the platform.' },
  { title: 'How We Use It', body: 'We use your data to operate the platform, surface your search history, and improve the product over time. Aggregate, anonymized usage patterns — such as which features are used most and how scans perform — are used to improve platform intelligence and model accuracy. This means your activity helps make Recruiterrr smarter for everyone, but your specific research, confirmed observations, and exported data are never shared with other users. Competitors using Recruiterrr do not have access to your data. We do not sell, rent, or share your personal data with third parties for marketing purposes — ever.' },
  { title: 'Your Research Is Yours', body: 'The scans you run, the agents you research, the observations you confirm, and any data you export belong to you. We do not share your specific research results or database with any other user of the platform. Each user account operates in its own isolated data environment. Where your activity contributes to platform improvements, it does so only in aggregate and anonymized form — never in a way that reveals your specific research to a competitor.' },
  { title: 'Platform Intelligence', body: 'Recruiterrr uses AI models and a continuously improving intelligence layer to power features like Anathema and Prometheus. When you use the platform, your scans may contribute to improving the accuracy of these models — for example, by helping the system recognize new FMO names or refine prediction signals. This enrichment process uses anonymized signal data only. Your confirmed observations, exported lists, and personal notes are never used for this purpose.' },
  { title: 'Agent Data', body: 'The agent intelligence in our platform is sourced from publicly available information — public business listings, public websites, public social media profiles, public job postings, and publicly accessible content. We do not collect or store personal consumer data. Recruiterrr is not a consumer reporting agency and our data should not be used as a basis for any FCRA-covered decision, including employment, credit, insurance underwriting, or housing decisions.' },
  { title: 'AI-Generated Results', body: 'Many features on this platform — including tree prediction, sub-IMO detection, and contact intelligence — are powered by artificial intelligence and machine learning. Results are generated from publicly available data and are provided for informational and research purposes only. AI-generated results may contain errors, omissions, or outdated information. Always verify independently before acting on any result.' },
  { title: 'Billing & Subscriptions', body: 'Subscription billing is processed by Stripe. By subscribing, you authorize recurring monthly charges to your payment method. Subscriptions renew automatically each month until cancelled. You may cancel at any time from your account settings or by contacting support@recruiterrr.com. Cancellations take effect at the end of the current billing period — you retain access through the period you have paid for. We do not offer refunds for partial months.' },
  { title: 'Cookies & Tracking', body: 'We use cookies strictly for authentication and session management. We do not use advertising trackers, third-party analytics pixels, or behavioral tracking cookies.' },
  { title: 'Data Security', body: 'All data is encrypted in transit and at rest. Access controls are enforced at the database level so your research data is isolated from other users. We maintain security best practices throughout the stack.' },
  { title: 'Data Deletion', body: 'You can request deletion of your account and all associated data at any time by emailing support@recruiterrr.com. We will process all deletion requests within 30 days. Note that anonymized, aggregate signal data that has already been incorporated into platform models cannot be individually reversed, but your personal account data, research history, and confirmed observations will be fully deleted.' },
  { title: 'Contact', body: 'Questions about this policy? Reach us at privacy@recruiterrr.com. InsuraSafe, LLC — Topeka, Kansas.' },
]

export default function PrivacyPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">Privacy Policy</div>
          <h1 className="site-h1">YOUR DATA<span>.</span></h1>
          <p className="site-lead" style={{ maxWidth: 460 }}>Last updated: March 2026</p>
        </div>
      </section>

      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 36 }}>
            {SECTIONS.map(s => (
              <div key={s.title}>
                <div className="site-label" style={{ marginBottom: 12 }}>{s.title}</div>
                <p className="site-body" style={{ fontSize: 14, lineHeight: 1.85 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
