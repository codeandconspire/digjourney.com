var lazy = require('choo-lazy-view')
var choo = require('choo')
var app = choo()
var middleware = require('./lib/prismic-middleware')

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
app.use(require('./stores/navigation'))
app.use(require('./stores/prismic')({ repository: REPOSITORY, middleware }))
app.use(require('choo-meta')({ origin: app.state.origin }))
app.use(require('choo-service-worker')('/sw.js'))

app.route('/', lazy(() => import('./views/home')))
app.route('/insikter', lazy(() => import('./views/post-listing')))
app.route('/insikter/:slug', lazy(() => import('./views/post')))
app.route('/radgivning', lazy(() => import('./views/product-listing')))
app.route('/radgivning/:slug', lazy(() => import('./views/product')))
app.route('/utbildning', lazy(() => import('./views/training-listing')))
app.route('/utbildning/:slug', lazy(() => import('./views/training')))
app.route('/*', lazy(() => import('./views/catchall')))

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
