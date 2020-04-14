var html = require('choo/html')
var parse = require('date-fns/parse')
var sv = require('date-fns/locale/sv')
var format = require('date-fns/format')
var asElement = require('prismic-element')
var { Predicates } = require('prismic-javascript')
var view = require('../components/view')
var Hero = require('../components/hero')
var grid = require('../components/grid')
var card = require('../components/card')
var button = require('../components/button')
var callout = require('../components/callout')
var { i18n, asText, srcset, src, HTTPError, memo, resolve, metaKey } = require('../components/base')

var PAGE_SIZE = 8

var text = i18n()

module.exports = view(posts, meta)

function posts (state, emit) {
  emit('theme', 'gray')
  return state.prismic.getSingle('post_listing', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      let items = []
      for (let i = 0; i < 6; i++) {
        items.push(card.loading({ date: true, link: true }))
      }

      return html`
        <main class="View-main">
          ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
            blobs: false,
            theme: 'gray',
            body: html`
              <h1>${asText(state.partial.data.title)}</h1>
              ${state.partial.data.description ? asElement(state.partial.data.description, resolve) : null}
            `
          }) : Hero.loading({ theme: 'gray' })}
          <div class="u-container u-space2 u-borderB">
            ${callout.loading({ image: true })}
            <div class="u-space2">
              ${grid({ divided: true, size: { md: '1of2' } }, items)}
            </div>
          </div>
        </main>
      `
    }

    var featured = doc.data.featured.map(function ({ link }) {
      if (!link.id || link.isBroken) return null
      return state.prismic.getByUID('post', link.uid, function (err, doc) {
        if (err) return null
        return doc
      })
    }).filter((doc) => doc !== null)

    var page = parseInt(state.query.page)
    if (isNaN(page)) page = 1
    var defaults = {
      pageSize: PAGE_SIZE,
      orderings: '[document.first_publication_date, my.post.alternative_publication_date desc]'
    }
    var predicates = [Predicates.at('document.type', 'post')]
    doc.data.featured.forEach(function ({ link }) {
      if (!link || !link.id) {
        return
      }
      predicates.push(Predicates.not('document.id', link.id))
    })

    var posts = []
    var hasMore = true
    for (let i = 1; i <= page; i++) {
      let opts = Object.assign({ page: i }, defaults)
      posts.push(...state.prismic.get(predicates, opts, function (err, response) {
        if (err) return []
        if (!response) return new Array(PAGE_SIZE).fill()
        hasMore = i < response.total_pages
        return response.results
      }))
    }

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          blobs: false,
          theme: 'gray',
          body: html`
            <h1>${asText(doc.data.title)}</h1>
            ${asElement(doc.data.description, resolve)}
          `
        })}
        <div class="u-container u-space2 u-borderB">
          ${featured.map(function (doc, index) {
            if (!doc) return callout.loading({ label: true, image: true })

            var date = doc.data.alternative_publication_date
            if (!date) date = doc.first_publication_date
            date = parse(date)

            return html`
              <div class="u-space1">
                ${callout({
                  label: html`
                    <time class="Card-meta" datetime="${JSON.stringify(date).replace(/"/g, '')}">
                      ${format(date, 'D MMMM YYYY', { locale: sv })}
                    </time>
                  `,
                  title: asText(doc.data.title),
                  body: asText(doc.data.description),
                  theme: 'gray',
                  direction: index % 2 === 0 ? 'left' : 'right',
                  link: {
                    href: resolve(doc),
                    onclick: partial(doc),
                    text: text`Read more`
                  },
                  image: memo(function (url, sizes) {
                    if (!url) return null
                    return {
                      src: src(url, 720),
                      sizes: '(min-width: 1000px) 35vw, (min-width: 600px) 200px, 100vw',
                      srcset: srcset(url, sizes, {
                        aspect: 3 / 4,
                        transforms: 'c_thumb,g_face'
                      }),
                      alt: doc.data.featured_image.alt || '',
                      width: doc.data.featured_image.dimensions.width,
                      height: doc.data.featured_image.dimensions.width * 10 / 12
                    }
                  }, [doc.data.featured_image && doc.data.featured_image.url, [720, 400, 800, 1200]])
                })}
              </div>
            `
          })}
          <div class="u-space2">
            ${grid({ divided: true, size: { md: '1of2' } }, posts.map(function (doc, index, list) {
              if (!doc) return grid.cell({ appear: true }, card.loading({ date: true }))

              var date = doc.data.alternative_publication_date
              if (!date) date = doc.first_publication_date
              date = parse(date)

              var opts = {}
              if (list.length > PAGE_SIZE) {
                if (index >= page * PAGE_SIZE - PAGE_SIZE) {
                  opts.appear = PAGE_SIZE - (page * PAGE_SIZE - index)
                }
              }

              return grid.cell(opts, card({
                title: asText(doc.data.title),
                body: asText(doc.data.description),
                date: {
                  datetime: date,
                  text: format(date, 'D MMMM YYYY', { locale: sv })
                },
                link: {
                  href: resolve(doc),
                  text: text`Read more`
                }
              }))
            }))}
          </div>
          ${hasMore ? html`
            <div class="u-textCenter u-space2">
              ${button({ text: text`Show more`, href: `${resolve(doc)}?page=${page + 1}`, onclick: onclick })}
            </div>
          ` : null}
        </div>
      </main>
    `
  })

  // prevent scroll to top on pagination
  // obj -> void
  function onclick (event) {
    emit('pushState', event.target.href, { persistScroll: true })
    event.preventDefault()
  }

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial (doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta (state) {
  return state.prismic.getSingle('post_listing', function (err, doc) {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description),
      contact: {
        blurb: doc.data.contact_blurb ? doc.data.contact_blurb : null
      }
    }

    var image = doc.data.featured_image
    if (image && image.url) {
      Object.assign(props, {
        'og:image': src(image.url, 1200),
        'og:image:width': 1200,
        'og:image:height': 1200 * image.dimensions.height / image.dimensions.width
      })
    }

    return props
  })
}
