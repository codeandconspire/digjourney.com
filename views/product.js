const html = require('choo/html')
const asElement = require('prismic-element')
const view = require('../components/view')
const Hero = require('../components/hero')
const button = require('../components/button')
const product = require('../components/product')
const serialize = require('../components/text/serialize')
const {
  i18n,
  resolve,
  loader,
  src,
  srcset,
  HTTPError,
  memo,
  asText
} = require('../components/base')

const text = i18n()

module.exports = view(productView, meta, 'page')

function productView(state, emit) {
  emit('theme', 'pink')
  return state.prismic.getByUID(
    'product',
    state.params.slug,
    function (err, doc) {
      if (err) throw HTTPError(404, err)
      if (!doc) {
        return html`
          <main class="View-main">
            ${state.partial
              ? state.cache(Hero, `hero-${state.partial.id}`).render({
                  blobs: false,
                  theme: 'pink',
                  label: loader(18),
                  body: html`
                    <h1>${asText(state.partial.data.title)}</h1>
                  `
                })
              : Hero.loading({ theme: 'pink' })}
            <div class="u-container">
              <div class="Text u-space1">
                <p>${loader(65)}</p>
              </div>
            </div>
          </main>
        `
      }

      const title = asText(doc.data.title)
      const contact = asText(doc.data.contact_name)
      emit('track', 'view_item', { event_label: title })

      return html`
        <main class="View-main">
          ${state.cache(Hero, `hero-${doc.id}`).render({
            blobs: false,
            theme: 'pink',
            label: doc.data.label,
            body: html`
              <h1 class="u-spaceB3">${title}</h1>
              ${button(
                memo(
                  function (link) {
                    if ((!link.url && !link.id) || link.isBroken) return null
                    const attrs = {
                      theme: 'blue',
                      text: doc.data.action_text || text`Read more`,
                      href: resolve(doc.data.action),
                      onclick: track
                    }
                    if (link.target === '_blank') {
                      attrs.target = '_blank'
                      attrs.rel = 'noopenere nofererrer'
                    }
                    return attrs
                  },
                  [doc.data.action, 'action']
                )
              )}
            `
          })}
          <div class="u-container u-space2">
            ${product({
              standalone: true,
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
            })}
          </div>
        </main>
      `

      // track generated lead
      // obj -> void
      function track() {
        emit('track', 'generate_lead', { event_label: title })
      }
    }
  )
}

function meta(state) {
  return state.prismic.getByUID('product', state.params.slug, (err, doc) => {
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
