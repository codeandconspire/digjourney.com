if (!process.env.HEROKU) require('dotenv/config')

const jalla = require('jalla')
const dedent = require('dedent')
const body = require('koa-body')
const compose = require('koa-compose')
const { get, post } = require('koa-route')
const prismic = require('@prismicio/client')
const mailchimp = require('@mailchimp/mailchimp_marketing')
const purge = require('./lib/purge')
const { resolve } = require('./components/base')
const imageproxy = require('./lib/cloudinary-proxy')

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER
})

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

const routeMap = {
  '/contact': '/kontakt',
  '/om-boken': '/boken-att-leda-digital-transformation',
  '/om-boken/bestall-boken-att-leda-digital-transformation/':
    '/boken-att-leda-digital-transformation',
  '/organisation': 'radgivning',
  '/vad-vi-gor': '/',
  '/en': '/',
  '/tag/konsultutbildning/': '/utbildning',
  '/tag/organisationsstruktur/': '/',
  '/about-methodology': '/metodik-arbetssatt',
  '/jul': '/boken-att-leda-digital-transformation',
  '/tag': '/insikter',
  '/finally-the-book-leading-digital-transformation-is-out-and-we-need-your-help':
    'boken-att-leda-digital-transformation',
  '/vilken-nytta-ger-egentligen-var-utbildning-att-leda-digital-transformation-som-konsult':
    'kunder',
  '/artiklar-och-inspiration': '/insikter',
  '/transformationday-23rd-of-april-2018': '/',
  '/larande-organisation': '/utbildning',
  '/digital-konkurrenskraft':
    '/forelasning/digital-transformationsplan-som-framtidssakrar-din-verksamhet',
  '/digital-transformation': '/radgivning',
  '/forelasningar-workshops': '/forelasningar',
  '/forvandlingen': '/',
  '/innovation': '/radgivning',
  '/om-digjourney': '/vision',
  '/omrostning-vilken-logga-tycker-du-att-vi-skall-ha': '/',
  '/the-digital-maturity-matrix-digital-transformation-with-maximum-roi':
    '/kontakt',
  '/undersokningar': '/',
  '/verktyg-for-digital-transformation': '/digitalt-mognadstest',
  '/fran-gammelgadda-till-mort-branschanalys-av-media-i-sagoform/':
    '/insikter/fran-gammelgadda-till-mort--branschanalys-av-media',
  '/skaraborgsdagen-30-januari-fokuserar-pa-kompetensforsorjning-och-digitalisering':
    '/insikter/skaraborgsdagen-30-januari-fokuserar-pa-kompetensforsorjning',
  '/certifieringskurs-i-ramverket-for-att-leda-digital-transformation-genomfors-i-umea':
    '/insikter/certifieringskurs-i-ramverket-for-att-leda-digital',
  '/yeah-our-tranformationday-at-internetdagarna-a-success':
    '/insikter/our-tranformationdaydigitalization--sustainability',
  '/future-proof-maturity-matrix-en-transformationsmetodik-som-kombinerar-digitalisering-och-hallbarhet':
    '/insikter/future-proof-maturity-matrix---en-transformationsmetodik',
  '/digitalisering-hallbarhet-framtidssaker-digjourney-kor-spar-pa-internetdagarna':
    '/insikter/digitalisering--hallbarhet--framtidssaker---digjourney',
  '/142-changemakers-ar-nu-certifierade-i-digital-transformation-framework':
    '/insikter/142-changemakers-ar-nu-certifierade-i-digital-transformation',
  '/innoday-2019-en-grym-dag-i-transformationens-tecken':
    '/insikter/innoday-2019---en-grym-dag-i-transformationens-tecken',
  '/leading-digital-transformation-finalist-i-business-books-awards':
    '/insikter/boken-leading-digital-transformation--finalist-i-business',
  '/sokes-entreprenoriell-hallbarhetsexpert-med-digitala-fardigheter':
    '/insikter/sokes--entreprenoriell-hallbarhetsexpert-med-digitala',
  '/innovationens-manga-ansikten': '/',
  '/den-digitala-revolutionen-kan-drastiskt-forbattra-klimatarbetet':
    '/insikter/den-digitala-revolutionen-kan-drastiskt-forbattra-klimatarbetet',
  '/dagensrosling': '/insikter/dagensrosling'
}

Object.keys(routeMap).forEach(function (route, index) {
  app.use(
    get(route + TRAILING_SLASH, function (ctx) {
      ctx.status = 301
      ctx.redirect(routeMap[route])
    })
  )
})

/**
 * Proxy image transform requests to Cloudinary
 * By running all transforms through our own server we can cache the response
 * on our edge servers (Cloudinary) saving on costs. Seeing as Cloudflare has
 * free unlimited cache and Cloudinary does not, we will only be charged for
 * the actual image transforms, of which the first 25 000 are free
 */
app.use(
  get(
    '/media/:type/:transform/:uri(.+)',
    async function (ctx, type, transform, uri) {
      if (ctx.querystring) uri += `?${ctx.querystring}`
      const stream = await imageproxy(type, transform, uri)
      const headers = [
        'etag',
        'last-modified',
        'content-length',
        'content-type'
      ]
      headers.forEach((header) => ctx.set(header, stream.headers[header]))
      ctx.set('Cache-Control', `public, max-age=${60 * 60 * 24 * 365}`)
      ctx.body = stream
    }
  )
)

/**
 * Purge Cloudflare cache whenever content is published to Prismic
 */
app.use(
  post(
    '/api/prismic-hook',
    compose([
      body(),
      function (ctx) {
        const secret = ctx.request.body && ctx.request.body.secret
        ctx.assert(
          secret === process.env.PRISMIC_SECRET,
          403,
          'Secret mismatch'
        )
        return new Promise(function (resolve, reject) {
          purge(app.entry, function (err, response) {
            if (err) return reject(err)
            ctx.type = 'application/json'
            ctx.body = {}
            resolve()
          })
        })
      }
    ])
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
 * Forward subscription requests to MailChimp
 */
app.use(
  post(
    '/api/subscribe',
    compose([
      body({ multipart: true }),
      async function (ctx, next) {
        ctx.set('Cache-Control', 'private, no-cache')
        try {
          await mailchimp.lists.addListMember(
            process.env.MAILCHIMP_AUDIENCE_ID,
            {
              email_address: ctx.request.body.EMAIL,
              status: 'pending'
            }
          )
          if (ctx.accepts('html')) {
            ctx.redirect('back')
          } else {
            ctx.body = {}
            ctx.type = 'application/json'
          }
        } catch (err) {
          if (ctx.accepts('html')) {
            ctx.redirect('back')
          } else {
            if (err.response) {
              const { status, title } = JSON.parse(err.response.text)
              ctx.throw(status, title)
            }
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

/**
 * Purge Cloudflare cache when starting production server
 */
if (process.env.HEROKU && app.env === 'production') {
  purge(app.entry, ['/sw.js'], function (err) {
    if (err) app.emit('error', err)
    app.listen(process.env.PORT || 8080)
  })
} else {
  app.listen(process.env.PORT || 8080)
}
