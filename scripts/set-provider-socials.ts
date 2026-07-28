/**
 * Set the social profile links rendered on a provider's premium page.
 *
 *   npx tsx scripts/set-provider-socials.ts <slug> instagram=@gentletracemobile
 *   npx tsx scripts/set-provider-socials.ts gentle-trace-mobile instagram=https://www.instagram.com/gentletracemobile facebook=@GentleTrace
 *   npx tsx scripts/set-provider-socials.ts gentle-trace-mobile --clear
 *
 * Handles (@name or bare name) are expanded to canonical profile URLs; full
 * https URLs pass through untouched. Only keys the premium template knows about
 * are accepted. Writes providers.socialLinks as a JSON object string.
 */
import { prisma } from '../lib/prisma'

const SOCIAL_KEYS = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'] as const
type SocialKey = typeof SOCIAL_KEYS[number]

const PROFILE_BASE: Record<SocialKey, string> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/@',
  youtube: 'https://www.youtube.com/@',
  linkedin: 'https://www.linkedin.com/in/',
}

function toUrl(key: SocialKey, value: string): string {
  const v = value.trim()
  if (v.startsWith('https://')) return v
  if (v.startsWith('http://')) return v.replace('http://', 'https://')
  if (v.startsWith('www.')) return `https://${v}`
  return PROFILE_BASE[key] + v.replace(/^@/, '')
}

async function main() {
  const [target, ...pairs] = process.argv.slice(2)

  if (!target) {
    console.error('Usage: npx tsx scripts/set-provider-socials.ts <slug|id> instagram=@handle [facebook=...] [--clear]')
    process.exit(1)
  }

  const provider = await prisma.provider.findFirst({
    where: { OR: [{ slug: target }, { id: target }] },
    select: { id: true, name: true, slug: true, premiumPage: true, socialLinks: true },
  })

  if (!provider) {
    console.error(`No provider found for "${target}"`)
    process.exit(1)
  }

  if (pairs.includes('--clear')) {
    await prisma.provider.update({ where: { id: provider.id }, data: { socialLinks: null } })
    console.log(`Cleared social links for ${provider.name}`)
    return
  }

  // Merge onto whatever is already stored so one key can be updated in isolation.
  let links: Record<string, string> = {}
  if (provider.socialLinks) {
    try {
      const parsed = JSON.parse(provider.socialLinks)
      if (parsed && typeof parsed === 'object') links = parsed
    } catch { /* corrupt value — start clean */ }
  }

  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split('=')
    const key = rawKey.toLowerCase() as SocialKey
    const value = rest.join('=')
    if (!SOCIAL_KEYS.includes(key)) {
      console.error(`Unknown key "${rawKey}". Supported: ${SOCIAL_KEYS.join(', ')}`)
      process.exit(1)
    }
    if (!value) {
      delete links[key]
      continue
    }
    links[key] = toUrl(key, value)
  }

  const socialLinks = Object.keys(links).length > 0 ? JSON.stringify(links) : null

  await prisma.provider.update({ where: { id: provider.id }, data: { socialLinks } })

  console.log(`${provider.name} (/provider/${provider.slug})`)
  console.log(`  premiumPage: ${provider.premiumPage}${provider.premiumPage ? '' : '  ← links only render on premium pages'}`)
  console.log(`  socialLinks: ${socialLinks ?? '(none)'}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
