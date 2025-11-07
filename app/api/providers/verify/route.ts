import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.findFirst({
      where: { claimToken: token }
    })

    if (!provider) {
      return new NextResponse(
        '<html><body><h1>Invalid or Expired Token</h1><p>This verification link is invalid or has already been used.</p></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Verify the provider
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        status: 'VERIFIED',
        claimToken: null,
        claimVerifiedAt: new Date()
      }
    })

    // Redirect to provider page with success message
    return NextResponse.redirect(
      `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/provider/${provider.slug}?verified=1`
    )
  } catch (error: any) {
    console.error('Verify error:', error)
    return new NextResponse(
      '<html><body><h1>Verification Failed</h1><p>An error occurred during verification. Please try again.</p></body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}
