import { ImageResponse } from 'next/og'
import { SITE_URL } from '@/lib/seo'

/**
 * 1200x630 link preview for every provider page.
 *
 * Before 2026-09-17 og:image was the raw logo: small, square, often a
 * transparent PNG, so Slack/iMessage/LinkedIn previews rendered as a blank
 * or a tiny mark on white. This composes the provider's poster (or profile
 * photo, or logo) into a proper card with the name and city. Next's file
 * convention adds og:image and twitter:image with explicit 1200x630.
 *
 * Edge runtime on purpose. The first version ran on Node and returned 500
 * in production for every slug, including missing ones, because Next 14.2's
 * Node build of ImageResponse could not locate its bundled font. Edge has no
 * Prisma, so provider data comes from /api/provider-card/[slug].
 */

export const runtime = 'edge'
export const alt = 'Mobile phlebotomy provider'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Card { ok: boolean; name?: string; city?: string | null; state?: string | null; heroPoster?: string | null; profileImage?: string | null; logo?: string | null }

function absolute(path: string | undefined | null): string | null {
  if (!path) return null
  return path.startsWith('http') ? path : `${SITE_URL}${path}`
}

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  let card: Card = { ok: false }
  try {
    const res = await fetch(`${SITE_URL}/api/provider-card/${encodeURIComponent(params.slug)}`, { next: { revalidate: 3600 } })
    if (res.ok) card = (await res.json()) as Card
  } catch { /* fall through to the generic card */ }

  const name = card.name?.trim() || 'Mobile phlebotomy provider'
  const location = card.city ? `${card.city}, ${card.state}` : card.state || ''
  const photo = absolute(card.heroPoster) || absolute(card.profileImage)
  const logo = absolute(card.logo)
  const eyebrow = `Mobile phlebotomy${location ? ` in ${location}` : ''}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 55%, #06b6d4 100%)', fontFamily: 'sans-serif', position: 'relative' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={560} height={630} style={{ width: 560, height: 630, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 560, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {logo ? (
              <div style={{ display: 'flex', background: '#ffffff', borderRadius: 24, padding: 32 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" width={360} height={360} style={{ width: 360, height: 360, objectFit: 'contain' }} />
              </div>
            ) : null}
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 64px', color: '#ffffff' }}>
          {/* Satori requires a single text child unless the box is flex, so the
              string is built first. */}
          <div style={{ fontSize: 26, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 }}>{eyebrow}</div>
          <div style={{ fontSize: name.length > 28 ? 56 : 68, fontWeight: 700, lineHeight: 1.05, marginTop: 18 }}>{name}</div>
          <div style={{ fontSize: 28, marginTop: 28, opacity: 0.92 }}>At-home blood draws. Licensed and insured. We come to you.</div>
          <div style={{ fontSize: 24, marginTop: 44, opacity: 0.8 }}>mobilephlebotomy.org</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
