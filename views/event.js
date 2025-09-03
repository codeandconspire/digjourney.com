const html = require('choo/html')
const parse = require('date-fns/parse')
const sv = require('date-fns/locale/sv')
const format = require('date-fns/format')
const asElement = require('prismic-element')
const view = require('../components/view')
const grid = require('../components/grid')
const card = require('../components/card')
const Hero = require('../components/hero')
const slices = require('../components/slices')
const {
  i18n,
  loader,
  resolve,
  src,
  HTTPError,
  metaKey,
  asText
} = require('../components/base')

const text = i18n()

module.exports = view(event, meta)

function event(state, emit) {
  emit('theme', 'gray')
  return state.prismic.getByUID(
    'event',
    state.params.slug,
    function (err, doc) {
      if (err) throw HTTPError(404, err)
      if (!doc) {
        return html`
          <main class="View-main">
            ${state.partial
              ? state.cache(Hero, `hero-${state.partial.id}`).render({
                  theme: 'gray',
                  center: true,
                  blobs: false,
                  label: loader(12),
                  body: state.partial.data.title
                    ? html`
                        <h1>${asText(state.partial.data.title)}</h1>
                      `
                    : null
                })
              : Hero.loading({ theme: 'gray' })}
            <div class="u-container u-space2 u-spaceB0">
              <div class="Text">
                <p>${loader(65)}</p>
              </div>
            </div>
          </main>
        `
      }

      let related = null

      if (doc.data.related_events && doc.data.related_events.length) {
        related = doc.data.related_events
        related = related.filter(function (item) {
          return !item.event.isBroken && item.event.slug
        })
      }

      let date = doc.data.alternative_publication_date
      if (!date) date = doc.first_publication_date
      date = format(parse(date), 'D MMMM YYYY', { locale: sv })

      return html`
        <main class="View-main">
          ${state.cache(Hero, `hero-${doc.id}`).render({
            blobs: false,
            center: true,
            theme: 'gray',
            label: doc.data.custom_event_date
              ? doc.data.custom_event_date
              : date,
            body: html`
              <h1>${asText(doc.data.title)}</h1>
            `
          })}
          <div class="u-container u-space2 u-spaceB0">
            <div class="Text">${asElement(doc.data.description, resolve)}</div>
          </div>
          ${doc.data.body.map((slice, index, list) =>
            slices(slice, index, list, link)
          )}
          <div class="${related && related.length ? 'u-borderB' : ''} u-space2">
            <div class="u-container u-space2 u-borderT">
              ${related && related.length
                ? html`
                    <div class="Text u-space1">
                      <h2 class="u-textCenter">${text`Related events`}</h2>
                    </div>
                    ${grid(
                      { divided: true, size: { md: '1of2' } },
                      related.map(function (item) {
                        if (!item) return card.loading({ date: true })
                        if (item.event && item.event.isBroken) {
                          return card.loading({ date: true })
                        }
                        if (item.event && !item.event.data.title) {
                          return card.loading({ date: true })
                        }

                        let date =
                          item.event.data &&
                          item.event.data.alternative_publication_date
                        if (!date) {
                          date =
                            item.event.data &&
                            item.event.data.first_publication_date
                        }

                        let dateData
                        if (date) {
                          dateData = {
                            datetime: parse(date),
                            text: format(parse(date), 'D MMMM YYYY', {
                              locale: sv
                            })
                          }
                        }

                        return card({
                          title: asText(item.event.data.title),
                          body: asText(item.event.data.description),
                          date: dateData,
                          link: {
                            href: resolve(item.event),
                            text: text`Read more`
                          }
                        })
                      })
                    )}
                  `
                : null}
            </div>
          </div>
        </main>
      `
    }
  )

  // create link handler, emitting pushState w/ partial info
  // obj -> fn
  function link(doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta(state) {
  return state.prismic.getByUID('event', state.params.slug, (err, doc) => {
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
