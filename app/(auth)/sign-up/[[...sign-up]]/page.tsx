import { redirect } from 'next/navigation'

// Auth is now handled on the main page at /
export default function SignUpPage() {
  redirect('/?mode=signup')
}
