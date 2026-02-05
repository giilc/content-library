import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // Redirect to client-side page that handles the auth
  return NextResponse.redirect(`${origin}/auth/confirm`)
}
