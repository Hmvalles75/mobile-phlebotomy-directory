import { SITE_URL } from './seo'

/**
 * IndexNow — push URL changes to Bing the moment they happen, instead of
 * waiting to be crawled.
 *
 * Worth more here than the usual "nice to have". Bing converts at roughly
 * 4.3% against Google's 1.7% on this site, is plausibly ~40% of search
 * traffic, and produced 2 of the 5 attributed institutional coverage requests
 * — the leads worth 10-100x a consumer draw. Its index also feeds Copilot,
 * ChatGPT search and DuckDuckGo, so this is the closest thing to an AI-visibility
 * lever available.
 *
 * The key is public by design: ownership is proven by serving the same value
 * at /{key}.txt, which is why the file lives in public/. There is nothing
 * secret to leak.
 *
 * Best-effort throughout. A search-engine ping must never fail a provider
 * activation or a page build — every path here swallows its errors and logs.
 */

const INDEXNOW_KEY = '4d7e22371b0a6f6abfca9772df746c63'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS_PER_REQUEST = 10_000

function host(): string {
  return new URL(SITE_URL).hostname
}

/** Absolute URL for a path, tolerating both "/foo" and "foo". */
export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/+$/, '')
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export interface IndexNowResult {
  submitted: number
  ok: boolean
  status?: number
  error?: string
}

/**
 * Submit one or more URLs. Accepts paths or absolute URLs.
 *
 * Returns rather than throws — callers are page builds and admin actions that
 * must not fail because a search engine was unreachable.
 */
export async function submitToIndexNow(paths: string[]): Promise<IndexNowResult> {
  const urlList = Array.from(new Set(paths.map(absoluteUrl)))
  if (urlList.length === 0) return { submitted: 0, ok: true }

  if (urlList.length > MAX_URLS_PER_REQUEST) {
    // Chunk rather than silently truncate — dropping URLs without saying so is
    // exactly the kind of quiet failure that makes indexing bugs unfindable.
    let submitted = 0
    for (let i = 0; i < urlList.length; i += MAX_URLS_PER_REQUEST) {
      const chunk = urlList.slice(i, i + MAX_URLS_PER_REQUEST)
      const r = await submitToIndexNow(chunk)
      if (!r.ok) return { ...r, submitted }
      submitted += r.submitted
    }
    return { submitted, ok: true }
  }

  const body = {
    host: host(),
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL.replace(/\/+$/, '')}/${INDEXNOW_KEY}.txt`,
    urlList,
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    // 200 accepted, 202 accepted-pending-key-validation. Both are success.
    if (res.status === 200 || res.status === 202) {
      console.log(`[IndexNow] ✅ Submitted ${urlList.length} URL(s) — HTTP ${res.status}`)
      return { submitted: urlList.length, ok: true, status: res.status }
    }

    // 403 means the key file isn't reachable; 422 means a URL didn't match the
    // host. Both are worth seeing in logs rather than silently ignoring.
    const text = await res.text().catch(() => '')
    console.warn(`[IndexNow] Rejected with HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
    return { submitted: 0, ok: false, status: res.status, error: text.slice(0, 200) }
  } catch (err: any) {
    console.warn('[IndexNow] Request failed:', err?.message || err)
    return { submitted: 0, ok: false, error: err?.message || String(err) }
  }
}

/** Convenience for the common single-page case. */
export async function submitUrlToIndexNow(path: string): Promise<IndexNowResult> {
  return submitToIndexNow([path])
}
