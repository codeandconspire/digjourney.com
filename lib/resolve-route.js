const prismic = require('@prismicio/client')
const { resolve } = require('../components/base')

const REPOSITORY = 'digjourney'

module.exports = resolveRoute

async function resolveRoute(route, done) {
  switch (route) {
    case '/insikter/:slug': {
      query(prismic.predicate.at('document.type', 'post')).then(
        (urls) => done(null, urls),
        (err) => done(err)
      )
      break
    }
    case '/utbildning/:slug': {
      query(prismic.predicate.at('document.type', 'course')).then(
        (urls) => done(null, urls),
        (err) => done(err)
      )
      break
    }
    case '/forelasning/:slug': {
      query(prismic.predicate.at('document.type', 'product')).then(
        (urls) => done(null, urls),
        (err) => done(err)
      )
      break
    }
    case '/*': {
      query(prismic.predicate.at('document.type', 'page')).then(
        (urls) => done(null, urls),
        (err) => done(err)
      )
      break
    }
    default:
      return done(null)
  }
}

async function query(predicates) {
  const endpoint = prismic.getEndpoint(REPOSITORY)
  const client = prismic.createClient(endpoint, { fetch })

  const urls = []
  const opts = { pageSize: 100 }

  await client.get({ ...opts, predicates }).then(function (response) {
    response.results.forEach((doc) => urls.push(resolve(doc)))

    if (response.total_pages > 1) {
      const pages = []
      for (let i = 2; i <= response.total_pages; i++) {
        pages.push(
          client
            .get({ ...opts, predicates, page: i })
            .then(function (response) {
              response.results.forEach((doc) => urls.push(resolve(doc)))
            })
        )
      }

      return Promise.all(pages)
    }
  })

  return urls
}
