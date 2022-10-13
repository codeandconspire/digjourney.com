const choo = require('choo')
const html = require('choo/html')
const lazy = require('choo-lazy-view')
const splitRequire = require('split-require')
const middleware = require('./lib/prismic-middleware')

const app = choo()
const page = lazy(() => splitRequire('./views/page'), prefetch('page'))

const REPOSITORY = 'digjourney'

app.state.origin =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : `https://${process.env.HOST}`

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  app.use(require('choo-devtools')())
  app.use(require('choo-service-worker/clear')())
}

app.use(lazy)
app.use(require('./stores/ui'))
app.use(require('./stores/tracking'))
app.use(require('./stores/navigation'))
app.use(require('./stores/prismic')({ repository: REPOSITORY, middleware }))
app.use(require('choo-meta')({ origin: app.state.origin }))

app.route(
  '/',
  lazy(() => splitRequire('./views/home'), prefetch('homepage', true))
)
app.route(
  '/insikter',
  lazy(
    () => splitRequire('./views/post-listing'),
    prefetch('posting_listing', true)
  )
)
app.route(
  '/insikter/:slug',
  lazy(() => splitRequire('./views/post'), prefetch('post'))
)
app.route(
  '/forelasning',
  lazy(
    () => splitRequire('./views/product-listing'),
    prefetch('product_listing', true)
  )
)
app.route(
  '/forelasning/:slug',
  lazy(() => splitRequire('./views/product'), prefetch('product'))
)
app.route(
  '/utbildning',
  lazy(
    () => splitRequire('./views/course-listing'),
    prefetch('course_listing', true)
  )
)
app.route(
  '/utbildning/:slug',
  lazy(() => splitRequire('./views/course'), prefetch('course'))
)
app.route('/*', catchall)

try {
  module.exports = app.mount('body')
  // remove parse guard added in header
  window.onerror = null
} catch (err) {
  if (typeof window !== 'undefined') {
    document.documentElement.removeAttribute('scripting-enabled')
    document.documentElement.setAttribute('scripting-initial-only', '')
  }
}

// custom view matching
// (obj, fn) -> Element
function catchall(state, emit) {
  let view
  const segments = state.href.split('/').slice(1)

  if (segments.length < 3) {
    state.params.slug = segments[segments.length - 1]
    view = page
  } else {
    view = require('./views/404')
  }

  return view(state, emit)
}

// prefetch document while loading view
// (str, bool?) -> fn
function prefetch(type, single) {
  return function (state, emit) {
    if (typeof window === 'undefined') {
      return html`
        <body></body>
      `
    }
    if (single) state.prismic.getSingle(type, { prefetch: true })
    else state.prismic.getByUID(type, state.params.slug, { prefetch: true })
    return document.body
  }
}
