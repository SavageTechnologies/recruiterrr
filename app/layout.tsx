import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recruiterrr — Find. Score. Recruit.',
  description: 'Agent intelligence platform for FMOs and insurance recruiters.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en">
        <head>
          {/* Reads localStorage before paint — prevents flash of wrong theme.
              Default is light; only sets dark if user previously chose it. */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              try {
                var t = localStorage.getItem('recruiterrr_theme');
                if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
              } catch(e) {}
            })();
          `}} />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
