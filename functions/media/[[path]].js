/**
 * Image proxy (Cloudflare Pages Function) backed by Cloudflare Image
 * Transformations.
 *
 * Keeps the legacy `/media/:type/:transform/:uri` URL contract (these URLs are
 * baked into the prerendered HTML/CSS by components/base `src`/`srcset`), but
 * resizes/optimises the remote Prismic source via `cf.image` instead of
 * Cloudinary. Transformations must be enabled on the zone, and responses are
 * cached on Cloudflare's edge.
 *
 * The Cloudinary-style transform tokens are translated to Cloudflare options:
 *   c_fill → fit:cover     f_auto → format negotiated from Accept
 *   c_fit  → fit:contain   f_jpg  → format:jpeg
 *   c_crop → fit:crop      q_auto → (default quality)
 *   w_800  → width:800     q_90   → quality:90
 *   h_600  → height:600    g_face → gravity:face
 */

const ONE_YEAR = 60 * 60 * 24 * 365

const FIT = {
  fill: 'cover',
  fit: 'contain',
  limit: 'scale-down',
  crop: 'crop',
  pad: 'pad',
  scale: 'cover',
  thumb: 'cover'
}

const FORMAT = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  webp: 'webp',
  avif: 'avif'
}

export async function onRequestGet(context) {
  const { request } = context
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/media\/([^/]+)\/([^/]+)\/(.+)$/)
  if (!match) return new Response('Not found', { status: 404 })

  const [, type, transform, rawUri] = match
  let source = decodeURIComponent(rawUri)
  if (url.search) source += url.search

  // For video providers the URI is the embed id (e.g. a YouTube video id),
  // not a full URL — resolve it to the provider's thumbnail. Other types
  // (`fetch`, used for Prismic images) carry a full source URL verbatim.
  let target
  try {
    target = new URL(await resolveSource(type, source))
  } catch (err) {
    return new Response('Invalid source URL', { status: 400 })
  }

  const accept = request.headers.get('Accept') || ''
  const image = mapTransforms(transform, accept)

  const upstream = await fetch(target.href, {
    cf: { image },
    headers: { Accept: accept }
  })
  if (!upstream.ok) {
    return new Response('Upstream image error', { status: upstream.status })
  }

  const headers = new Headers()
  for (const name of [
    'content-type',
    'etag',
    'last-modified',
    'content-length'
  ]) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set('Cache-Control', `public, max-age=${ONE_YEAR}`)

  return new Response(upstream.body, { status: 200, headers })
}

// Resolve a `/media/:type/...` source to a fetchable image URL. Video
// providers pass an embed id that maps to a thumbnail; everything else is
// already a full URL.
async function resolveSource(type, source) {
  switch (type) {
    case 'youtube': {
      // maxresdefault.jpg doesn't exist for every video; fall back to
      // hqdefault.jpg, which is always present.
      const max = `https://i.ytimg.com/vi/${source}/maxresdefault.jpg`
      const ok = await fetch(max, { method: 'HEAD' })
        .then((res) => res.ok)
        .catch(() => false)
      return ok ? max : `https://i.ytimg.com/vi/${source}/hqdefault.jpg`
    }
    case 'vimeo': {
      const oembed = `https://vimeo.com/api/oembed.json?width=1920&url=${encodeURIComponent(
        `https://vimeo.com/${source}`
      )}`
      const data = await fetch(oembed).then((res) => (res.ok ? res.json() : null))
      if (data && data.thumbnail_url) return data.thumbnail_url
      throw new Error('Unable to resolve Vimeo thumbnail')
    }
    default:
      return source
  }
}

// Translate a Cloudinary transform string to Cloudflare `cf.image` options.
function mapTransforms(transform, accept) {
  const image = {}

  for (const token of transform.split(',')) {
    const sep = token.indexOf('_')
    if (sep === -1) continue
    const key = token.slice(0, sep)
    const value = token.slice(sep + 1)

    switch (key) {
      case 'w': {
        const n = Number(value)
        if (n) image.width = n
        break
      }
      case 'h': {
        const n = Number(value)
        if (n) image.height = n
        break
      }
      case 'q': {
        const n = Number(value)
        if (value !== 'auto' && n) image.quality = n
        break
      }
      case 'c':
        image.fit = FIT[value] || 'cover'
        break
      case 'f':
        image.format = value === 'auto' ? 'auto' : FORMAT[value] || value
        break
      case 'g':
        image.gravity = value
        break
      // ignore unrecognised tokens
    }
  }

  // Workers/Functions don't honour format:auto — negotiate from Accept,
  // falling back to the source format (omit) for older clients.
  if (image.format === 'auto') {
    if (accept.includes('image/avif')) image.format = 'avif'
    else if (accept.includes('image/webp')) image.format = 'webp'
    else delete image.format
  }

  return image
}
