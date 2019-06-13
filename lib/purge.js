var cccpurge = require('cccpurge')
var Prismic = require('prismic-javascript')
var { resolve } = require('../components/base')

var REPOSITORY = 'https://digjourney.cdn.prismic.io/api/v2'

module.exports = purge

function purge (urls, callback = Function.prototype) {
  if (typeof urls === 'function') {
    callback = urls
    urls = []
  }

  cccpurge(require('../index'), {
    urls: urls,
    resolve: resolveRoute,
    root: `https://${process.env.npm_package_now_alias}`,
    zone: process.env.CLOUDFLARE_ZONE,
    email: process.env.CLOUDFLARE_EMAIL,
    key: process.env.CLOUDFLARE_KEY
  }, callback)
}

async function resolveRoute (route, done) {
  try {
    let api = await Prismic.getApi(REPOSITORY)
    if (route === '/*') {
      let urls = []
      let queries = [
        Prismic.Predicates.at('document.type', 'landing'),
        Prismic.Predicates.at('document.type', 'article'),
        Prismic.Predicates.at('document.type', 'page')
      ]
      await Promise.all(queries.map(function (query) {
        var opts = { page: 1, pageSize: 100, fetchLinks: 'page.parent' }
        return api.query(query, opts).then(function (response) {
          response.results.forEach((doc) => urls.push(resolve(doc)))

          if (response.total_pages > 1) {
            let pages = []
            for (let i = 2; i <= response.total_pages; i++) {
              let page = Object.assign({}, opts, { page: i })
              pages.push(api.query(query, page).then(function (response) {
                response.results.forEach((doc) => urls.push(resolve(doc)))
              }))
            }

            return Promise.all(pages)
          }
        })
      }))
      done(null, urls)
    } else {
      done(null)
    }
  } catch (err) {
    done(err)
  }
}
