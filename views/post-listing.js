const html = require('choo/html')
const parse = require('date-fns/parse')
const sv = require('date-fns/locale/sv')
const format = require('date-fns/format')
const asElement = require('prismic-element')
const { predicate } = require('@prismicio/client')
const view = require('../components/view')
const Hero = require('../components/hero')
const grid = require('../components/grid')
const card = require('../components/card')
const button = require('../components/button')
const callout = require('../components/callout')
const {
  i18n,
  asText,
  srcset,
  src,
  HTTPError,
  memo,
  resolve,
  metaKey
} = require('../components/base')

const PAGE_SIZE = 8

const text = i18n()

module.exports = view(posts, meta)

function posts(state, emit) {
  emit('theme', 'gray')
  return state.prismic.getSingle('post_listing', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      const items = []
      for (let i = 0; i < 6; i++) {
        items.push(card.loading({ date: true, link: true }))
      }

      return html`
        <main class="View-main">
          ${state.partial
            ? state.cache(Hero, `hero-${state.partial.id}`).render({
                blobs: false,
                theme: 'gray',
                body: html`
                  <h1>${asText(state.partial.data.title)}</h1>
                  ${state.partial.data.description
                    ? asElement(state.partial.data.description, resolve)
                    : null}
                `
              })
            : Hero.loading({ theme: 'gray' })}
          <div class="u-container u-space2 u-borderB">
            ${callout.loading({ image: true })}
            <div class="u-space2">
              ${grid({ divided: true, size: { md: '1of2' } }, items)}
            </div>
          </div>
        </main>
      `
    }

    const featured = doc.data.featured
      .map(function ({ link }) {
        if (!link.id || link.isBroken) return null
        return state.prismic.getByUID('post', link.uid, function (err, doc) {
          if (err) return null
          return doc
        })
      })
      .filter((doc) => doc !== null)

    let page = parseInt(state.query.page)
    if (isNaN(page)) page = 1
    const defaults = {
      pageSize: PAGE_SIZE,
      orderings:
        '[my.post.alternative_publication_date desc, document.first_publication_date desc]'
    }
    const predicates = [predicate.at('document.type', 'post')]
    doc.data.featured.forEach(function ({ link }) {
      if (!link || !link.id) {
        return
      }
      predicates.push(predicate.not('document.id', link.id))
    })

    let posts = []
    let hasMore = true
    for (let i = 1; i <= page; i++) {
      const opts = Object.assign({ page: i }, defaults)
      posts.push(
        ...state.prismic.get(predicates, opts, function (err, response) {
          if (err) return []
          if (!response) return new Array(PAGE_SIZE).fill()
          hasMore = i < response.total_pages
          return response.results
        })
      )
    }

    if (typeof posts.sort === 'function') {
      posts = posts
        .map(function (item) {
          if (item) {
            item.date = item.data.alternative_publication_date
              ? item.data.alternative_publication_date
              : item.first_publication_date
          }
          return item
        })
        .sort(function (a, b) {
          return new Date(b.date) - new Date(a.date)
        })
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

            let date = doc.data.alternative_publication_date
            if (!date) date = doc.first_publication_date
            date = date ? parse(date) : null

            return html`
              <div class="u-space1">
                ${callout({
                  label: html`
                    <time
                      class="Card-meta"
                      datetime="${JSON.stringify(date).replace(/"/g, '')}">
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
                  image: memo(
                    function (url, sizes) {
                      if (!url) return null
                      return {
                        src: src(url, 720),
                        sizes:
                          '(min-width: 1000px) 35vw, (min-width: 600px) 200px, 100vw',
                        srcset: srcset(url, sizes, {
                          aspect: 3 / 4
                        }),
                        alt: doc.data.featured_image.alt || '',
                        width: doc.data.featured_image.dimensions.width,
                        height:
                          (doc.data.featured_image.dimensions.width * 10) / 12
                      }
                    },
                    [
                      doc.data.featured_image && doc.data.featured_image.url,
                      [720, 400, 800, 1200]
                    ]
                  )
                })}
              </div>
            `
          })}
          <div class="u-space2">
            ${grid(
              { divided: true, size: { md: '1of2' } },
              posts.map(function (doc, index, list) {
                if (!doc) {
                  return grid.cell(
                    { appear: true },
                    card.loading({ date: true })
                  )
                }

                let date = doc.data.alternative_publication_date
                if (!date) date = doc.first_publication_date
                date = date ? parse(date) : null

                const opts = {}
                if (list.length > PAGE_SIZE) {
                  if (index >= page * PAGE_SIZE - PAGE_SIZE) {
                    opts.appear = PAGE_SIZE - (page * PAGE_SIZE - index)
                  }
                }

                return grid.cell(
                  opts,
                  card({
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
                  })
                )
              })
            )}
          </div>
          ${hasMore
            ? html`
                <div class="u-textCenter u-space2">
                  ${button({
                    text: text`Show more`,
                    href: `${resolve(doc)}?page=${page + 1}`,
                    onclick
                  })}
                </div>
              `
            : null}
        </div>
      </main>
    `
  })

  // prevent scroll to top on pagination
  // obj -> void
  function onclick(event) {
    event.preventDefault()
    emit('pushState', event.currentTarget.href, { persistScroll: true })
  }

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial(doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta(state) {
  return state.prismic.getSingle('post_listing', function (err, doc) {
    if (err) throw err
    if (!doc) return null
    const props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description),
      contact: {
        blurb: doc.data.contact_blurb ? doc.data.contact_blurb : null
      }
    }

    const image = doc.data.featured_image
    if (image && image.url) {
      Object.assign(props, {
        'og:image': src(image.url, 1200),
        'og:image:width': 1200,
        'og:image:height':
          (1200 * image.dimensions.height) / image.dimensions.width
      })
    }

    return props
  })
}
