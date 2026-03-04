import PageHeader from '@/components/ui/PageHeader'

const SECTIONS = [
  {
    title: '1. Acceptance',
    body: 'By creating an account or using Recruiterrr, you agree to these Terms of Service. If you do not agree, do not use the service. These terms are between you and InsuraSafe, LLC. We may update these terms from time to time — continued use of the platform after changes constitutes acceptance of the updated terms.'
  },
  {
    title: '2. Service Description',
    body: 'Recruiterrr is an agent intelligence platform that aggregates publicly available data and uses artificial intelligence to help insurance recruiters identify, research, and score independent agents. Features include AI-powered tree prediction (Anathema), FMO/vendor intelligence (Prometheus), contact intelligence (David), and agent search. We do not guarantee the accuracy, completeness, or timeliness of any results. All AI-generated outputs are provided for informational purposes only.'
  },
  {
    title: '3. Subscriptions & Billing',
    body: 'Access to Recruiterrr requires an active paid subscription. Subscriptions are billed monthly at the current listed rate. By subscribing, you authorize InsuraSafe, LLC to charge your payment method on a recurring monthly basis until you cancel. Subscriptions renew automatically each billing period. You may cancel at any time from your account settings or by contacting support@recruiterrr.com. Cancellations take effect at the end of the current paid billing period — you retain full access through that period. We do not offer refunds for partial months or unused time. Pricing is subject to change with 30 days notice.'
  },
  {
    title: '4. Permitted Use',
    body: 'You may use Recruiterrr for lawful recruiting, business development, agent prospecting, and market research within the insurance industry. You may export data from features that support export for your own internal business use. You may not use Recruiterrr as a consumer reporting agency. Results from this platform may not be used as a basis for any decision covered by the Fair Credit Reporting Act (FCRA), including employment screening, credit decisions, insurance underwriting, or housing decisions.'
  },
  {
    title: '5. Prohibited Use',
    body: 'You may not: (a) attempt to scrape, copy, or systematically extract platform data beyond what export features provide; (b) use exported data to build a competing product or database; (c) resell, sublicense, or redistribute platform data or results to third parties; (d) share your account credentials with other individuals; (e) use the platform to harass, stalk, or target individuals outside of legitimate business outreach; (f) attempt to reverse-engineer, decompile, or circumvent any part of the platform; or (g) use the platform in violation of any applicable law or regulation.'
  },
  {
    title: '6. Your Data',
    body: 'The research you conduct, observations you confirm, and data you export are yours. We do not share your specific research results or database with other users of the platform. Each account operates in its own isolated data environment. Your activity may contribute in anonymized, aggregate form to improving platform intelligence models — for example, helping the system recognize new partner organizations — but your specific research, confirmed data, and exports are never shared with competitors or other users. See our Privacy Policy for full details.'
  },
  {
    title: '7. Exported Data',
    body: 'Data exported from Recruiterrr is licensed for your internal business use only. Exported data may not be resold, redistributed, or used to build competing products or databases. You are responsible for ensuring your use of exported data complies with all applicable laws, including but not limited to CAN-SPAM, TCPA, and applicable state privacy laws. Recruiterrr makes no warranties regarding the accuracy or completeness of exported data.'
  },
  {
    title: '8. AI Disclaimer',
    body: 'Many platform features are powered by artificial intelligence. AI-generated results — including tree predictions, sub-IMO detection, FMO scoring, and contact intelligence — are produced from publicly available data and automated analysis. These results may contain errors, omissions, or outdated information. They are provided for research and informational purposes only. InsuraSafe, LLC makes no representations or warranties regarding the accuracy of AI-generated outputs. Always verify information independently before making business decisions.'
  },
  {
    title: '9. Account Responsibility',
    body: 'You are responsible for maintaining the security of your account credentials. You may not share your account with other individuals. One active subscription per person. Suspected account sharing may result in immediate suspension without refund. You are responsible for all activity that occurs under your account.'
  },
  {
    title: '10. Rate Limits',
    body: 'We enforce fair use rate limits on scans and searches. These limits exist to protect service quality for all users and manage infrastructure costs. Attempting to circumvent rate limits through automation, scripting, or any other method will result in account suspension.'
  },
  {
    title: '11. Intellectual Property',
    body: 'The Recruiterrr platform, branding, software, AI models, and proprietary intelligence systems are owned by InsuraSafe, LLC. You may not copy, modify, distribute, or create derivative works from any part of the platform without written permission. Your use of the platform does not grant you any ownership rights in the underlying technology or data models.'
  },
  {
    title: '12. Termination',
    body: 'We reserve the right to suspend or terminate accounts that violate these terms, at our discretion, without refund. You may cancel your subscription at any time. Upon termination, your access to the platform ends at the close of the current billing period. You may request deletion of your data at any time per our Privacy Policy.'
  },
  {
    title: '13. Limitation of Liability',
    body: 'InsuraSafe, LLC is not liable for indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to lost profits, lost data, or business interruption. Our total liability for any claim arising from your use of Recruiterrr is limited to the amount you paid us in the 30 days prior to the claim. Some jurisdictions do not allow these limitations — in those cases, liability is limited to the maximum extent permitted by law.'
  },
  {
    title: '14. Governing Law',
    body: 'These terms are governed by the laws of the State of Kansas, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in Shawnee County, Kansas.'
  },
  {
    title: '15. Contact',
    body: 'Questions about these terms? Email legal@recruiterrr.com. InsuraSafe, LLC, Topeka, Kansas.'
  },
]

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="Terms of Service" title="THE RULES" accent="." />
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 48 }}>Last updated: March 2026</p>

      {SECTIONS.map(s => (
        <div key={s.title} style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{s.title}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>{s.body}</div>
        </div>
      ))}
    </div>
  )
}
