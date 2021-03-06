if (!process.env.HEROKU) require('dotenv/config')

var jalla = require('jalla')
var dedent = require('dedent')
var body = require('koa-body')
var compose = require('koa-compose')
var { get, post } = require('koa-route')
var Prismic = require('prismic-javascript')
var purge = require('./lib/purge')
var { resolve } = require('./components/base')
var subscribe = require('./lib/mailchimp-proxy')
var imageproxy = require('./lib/cloudinary-proxy')

var REPOSITORY = 'https://digjourney.cdn.prismic.io/api/v2'
var MAILCHIMP = 'https://digjourney.us3.list-manage.com/subscribe?u=da19434c486fcc616e3c247aa&id=efda908eed'

var app = jalla('index.js', {
  sw: 'sw.js',
  watch: !process.env.HEROKU,
  serve: Boolean(process.env.HEROKU)
})

/**
 * Redirects
 * Should be moved to a DNS layer…
 */
var TRAILING_SLASH = '(/)?'

var routeMap = {
  '/contact': '/kontakt',
  '/om-boken': '/boken-att-leda-digital-transformation',
  '/om-boken/bestall-boken-att-leda-digital-transformation/': '/boken-att-leda-digital-transformation',
  '/organisation': 'radgivning',
  '/vad-vi-gor': '/',
  '/en': '/',
  '/tag/konsultutbildning/': '/utbildning',
  '/tag/organisationsstruktur/': '/',
  '/about-methodology': '/metodik-arbetssatt',
  '/jul': '/boken-att-leda-digital-transformation',
  '/tag': '/insikter',
  '/finally-the-book-leading-digital-transformation-is-out-and-we-need-your-help': 'boken-att-leda-digital-transformation',
  '/vilken-nytta-ger-egentligen-var-utbildning-att-leda-digital-transformation-som-konsult': 'kunder',
  '/artiklar-och-inspiration': '/insikter',
  '/transformationday-23rd-of-april-2018': '/',
  '/larande-organisation': '/utbildning',
  '/digital-konkurrenskraft': '/forelasning/digital-transformationsplan-som-framtidssakrar-din-verksamhet',
  '/digital-transformation': '/radgivning',
  '/forelasningar-workshops': '/forelasningar',
  '/forvandlingen': '/',
  '/innovation': '/radgivning',
  '/om-digjourney': '/vision',
  '/omrostning-vilken-logga-tycker-du-att-vi-skall-ha': '/',
  '/the-digital-maturity-matrix-digital-transformation-with-maximum-roi': '/kontakt',
  '/undersokningar': '/',
  '/verktyg-for-digital-transformation': '/digitalt-mognadstest',
  '/fran-gammelgadda-till-mort-branschanalys-av-media-i-sagoform/': '/insikter/fran-gammelgadda-till-mort--branschanalys-av-media',
  '/skaraborgsdagen-30-januari-fokuserar-pa-kompetensforsorjning-och-digitalisering': '/insikter/skaraborgsdagen-30-januari-fokuserar-pa-kompetensforsorjning',
  '/certifieringskurs-i-ramverket-for-att-leda-digital-transformation-genomfors-i-umea': '/insikter/certifieringskurs-i-ramverket-for-att-leda-digital',
  '/yeah-our-tranformationday-at-internetdagarna-a-success': '/insikter/our-tranformationdaydigitalization--sustainability',
  '/future-proof-maturity-matrix-en-transformationsmetodik-som-kombinerar-digitalisering-och-hallbarhet': '/insikter/future-proof-maturity-matrix---en-transformationsmetodik',
  '/digitalisering-hallbarhet-framtidssaker-digjourney-kor-spar-pa-internetdagarna': '/insikter/digitalisering--hallbarhet--framtidssaker---digjourney' ,
  '/142-changemakers-ar-nu-certifierade-i-digital-transformation-framework': '/insikter/142-changemakers-ar-nu-certifierade-i-digital-transformation',
  '/innoday-2019-en-grym-dag-i-transformationens-tecken': '/insikter/innoday-2019---en-grym-dag-i-transformationens-tecken',
  '/leading-digital-transformation-finalist-i-business-books-awards': '/insikter/boken-leading-digital-transformation--finalist-i-business',
  '/sokes-entreprenoriell-hallbarhetsexpert-med-digitala-fardigheter': '/insikter/sokes--entreprenoriell-hallbarhetsexpert-med-digitala',
  '/innovationens-manga-ansikten': '/',
  '/den-digitala-revolutionen-kan-drastiskt-forbattra-klimatarbetet': '/insikter/den-digitala-revolutionen-kan-drastiskt-forbattra-klimatarbetet',
  '/dagensrosling': '/insikter/dagensrosling'
}

