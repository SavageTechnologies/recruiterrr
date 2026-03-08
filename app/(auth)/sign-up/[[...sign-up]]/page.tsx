import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f2' }}>
      <SignUp forceRedirectUrl="/dashboard/activate" />
    </div>
  )
}
