var html = require('choo/html')
var parse = require('date-fns/parse')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var grid = require('../components/grid')
var date = require('../components/date')
var person = require('../components/person')
var button = require('../components/button')
var slices = require('../components/slices')
var { i18n, asText, resolve, loader, src, srcset, HTTPError, metaKey, memo } = require('../components/base')

var text = i18n()

module.exports = view(course, meta, 'page')

function course (state, emit) {
  emit('theme', 'yellow')
  return state.prismic.getByUID('course', state.params.slug, function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
            theme: 'yellow',
            label: loader(18),
            body: html`
              <h1>${asText(state.partial.data.title)}</h1>
            `
          }) : Hero.loading({ theme: 'yellow' })}
          <div class="u-container">
            <div class="Text u-space1">
              <p>${loader(65)}</p>
            </div>
          </div>
        </main>
      `
    }

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: 'yellow',
          label: doc.data.label,
          body: html`
            <h1 class="u-spaceB3">${asText(doc.data.title)}</h1>
            ${button(memo(function (link) {
              if ((!link.url && !link.id) || link.isBroken) return null
              var attrs = {
                theme: 'blue',
                text: text`Go to application`,
                href: resolve(doc.data.apply)
              }
              if (link.target === '_blank') {
                attrs.target = '_blank'
                attrs.rel = 'noopenere nofererrer'
              }
              return attrs
            }, [doc.data.apply, 'apply']))}
          `
        })}
        ${doc.data.body.map(function (slice, index, list) {
          switch (slice.slice_type) {
            case 'course_details': {
              return html`
                <div class="u-container u-space1">
                  ${grid([
                    grid.cell({ size: { lg: '1of3' } }, [html`
                      <div class="Text">
                        <h4>${text`Location`}</h4>
                        ${asElement(doc.data.location, resolve)}
                      </div>
                    `]),
                    grid.cell({ size: { lg: '2of3' } }, html`
                      <div>
                        <div class="Text">
                          <h4>${text`Teachers`}</h4>
                          <span><!-- Maintain equal spacing --></span>
                        </div>
                        ${grid(
                          { size: { lg: '1of2' } },
                          doc.data.teachers.map((item) => person({
                            small: true,
                            image: memo(function (url) {
                              if (!url) return null
                              return Object.assign({
                                alt: item.image.alt || '',
                                sizes: '60px',
                                srcset: srcset(url, [60, 120]),
                                src: src(url, [60])
                              }, item.image.dimensions)
                            }, [item.image.url, 'small']),
                            title: asText(item.name),
                            body: asElement(item.description)
                          }))
                        )}
                      </div>
                    `)
                  ])}
                </div>
              `
            }
            case 'course_schedule': {
              let now = new Date()
              let valid = doc.data.schedule.filter(function (item) {
                return parse(item.deadline) > now
              })
              if (!valid.length) return null
              return html`
                <div class="u-container u-space2">
                  <div class="Text">
                    <h4>${text`Upcoming course dates`}</h4>
                    <span><!-- Maintain equal spacing --></span>
                  </div>
                  <ol>
                    ${valid.map((item) => html`
                      <li>
                        ${date({
                          title: item.title,
                          label: item.label,
                          link: (item.link.id || item.link.url) && !item.link.isBroken ? {
                            theme: 'blue',
                            href: resolve(item.link),
                            text: text`Go to application`,
                            external: item.link.target === '_blank'
                          } : null
                        })}
                      </li>
                    `)}
                  </ol>
                </div>
              `
            }
            default: return slices(slice, index, list, link)
          }
        })}
      </main>
    `
  })

  // create link handler, emitting pushState w/ partial info
  // obj -> fn
  function link (doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta (state) {
  return state.prismic.getByUID('course', state.params.slug, (err, doc) => {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description)
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
