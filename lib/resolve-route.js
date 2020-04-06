var Prismic = require('prismic-javascript')
var { resolve } = require('../components/base')

var REPOSITORY = 'https://digjourney.cdn.prismic.io/api/v2'

module.exports = resolveRoute

async function resolveRoute (route, done) {
  switch (route) {
    case '/insikter/:slug': {
      query(Prismic.Predicates.at('document.type', 'post')).then(
        urls => done(null, urls),
        err => done(err)
      )
      break
    }
    case '/utbildning/:slug': {
      query(Prismic.Predicates.at('document.type', 'course')).then(
        urls => done(null, urls),
        err => done(err)
      )
      break
    }
    case '/forelasning/:slug': {
      query(Prismic.Predicates.at('document.type', 'product')).then(
        urls => done(null, urls),
        err => done(err)
      )
      break
    }
    case '/*': {
      query(Prismic.Predicates.at('document.type', 'page')).then(
        urls => done(null, urls),
        err => done(err)
      )
      break
    }
    default: return done(null)
  }
}

async function query (predicates) {
  var api = await Prismic.getApi(REPOSITORY)
  var opts = { pageSize: 100 }
  var urls = []

  await api.query(predicates, opts).then(function (response) {
    response.results.forEach((doc) => urls.push(resolve(doc)))

    if (response.total_pages > 1) {
      let pages = []
      for (let i = 2; i <= response.total_pages; i++) {
        let page = Object.assign({}, opts, { page: i })
        pages.push(api.query(predicates, page).then(function (response) {
          response.results.forEach((doc) => urls.push(resolve(doc)))
        }))
      }

      return Promise.all(pages)
    }
  })

  return urls
}
