/**
 * Worker de Power-Grid : sert l'application et, quand le secret MAINTENANCE_CODE existe,
 * la remplace par la page de maintenance. Le code d'accès est vérifié ici, côté serveur.
 * Même mécanisme que ridatic.com. Supprimer le secret rouvre le site.
 */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  MAINTENANCE_CODE?: string
}

const COOKIE = 'acces'
/** Adresse discrète du formulaire de code : la page de maintenance n'affiche aucun champ. */
const ACCESS_PATH = '/access'
const DURATION = 60 * 60 * 24 * 30
const encoder = new TextEncoder()

/** Empreinte du code : le cookie ne contient jamais le code lui-même et s'invalide si le code change. */
async function digest(code: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(code), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('power-grid-acces'))
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sameCode(given: string, expected: string) {
  const [a, b] = await Promise.all([digest(given), digest(expected)])
  return a === b
}

function hasAccess(request: Request, expectedDigest: string) {
  const cookies = request.headers.get('Cookie') ?? ''
  return cookies.split(';').some((part) => part.trim() === `${COOKIE}=${expectedDigest}`)
}

function redirect(location: string, headers: Record<string, string> = {}) {
  return new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store', ...headers } })
}

/** Ajoute l'état de la maintenance dans la réponse : permet de vérifier d'un coup d'œil que le Worker tourne et lit le secret. */
function withState(response: Response, state: 'on' | 'off') {
  const copy = new Response(response.body, response)
  copy.headers.set('X-Maintenance', state)
  return copy
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const code = env.MAINTENANCE_CODE?.trim()
    const url = new URL(request.url)
    if (!code) {
      return url.pathname === ACCESS_PATH ? redirect('/') : withState(await env.ASSETS.fetch(request), 'off')
    }

    const expected = await digest(code)
    const grant = () => redirect('/', { 'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=${DURATION}; HttpOnly; Secure; SameSite=Lax` })

    if (request.method === 'POST' && url.pathname === ACCESS_PATH) {
      const form = await request.formData().catch(() => null)
      const given = String(form?.get('code') ?? '').trim()
      return given && (await sameCode(given, code)) ? grant() : redirect(`${ACCESS_PATH}?e=1`)
    }

    const link = url.searchParams.get('acces')
    if (link !== null) return (await sameCode(link.trim(), code)) ? grant() : redirect(`${ACCESS_PATH}?e=1`)

    if (hasAccess(request, expected)) {
      return url.pathname === ACCESS_PATH ? redirect('/') : withState(await env.ASSETS.fetch(request), 'on')
    }

    const target = url.pathname === ACCESS_PATH ? ACCESS_PATH : '/maintenance'
    const page = await env.ASSETS.fetch(new Request(new URL(target, url), { method: 'GET' }))
    const headers = new Headers(page.headers)
    headers.set('Cache-Control', 'no-store')
    headers.set('Retry-After', '3600')
    headers.set('X-Maintenance', 'on')
    headers.set('X-Robots-Tag', 'noindex, nofollow')
    return new Response(request.method === 'HEAD' ? null : page.body, { status: target === ACCESS_PATH ? 200 : 503, headers })
  },
}
