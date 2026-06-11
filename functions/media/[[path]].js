/**
 * Image proxy (Cloudflare Pages Function) backed by Cloudflare Image
 * Transformations.
 *
 * Keeps the legacy `/media/:type/:transform/:uri` URL contract (these URLs are
 * baked into the prerendered HTML/CSS by components/base `src`/`srcset`) by
 * redirecting to the zone's `/cdn-cgi/image/<options>/<source>` endpoint.
 *
 * The redirect is required: the `cf.image` fetch option is only honoured in
 * Workers, not Pages Functions, so transforming inline from here silently
 * returns the original image. `/cdn-cgi/image/` is handled by the Cloudflare
 * edge before the app and transformations must be enabled on the zone
 * (dashboard → Images → Transformations, including remote origins for
 * images.prismic.io and the video thumbnail hosts).
 *
 * The redirect targets the production origin so local `wrangler pages dev`
 * and *.pages.dev previews (where `/cdn-cgi/image/` is unavailable) serve
 * correctly transformed images too.
 *
 * The Cloudinary-style transform tokens are translated to Cloudflare options:
 *   c_fill → fit=cover     f_auto → format=auto (negotiated from Accept)
 *   c_fit  → fit=contain   f_jpg  → format=jpeg
 *   c_crop → fit=crop      q_auto → (default quality)
 *   w_800  → width=800     q_90   → quality=90
 *   h_600  → height=600    g_face → gravity=face
 */

const ORIGIN = 'https://digjourney.com'

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

  const options = mapTransforms(transform)
  const location = options
    ? `${ORIGIN}/cdn-cgi/image/${options}/${target.href}`
    : target.href

  return new Response(null, {
    status: 301,
    headers: {
      Location: location,
      'Cache-Control': `public, max-age=${ONE_YEAR}`
    }
  })
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

// Translate a Cloudinary transform string to a `/cdn-cgi/image/` options
// string.
function mapTransforms(transform) {
  const options = []

  for (const token of transform.split(',')) {
    const sep = token.indexOf('_')
    if (sep === -1) continue
    const key = token.slice(0, sep)
    const value = token.slice(sep + 1)

    switch (key) {
      case 'w': {
        const n = Number(value)
        if (n) options.push(`width=${n}`)
        break
      }
      case 'h': {
        const n = Number(value)
        if (n) options.push(`height=${n}`)
        break
      }
      case 'q': {
        const n = Number(value)
        if (value !== 'auto' && n) options.push(`quality=${n}`)
        break
      }
      case 'c':
        options.push(`fit=${FIT[value] || 'cover'}`)
        break
      case 'f':
        options.push(`format=${value === 'auto' ? 'auto' : FORMAT[value] || value}`)
        break
      case 'g':
        options.push(`gravity=${value}`)
        break
      // ignore unrecognised tokens
    }
  }

  return options.join(',')
}
