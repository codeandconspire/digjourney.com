const html = require('choo/html')
const asElement = require('prismic-element')
const view = require('../components/view')
const Hero = require('../components/hero')
const product = require('../components/product')
const serialize = require('../components/text/serialize')
const {
  i18n,
  loader,
  asText,
  src,
  HTTPError,
  memo,
  srcset,
  resolve
} = require('../components/base')

const text = i18n()

module.exports = view(products, meta)

function products(state, emit) {
  emit('theme', 'yellow')
  return state.prismic.getSingle('product_listing', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial
            ? state.cache(Hero, `hero-${state.partial.id}`).render({
                theme: 'yellow',
                body: html`
                  <h1>${asText(state.partial.data.title)}</h1>
                  ${state.partial.data.description
                    ? asElement(state.partial.data.description, resolve)
                    : null}
                `
              })
            : Hero.loading({ theme: 'yellow' })}
          <div class="u-container">
            <div class="Text u-space2">
              <p>${loader(65)}</p>
            </div>
          </div>
        </main>
      `
    }

    const title = asText(doc.data.title)
    emit('track', 'view_item_list', { event_label: title })

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: 'yellow',
          body: html`
            <h1>${title}</h1>
            ${asElement(doc.data.description, resolve)}
          `
        })}
        <div class="u-container">
          <div class="Text u-space2">
            ${asElement(doc.data.body, resolve, serialize)}
          </div>
          ${doc.data.categories.map(function (slice) {
            if (slice.slice_type !== 'category') return null
            return html`
              <div class="u-space2">
                <div class="u-space1">
                  <div class="Text u-spaceB5">
                    <h2 class="Text-h1">${asText(slice.primary.heading)}</h2>
                  </div>
                </div>
                <div class="u-space2end">
                  ${slice.items
                    .map(function ({ link }) {
                      if (!link.id || link.isBroken) return null
                      return state.prismic.getByID(
                        link.id,
                        function (err, doc) {
                          if (err) return null
                          if (!doc) return product.loading()
                          return product(asProduct(doc))
                        }
                      )
                    })
                    .filter(Boolean)}
                </div>
              </div>
            `
          })}
        </div>
      </main>
    `
  })

  function asProduct(doc) {
    const contact = asText(doc.data.contact_name)
    const title = asText(doc.data.title)
    return {
      title,
      body: asElement(doc.data.description, resolve, serialize),
      duration: doc.data.duration,
      target: doc.data.target,
      location: doc.data.location,
      image: memo(
        function (url) {
          if (!url) return null
          return Object.assign(
            {
              alt: doc.data.image.alt || '',
              src: src(url, [500]),
              sizes: '(min-width: 1000px) 500px, 100vw',
              srcset: srcset(url, [400, 600, 1000, 1200])
            },
            doc.data.image.dimensions
          )
        },
        [doc.data.image.url, 'product-listing']
      ),
      features: doc.data.features.map(({ text }) => text),
      contact: contact
        ? {
            title: contact,
            body: asElement(doc.data.contact_description, resolve),
            image: memo(
              function (url) {
                if (!url) return null
                return Object.assign(
                  {
                    alt: doc.data.contact_image.alt || '',
                    sizes: '90px',
                    srcset: srcset(url, [90, 180], {
                      transforms: 'q_100',
                      aspect: 1
                    }),
                    src: src(url, [60])
                  },
                  doc.data.contact_image.dimensions
                )
              },
              [doc.data.contact_image.url, 'small']
            )
          }
        : null,
      action: memo(
        function (link) {
          if ((!link.id && !link.url) || link.isBroken) return null
          const props = {
            href: resolve(link),
            text: doc.data.action_text || text`Read more`,
            onclick() {
              emit('track', 'generate_lead', { event_label: title })
            }
          }

          if (link.target === '_blank') {
            props.rel = 'nonopener noreferer'
            props.target = '_blank'
          }

          return props
        },
        [doc.data.action, doc.id]
      )
    }
  }
}

function meta(state) {
  return state.prismic.getSingle('product_listing', function (err, doc) {
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
