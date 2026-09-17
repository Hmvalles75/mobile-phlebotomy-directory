import { ImageResponse } from 'next/og'
import { getProviderBySlug } from '@/lib/providers-db'
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
 * Node runtime on purpose: the provider lookup is Prisma.
 */

export const alt = 'Mobile phlebotomy provider'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

function absolute(path: string | undefined | null): string | null {
  if (!path) return null
  return path.startsWith('http') ? path : `${SITE_URL}${path}`
}

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  const provider = await getProviderBySlug(params.slug)
  const name = provider?.name?.trim() || 'Mobile phlebotomy provider'
  const location = provider?.city ? `${provider.city}, ${provider.state}` : provider?.state || ''
  const photo = absolute(provider?.heroPoster) || absolute(provider?.profileImage)
  const logo = absolute(provider?.logo)

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
          <div style={{ fontSize: 26, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 }}>Mobile phlebotomy{location ? ` in ${location}` : ''}</div>
          <div style={{ fontSize: name.length > 28 ? 56 : 68, fontWeight: 700, lineHeight: 1.05, marginTop: 18 }}>{name}</div>
          <div style={{ fontSize: 28, marginTop: 28, opacity: 0.92 }}>At-home blood draws. Licensed and insured. We come to you.</div>
          <div style={{ fontSize: 24, marginTop: 44, opacity: 0.8 }}>mobilephlebotomy.org</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
