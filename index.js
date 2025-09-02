const choo = require('choo')
const splitRequire = require('split-require')
const middleware = require('./lib/prismic-middleware')

const SELECTOR = 'body'

const app = choo()
const page = lazy(() => splitRequire('./views/page'))

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
  lazy(() => splitRequire('./views/home'))
)
app.route(
  '/insikter',
  lazy(() => splitRequire('./views/post-listing'))
)
app.route(
  '/insikter/:slug',
  lazy(() => splitRequire('./views/post'))
)
app.route(
  '/evenemang',
  lazy(() => splitRequire('./views/event-listing'))
)
app.route(
  '/evenemang/:slug',
  lazy(() => splitRequire('./views/event'))
)
app.route(
  '/forelasning',
  lazy(() => splitRequire('./views/product-listing'))
)
app.route(
  '/forelasning/:slug',
  lazy(() => splitRequire('./views/product'))
)
app.route(
  '/utbildning',
  lazy(() => splitRequire('./views/course-listing'))
)
app.route(
  '/utbildning/:slug',
  lazy(() => splitRequire('./views/course'))
)
app.route('/*', catchall)

try {
  module.exports = app.mount(SELECTOR)
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

/**
 * This is a subset of cho-lazy-view due to incompatabilities with node 16
 * @param {Function} load Asynchronous view loading function
 * @returns {Function}
 */
function lazy(load) {
  let promise
  let view

  return function proxy(state, emit) {
    if (view) return view(state, emit)

    if (!promise) {
      promise = load().then(function (_view) {
        // asynchronously render view to account for nested prefetches
        if (typeof window === 'undefined') _view(state, emit)
        else emit('render')
        view = _view
      })
      emit('prefetch', promise)
    } else {
      promise.then(function () {
        emit('render')
      })
    }

    // assuming app has been provided initialState by server side render
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-new-wrappers
      const str = new String()
      str.__encoded = true
      return str
    }
    return document.querySelector(SELECTOR)
  }
}
