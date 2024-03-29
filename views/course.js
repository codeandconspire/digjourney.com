const html = require('choo/html')
const parse = require('date-fns/parse')
const asElement = require('prismic-element')
const view = require('../components/view')
const Hero = require('../components/hero')
const grid = require('../components/grid')
const date = require('../components/date')
const person = require('../components/person')
const button = require('../components/button')
const slices = require('../components/slices')
const {
  i18n,
  resolve,
  loader,
  src,
  srcset,
  HTTPError,
  metaKey,
  memo,
  asText
} = require('../components/base')

const text = i18n()

module.exports = view(course, meta, 'page')

function course(state, emit) {
  emit('theme', 'yellow')
  return state.prismic.getByUID(
    'course',
    state.params.slug,
    function (err, doc) {
      if (err) throw HTTPError(404, err)
      if (!doc) {
        return html`
          <main class="View-main">
            ${state.partial
              ? state.cache(Hero, `hero-${state.partial.id}`).render({
                  blobs: false,
                  theme: 'yellow',
                  label: loader(18),
                  body: html`
                    <h1>${asText(state.partial.data.title)}</h1>
                  `
                })
              : Hero.loading({ theme: 'yellow' })}
            <div class="u-container">
              <div class="Text u-space1">
                <p>${loader(65)}</p>
              </div>
            </div>
          </main>
        `
      }

      const title = asText(doc.data.title)
      emit('track', 'view_item', { event_label: title })

      return html`
        <main class="View-main">
          ${state.cache(Hero, `hero-${doc.id}`).render({
            blobs: false,
            theme: 'yellow',
            label: doc.data.label,
            body: html`
              <h1 class="u-spaceB3">${title}</h1>
              ${doc.data.description
                ? asElement(doc.data.description, resolve)
                : null}
              ${button(
                memo(
                  function (link) {
                    if ((!link.url && !link.id) || link.isBroken) return null
                    const attrs = {
                      theme: 'blue',
                      text: text`Go to application`,
                      href: resolve(doc.data.apply),
                      class: 'u-spaceT4',
                      onclick: track
                    }
                    if (link.target === '_blank') {
                      attrs.target = '_blank'
                      attrs.rel = 'noopenere nofererrer'
                    }
                    return attrs
                  },
                  [doc.data.apply, 'apply']
                )
              )}
            `
          })}
          ${doc.data.body.map(function (slice, index, list) {
            switch (slice.slice_type) {
              case 'course_details': {
                return html`
                  <div class="u-container u-space1">
                    ${grid([
                      grid.cell({ size: { md: '1of3' } }, [
                        html`
                          <div class="Text">
                            <h4>${text`Location`}</h4>
                            ${asElement(doc.data.location, resolve)}
                          </div>
                        `
                      ]),
                      grid.cell(
                        { size: { md: '2of3' } },
                        html`
                          <div>
                            <div class="Text Text--left">
                              <h4>${text`Teachers`}</h4>
                              <span><!-- Maintain equal spacing --></span>
                            </div>
                            ${grid(
                              { size: { lg: '1of2' } },
                              doc.data.teachers.map((item) =>
                                person({
                                  small: true,
                                  image: memo(
                                    function (url) {
                                      if (!url) return null
                                      return Object.assign(
                                        {
                                          alt: item.image.alt || '',
                                          sizes: '90px',
                                          srcset: srcset(url, [90, 180], {
                                            transforms: 'q_100',
                                            aspect: 1
                                          }),
                                          src: src(url, [60])
                                        },
                                        item.image.dimensions
                                      )
                                    },
                                    [item.image.url, 'small']
                                  ),
                                  title: asText(item.name),
                                  body: asElement(item.description, resolve)
                                })
                              )
                            )}
                          </div>
                        `
                      )
                    ])}
                  </div>
                `
              }
              case 'course_schedule': {
                const now = new Date()
                const valid = doc.data.schedule.filter(function (item) {
                  return parse(item.deadline) > now
                })
                if (!valid.length) return null
                return html`
                  <div class="u-container u-space2">
                    <div class="Text">
                      <h2 class="u-textCenter">
                        ${text`Upcoming course dates`}
                      </h2>
                      <span><!-- Maintain equal spacing --></span>
                    </div>
                    <ol>
                      ${valid.map(
                        (item) => html`
                          <li>
                            ${date({
                              title: item.title,
                              label: item.label,
                              link:
                                (item.link.id || item.link.url) &&
                                !item.link.isBroken
                                  ? {
                                      theme: 'blue',
                                      href: resolve(item.link),
                                      text: text`Go to application`,
                                      external: item.link.target === '_blank',
                                      onclick: track
                                    }
                                  : null
                            })}
                          </li>
                        `
                      )}
                    </ol>
                  </div>
                `
              }
              default:
                return slices(slice, index, list, link)
            }
          })}
        </main>
      `

      // track generated lead
      // obj -> void
      function track() {
        emit('track', 'generate_lead', { event_label: title })
      }
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
  return state.prismic.getByUID('course', state.params.slug, (err, doc) => {
    if (err) throw err
    if (!doc) return null
    const props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description),
      contact: {
        hubspot: doc.data.hubspot,
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
