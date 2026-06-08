/**
 * Prismic preview entry point (Cloudflare Pages Function).
 *
 * Ports `/api/prismic-preview` from server.js. Resolves the preview URL for the
 * document being previewed, sets the (non-httpOnly) Prismic preview cookie so
 * the browser-side Choo app + Prismic toolbar pick it up, and redirects there
 * with `?preview`. The static page then re-fetches live draft content
 * client-side (stores/prismic.js handles this).
 */

import * as prismic from '@prismicio/client'

const REPOSITORY = 'digjourney'
const THIRTY_MINUTES = 60 * 30

export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const token = url.searchParams.get('token')
  const documentId = url.searchParams.get('documentId')

  if (!token) return new Response('Missing preview token', { status: 400 })

  const endpoint = prismic.getEndpoint(REPOSITORY)
  const client = prismic.createClient(endpoint, { fetch })

  let href = await client.resolvePreviewURL({
    linkResolver: resolve,
    defaultURL: '/?preview',
    documentID: documentId,
    previewToken: token
  })

  href += `${href.includes('?') ? '&' : '?'}preview`

  const headers = new Headers({
    location: href,
    'cache-control': 'max-age=0, private, no-cache'
  })
  headers.append(
    'set-cookie',
    `${prismic.cookie.preview}=${token}; Path=/; Max-Age=${THIRTY_MINUTES}; SameSite=Lax`
  )

  return new Response(null, { status: 302, headers })
}

// Prismic link resolver — mirrors components/base resolve() (URL mapping only,
// kept inline so this Function doesn't bundle the choo/html view dependencies).
function resolve(doc) {
  let root = ''
  const parent = doc.data && doc.data.parent
  if (parent && parent.id && !parent.isBroken) root = `/${parent.uid}`

  switch (doc.type) {
    case 'website':
    case 'homepage':
      return '/'
    case 'post_listing':
      return '/insikter'
    case 'post':
      return `/insikter/${doc.uid}`
    case 'event_listing':
      return '/evenemang'
    case 'event':
      return `/evenemang/${doc.uid}`
    case 'product_listing':
      return '/forelasning'
    case 'product':
      return `/forelasning/${doc.uid}`
    case 'course_listing':
      return '/utbildning'
    case 'course':
      return `/utbildning/${doc.uid}`
    case 'page':
      return `${root}/${doc.uid}`
    default:
      return '/'
  }
}
