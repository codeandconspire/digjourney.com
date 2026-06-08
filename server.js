if (!process.env.HEROKU) require('dotenv/config')

const jalla = require('jalla')
const dedent = require('dedent')
const body = require('koa-body')
const compose = require('koa-compose')
const { get, post } = require('koa-route')
const prismic = require('@prismicio/client')
const routeMap = require('./lib/redirects')
const { resolve } = require('./components/base')

const REPOSITORY = 'digjourney'

const app = jalla('index.js', {
  watch: !process.env.HEROKU,
  serve: Boolean(process.env.HEROKU)
})

/**
 * Redirects
 * Should be moved to a DNS layer…
 */
const TRAILING_SLASH = '(/)?'

Object.keys(routeMap).forEach(function (route, index) {
  app.use(
    get(route + TRAILING_SLASH, function (ctx) {
      ctx.status = 301
      ctx.redirect(routeMap[route])
    })
  )
})

/**
 * Image proxy (local dev only)
 * In production the `/media/*` route is served by a Cloudflare Pages Function
 * (functions/media/[[path]].js) which resizes via Cloudflare Image
 * Transformations. Locally there is no edge transform, so just stream the
 * original Prismic source through — unoptimised, but enough for development.
 */
app.use(
  get(
    '/media/:type/:transform/:uri(.+)',
    async function (ctx, type, transform, uri) {
      if (ctx.querystring) uri += `?${ctx.querystring}`
      const res = await fetch(decodeURIComponent(uri))
      ctx.assert(res.ok, res.status, 'Could not fetch image')
      ctx.set('Content-Type', res.headers.get('content-type') || 'image/jpeg')
      ctx.set('Cache-Control', `public, max-age=${60 * 60 * 24 * 365}`)
      ctx.body = Buffer.from(await res.arrayBuffer())
    }
  )
)

/**
 * Handle Prismic previews
 * Capture the preview token, setting it as a cookie and redirect to the
 * document being previewed. The Prismic library will pick up the cookie and use
 * it for fetching content.
 */
app.use(
  get('/api/prismic-preview', async function (ctx) {
    const { token, documentId } = ctx.query
    const maxAge =
      process.env.NODE_ENV === 'development'
        ? Date.now() + 1000 * 60 * 60 * (24 - new Date().getHours())
        : Date.now() + 1000 * 60 * 30

    const endpoint = prismic.getEndpoint(REPOSITORY)
    const client = prismic.createClient(endpoint, { fetch })

    // Get document preview url
    let href = await client.resolvePreviewURL({
      linkResolver: resolve,
      defaultURL: '/?preview',
      documentID: documentId,
      previewToken: token
    })

    // Append preview query
    href += `${href.includes('?') ? '&' : '?'}preview`

    ctx.set('Cache-Control', 'max-age=0, private, no-cache')
    ctx.cookies.set(prismic.cookie.preview, token, {
      maxAge,
      overwrite: true,
      httpOnly: false,
      signed: false
    })

    ctx.redirect(href)
  })
)

/**
 * Forward subscription requests to HubSpot
 */
app.use(
  post(
    '/api/subscribe',
    compose([
      body({ multipart: true }),
      async function (ctx, next) {
        ctx.set('Cache-Control', 'private, no-cache')
        try {
          const { email, name } = ctx.request.body

          // Honeypot: silently accept but do nothing if filled
          if (typeof name === 'string' && name.trim() !== '') {
            if (ctx.accepts('html')) {
              ctx.redirect('back')
            } else {
              ctx.body = {}
              ctx.type = 'application/json'
            }
            return
          }

          ctx.assert(email, 400, 'Email is required')

          // Try and create a new contact, don't bother with errors
          await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
              authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              properties: {
                email
              }
            })
          })

          // Try and subscribe the new contact, don't bother with errors
          await fetch(
            'https://api.hubapi.com/communication-preferences/v3/subscribe',
            {
              method: 'POST',
              headers: {
                authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                emailAddress: email,
                legalBasis: 'CONSENT_WITH_NOTICE',
                subscriptionId: process.env.HUBSPOT_SUBSCRIPTION_ID,
                legalBasisExplanation:
                  'User opted in through the newsletter signup form.'
              })
            }
          )

          if (ctx.accepts('html')) {
            ctx.redirect('back')
          } else {
            ctx.body = {}
            ctx.type = 'application/json'
          }
        } catch (err) {
          console.error(err)
          if (ctx.accepts('html')) {
            ctx.redirect('back')
          } else {
            ctx.throw(400, 'Could not subscribe')
          }
        }
      }
    ])
  )
)

/**
 * Capture requests for pages at the site root and redirect pages with a parent
 * to their proper url
 */
app.use(
  get('/:slug', async function (ctx, slug, next) {
    if (!ctx.accepts('html')) return next()

    const endpoint = prismic.getEndpoint(REPOSITORY)
    const client = prismic.createClient(endpoint, { fetch })

    client.enableAutoPreviewsFromReq(ctx.req)

    try {
      const doc = await client.getByUID('page', slug)
      if (!doc.data.parent || !doc.data.parent.id) return next()
      ctx.redirect(resolve(doc))
    } catch (err) {
      return next()
    }
  })
)

/**
 * Disallow robots anywhere but in production
 */
app.use(
  get('/robots.txt', function (ctx, next) {
    ctx.type = 'text/plain'
    ctx.body = dedent`
    User-agent: *
    Disallow: ${app.env === 'production' ? '' : '/'}
  `
  })
)

/**
 * Set cache headers for HTML pages
 * By caching HTML on our edge servers (Cloudflare) we keep response times and
 * hosting costs down. The `s-maxage` property tells Cloudflare to cache the
 * response for a month whereas we set the `max-age` to cero to prevent clients
 * from caching the response
 */
app.use(function (ctx, next) {
  if (!ctx.accepts('html')) return next()
  const previewCookie = ctx.cookies.get(prismic.cookie.preview)
  if (previewCookie) {
    ctx.set('Cache-Control', 'no-cache, private, max-age=0')
  } else {
    if (app.env !== 'development') {
      ctx.set('Cache-Control', `s-maxage=${60 * 60 * 24 * 7}, max-age=0`)
    }
  }

  return next()
})

app.listen(process.env.PORT || 8081)
