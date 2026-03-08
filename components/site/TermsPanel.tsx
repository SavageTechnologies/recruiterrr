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

export default function TermsPanel() {
  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>Legal</div>
      <h2 style={{ fontFamily: bebas, fontSize: 48, letterSpacing: 2, color: 'white', lineHeight: 0.95, marginBottom: 24 }}>
        TERMS OF<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>SERVICE.</span>
      </h2>
      <p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 28 }}>InsuraSafe, LLC — Topeka, Kansas</p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 4 }} />

      <p style={sectionHead}>1. Acceptance</p>
      <p style={bodyText}>By creating an account or using Recruiterrr, you agree to these Terms of Service. If you do not agree, do not use the service. These terms are between you and InsuraSafe, LLC. We may update these terms from time to time — continued use of the platform after changes constitutes acceptance of the updated terms.</p>

      <p style={sectionHead}>2. Service Description</p>
      <p style={bodyText}>Recruiterrr is an agent intelligence platform that aggregates publicly available data and uses artificial intelligence to help insurance recruiters identify, research, and score independent agents. Features include Prometheus (FMO/vendor intelligence) and Agent Search. We do not guarantee the accuracy, completeness, or timeliness of any results. All AI-generated outputs are provided for informational purposes only.</p>

      <p style={sectionHead}>3. Subscriptions & Billing</p>
      <p style={bodyText}>Access to Recruiterrr requires an active paid subscription. Subscriptions are billed monthly at the current listed rate. By subscribing, you authorize InsuraSafe, LLC to charge your payment method on a recurring monthly basis until you cancel. You may cancel at any time from your account settings or by contacting support@recruiterrr.com. Cancellations take effect at the end of the current paid billing period. We do not offer refunds for partial months or unused time. Pricing is subject to change with 30 days notice.</p>

      <p style={sectionHead}>4. Permitted Use</p>
      <p style={bodyText}>You may use Recruiterrr for lawful recruiting, business development, agent prospecting, and market research within the insurance industry. You may export data from features that support export for your own internal business use. You may not use Recruiterrr as a consumer reporting agency. Results from this platform may not be used as a basis for any decision covered by the Fair Credit Reporting Act (FCRA), including employment screening, credit decisions, insurance underwriting, or housing decisions.</p>

      <p style={sectionHead}>5. Prohibited Use</p>
      <p style={bodyText}>You may not: (a) attempt to scrape, copy, or systematically extract platform data beyond what export features provide; (b) use exported data to build a competing product or database; (c) resell, sublicense, or redistribute platform data or results to third parties; (d) share your account credentials with other individuals; (e) use the platform to harass, stalk, or target individuals outside of legitimate business outreach; (f) attempt to reverse-engineer or circumvent any part of the platform; or (g) use the platform in violation of any applicable law or regulation.</p>

      <p style={sectionHead}>6. Your Data</p>
      <p style={bodyText}>The research you conduct, observations you confirm, and data you export are yours. We do not share your specific research results or database with other users. Each account operates in its own isolated data environment. Your activity may contribute in anonymized, aggregate form to improving platform intelligence models — but your specific research, confirmed data, and exports are never shared with competitors or other users. See our Privacy Policy for full details.</p>

      <p style={sectionHead}>7. Exported Data</p>
      <p style={bodyText}>Data exported from Recruiterrr is licensed for your internal business use only. Exported data may not be resold, redistributed, or used to build competing products or databases. You are responsible for ensuring your use of exported data complies with all applicable laws, including CAN-SPAM, TCPA, and applicable state privacy laws. Recruiterrr makes no warranties regarding the accuracy or completeness of exported data.</p>

      <p style={sectionHead}>8. AI Disclaimer</p>
      <p style={bodyText}>Many platform features are powered by artificial intelligence. AI-generated results are produced from publicly available data and automated analysis. These results may contain errors, omissions, or outdated information. They are provided for research and informational purposes only. InsuraSafe, LLC makes no representations or warranties regarding the accuracy of AI-generated outputs. Always verify information independently before making business decisions.</p>

      <p style={sectionHead}>9. Account Responsibility</p>
      <p style={bodyText}>You are responsible for maintaining the security of your account credentials. You may not share your account with other individuals. One active subscription per person. Suspected account sharing may result in immediate suspension without refund. You are responsible for all activity that occurs under your account.</p>

      <p style={sectionHead}>10. Rate Limits</p>
      <p style={bodyText}>We enforce fair use rate limits on scans and searches. These limits exist to protect service quality for all users and manage infrastructure costs. Attempting to circumvent rate limits through automation, scripting, or any other method will result in account suspension.</p>

      <p style={sectionHead}>11. Intellectual Property</p>
      <p style={bodyText}>The Recruiterrr platform, branding, software, AI models, and proprietary intelligence systems are owned by InsuraSafe, LLC. You may not copy, modify, distribute, or create derivative works from any part of the platform without written permission. Your use of the platform does not grant you any ownership rights in the underlying technology or data models.</p>

      <p style={sectionHead}>12. Termination</p>
      <p style={bodyText}>We reserve the right to suspend or terminate accounts that violate these terms, at our discretion, without refund. You may cancel your subscription at any time. Upon termination, your access to the platform ends at the close of the current billing period. You may request deletion of your data at any time per our Privacy Policy.</p>

      <p style={sectionHead}>13. Limitation of Liability</p>
      <p style={bodyText}>InsuraSafe, LLC is not liable for indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to lost profits, lost data, or business interruption. Our total liability for any claim arising from your use of Recruiterrr is limited to the amount you paid us in the 30 days prior to the claim.</p>

      <p style={sectionHead}>14. Governing Law</p>
      <p style={bodyText}>These terms are governed by the laws of the State of Kansas, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in Shawnee County, Kansas.</p>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 32, marginBottom: 20 }} />
      <p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>
        Questions? <a href="mailto:legal@recruiterrr.com" style={{ color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>legal@recruiterrr.com</a>
      </p>
    </div>
  )
}
