'use client'

import React from 'react'

const mono = "'DM Mono', monospace"
const sans = "'DM Sans', sans-serif"
const bebas = "'Bebas Neue', sans-serif"

const sectionHead: React.CSSProperties = {
  fontFamily: mono, fontSize: 10, letterSpacing: 2, color: 'white',
  textTransform: 'uppercase', marginBottom: 8, marginTop: 28,
}
const bodyText: React.CSSProperties = {
  fontFamily: sans, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8,
}

export default function PrivacyPanel() {
  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>Legal</div>
      <h2 style={{ fontFamily: bebas, fontSize: 48, letterSpacing: 2, color: 'white', lineHeight: 0.95, marginBottom: 24 }}>
        PRIVACY<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>POLICY.</span>
      </h2>
      <p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 28 }}>InsuraSafe, LLC — Topeka, Kansas</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 4 }} />

      <p style={sectionHead}>What We Collect</p>
      <p style={bodyText}>When you create an account, we collect your name and email address. When you use the platform, we store your search activity, scan results, and observations so you can access them from your dashboard. Billing information is handled entirely by Stripe — we never see or store your card details. We collect usage data such as scan counts, feature activity, and session information to operate and improve the platform.</p>

      <p style={sectionHead}>How We Use It</p>
      <p style={bodyText}>We use your data to operate the platform, surface your search history, and improve the product over time. Aggregate, anonymized usage patterns are used to improve platform intelligence and model accuracy. Your specific research, confirmed observations, and exported data are never shared with other users. Competitors using Recruiterrr do not have access to your data. We do not sell, rent, or share your personal data with third parties for marketing purposes — ever.</p>

      <p style={sectionHead}>Your Research Is Yours</p>
      <p style={bodyText}>The scans you run, the agents you research, the observations you confirm, and any data you export belong to you. We do not share your specific research results or database with any other user. Each user account operates in its own isolated data environment. Where your activity contributes to platform improvements, it does so only in aggregate and anonymized form — never in a way that reveals your specific research to a competitor.</p>

      <p style={sectionHead}>Platform Intelligence</p>
      <p style={bodyText}>Recruiterrr uses AI models and a continuously improving intelligence layer to power platform features. When you use the platform, your scans may contribute to improving model accuracy — for example, by helping the system recognize new FMO names or refine prediction signals. This enrichment process uses anonymized signal data only. Your confirmed observations, exported lists, and personal notes are never used for this purpose.</p>

      <p style={sectionHead}>Agent Data</p>
      <p style={bodyText}>The agent intelligence in our platform is sourced from publicly available information — public business listings, public websites, public social media profiles, public job postings, and publicly accessible content. We do not collect or store personal consumer data. Recruiterrr is not a consumer reporting agency and our data should not be used as a basis for any FCRA-covered decision, including employment, credit, insurance underwriting, or housing decisions.</p>

      <p style={sectionHead}>AI-Generated Results</p>
      <p style={bodyText}>Many features on this platform are powered by artificial intelligence and machine learning. Results are generated from publicly available data and are provided for informational and research purposes only. AI-generated results may contain errors, omissions, or outdated information. Always verify independently before acting on any result.</p>

      <p style={sectionHead}>Billing & Subscriptions</p>
      <p style={bodyText}>Subscription billing is processed by Stripe. By subscribing, you authorize recurring monthly charges to your payment method. Subscriptions renew automatically each month until cancelled. You may cancel at any time from your account settings or by contacting support@recruiterrr.com. Cancellations take effect at the end of the current billing period. We do not offer refunds for partial months.</p>

      <p style={sectionHead}>Cookies & Tracking</p>
      <p style={bodyText}>We use cookies strictly for authentication and session management. We do not use advertising trackers, third-party analytics pixels, or behavioral tracking cookies.</p>

      <p style={sectionHead}>Data Security</p>
      <p style={bodyText}>All data is encrypted in transit and at rest. Access controls are enforced at the database level so your research data is isolated from other users. We maintain security best practices throughout the stack.</p>

      <p style={sectionHead}>Data Deletion</p>
      <p style={bodyText}>You can request deletion of your account and all associated data at any time by emailing support@recruiterrr.com. We will process all deletion requests within 30 days. Anonymized, aggregate signal data already incorporated into platform models cannot be individually reversed, but your personal account data, research history, and confirmed observations will be fully deleted.</p>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 32, marginBottom: 20 }} />
      <p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>
        Questions? <a href="mailto:privacy@recruiterrr.com" style={{ color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>privacy@recruiterrr.com</a>
      </p>
    </div>
  )
}