Object.keys(routeMap).forEach(function (route, index) {
  app.use(get(route + TRAILING_SLASH, function (ctx) {
    ctx.status = 301
    ctx.redirect(routeMap[route])
  }))
})

/**
 * Proxy image transform requests to Cloudinary
 * By running all transforms through our own server we can cache the response
 * on our edge servers (Cloudinary) saving on costs. Seeing as Cloudflare has
 * free unlimited cache and Cloudinary does not, we will only be charged for
 * the actual image transforms, of which the first 25 000 are free
 */
app.use(get('/media/:type/:transform/:uri(.+)', async function (ctx, type, transform, uri) {
  if (ctx.querystring) uri += `?${ctx.querystring}`
  var stream = await imageproxy(type, transform, uri)
  var headers = ['etag', 'last-modified', 'content-length', 'content-type']
  headers.forEach((header) => ctx.set(header, stream.headers[header]))
  ctx.set('Cache-Control', `public, max-age=${60 * 60 * 24 * 365}`)
  ctx.body = stream
}))

/**
 * Purge Cloudflare cache whenever content is published to Prismic
 */
app.use(post('/api/prismic-hook', compose([body(), function (ctx) {
  var secret = ctx.request.body && ctx.request.body.secret
  ctx.assert(secret === process.env.PRISMIC_SECRET, 403, 'Secret mismatch')
  return new Promise(function (resolve, reject) {
    purge(app.entry, function (err, response) {
      if (err) return reject(err)
      ctx.type = 'application/json'
      ctx.body = {}
      resolve()
    })
  })
}])))

/**
 * Handle Prismic previews
 * Capture the preview token, setting it as a cookie and redirect to the
 * document being previewed. The Prismic library will pick up the cookie and use
 * it for fetching content.
 */
app.use(get('/api/prismic-preview', async function (ctx) {
  var token = ctx.query.token
  var api = await Prismic.api(REPOSITORY, { req: ctx.req })
  var href = await api.previewSession(token, resolve, '/')
  var expires = app.env === 'development'
    ? new Date(Date.now() + (1000 * 60 * 60 * 12))
    : new Date(Date.now() + (1000 * 60 * 30))

  ctx.set('Cache-Control', 'no-cache, private, max-age=0')
  ctx.cookies.set(Prismic.previewCookie, token, {
    expires: expires,
    httpOnly: false,
    path: '/'
  })
  ctx.redirect(href)
}))

/**
 * Forward subscription requests to MailChimp
 */
app.use(compose([
  // expose mailchimp endpoint on state
  function (ctx, next) {
    ctx.state.mailchimp = MAILCHIMP
    return next()
  },
  // newsletter subscription endpoint
  post('/api/subscribe', compose([body(), async function (ctx, next) {
    ctx.set('Cache-Control', 'private, no-cache')
    try {
      await subscribe(ctx.request.body, MAILCHIMP)
      if (ctx.accepts('html')) {
        ctx.redirect('back')
      } else {
        ctx.body = {}
        ctx.type = 'application/json'
      }
    } catch (err) {
      console.log('-- err --')
      console.log(err)
      console.log('-- ctx.request.body --')
      console.log(ctx.request.body)
      console.log('-- MAILCHIMP --')
      console.log(MAILCHIMP)
      if (ctx.accepts('html')) ctx.redirect('back')
      else ctx.throw(err.status || 400, 'Could not subscribe')
    }
  }]))
]))

/**
 * Capture requests for pages at the site root and redirect pages with a parent
 * to their proper url
 */
app.use(get('/:slug', async function (ctx, slug, next) {
  if (!ctx.accepts('html')) return next()
  var api = await Prismic.api(REPOSITORY, { req: ctx.req })
  try {
    let doc = await api.getByUID('page', slug)
    if (!doc.data.parent || !doc.data.parent.id) return next()
    ctx.redirect(resolve(doc))
  } catch (err) {
    return next()
  }
}))

/**
 * Disallow robots anywhere but in production
 */
app.use(get('/robots.txt', function (ctx, next) {
  ctx.type = 'text/plain'
  ctx.body = dedent`
    User-agent: *
    Disallow: ${app.env === 'production' ? '' : '/'}
  `
}))

/**
 * Set cache headers for HTML pages
 * By caching HTML on our edge servers (Cloudflare) we keep response times and
 * hosting costs down. The `s-maxage` property tells Cloudflare to cache the
 * response for a month whereas we set the `max-age` to cero to prevent clients
 * from caching the response
 */
app.use(function (ctx, next) {
  if (!ctx.accepts('html')) return next()
  var previewCookie = ctx.cookies.get(Prismic.previewCookie)
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
    else app.listen(process.env.PORT || 8080)
  })
} else {
  app.listen(process.env.PORT || 8080)
}
