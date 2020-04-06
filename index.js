var choo = require('choo')
var html = require('choo/html')
var lazy = require('choo-lazy-view')
var splitRequire = require('split-require')
var middleware = require('./lib/prismic-middleware')

var app = choo()
var page = lazy(() => import('./views/page'), prefetch('page'))

var REPOSITORY = 'https://digjourney.cdn.prismic.io/api/v2'

app.state.origin = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080'
  : process.env.npm_package_now_alias

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
app.use(require('choo-service-worker')('/sw.js'))

app.route('/', lazy(() => promisify((cb) => splitRequire('./views/home', cb)), prefetch('homepage', true)))
app.route('/insikter', lazy(() => promisify((cb) => splitRequire('./views/post-listing', cb)), prefetch('posting_listing', true)))
app.route('/insikter/:slug', lazy(() => promisify((cb) => splitRequire('./views/post', cb)), prefetch('post')))
app.route('/forelasning', lazy(() => promisify((cb) => splitRequire('./views/product-listing', cb)), prefetch('product_listing', true)))
app.route('/forelasning/:slug', lazy(() => promisify((cb) => splitRequire('./views/product', cb)), prefetch('product')))
app.route('/utbildning', lazy(() => promisify((cb) => splitRequire('./views/course-listing', cb)), prefetch('course_listing', true)))
app.route('/utbildning/:slug', lazy(() => promisify((cb) => splitRequire('./views/course', cb)), prefetch('course')))
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

// wrap callback function with promise
// fn -> Promise
function promisify (fn) {
  return new Promise(function (resolve, reject) {
    fn(function (err, res) {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

// custom view matching
// (obj, fn) -> Element
function catchall (state, emit) {
  var view
  var segments = state.href.split('/').slice(1)

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
function prefetch (type, single) {
  return function (state, emit) {
    if (typeof window === 'undefined') return html`<body></body>`
    if (single) state.prismic.getSingle(type, { prefetch: true })
    else state.prismic.getByUID(type, state.params.slug, { prefetch: true })
    return document.body
  }
}
