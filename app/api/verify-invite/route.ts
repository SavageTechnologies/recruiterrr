import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  const valid = typeof code === 'string' &&
    code.trim().toUpperCase() === process.env.INVITE_CODE?.toUpperCase()

  if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 403 })

  const cookieStore = await cookies()
  cookieStore.set('invite_verified', 'true', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60, // 1 hour
    sameSite: 'strict',
  })

  return NextResponse.json({ ok: true })
}
