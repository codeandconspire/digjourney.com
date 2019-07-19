var html = require('choo/html')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var book = require('../components/book')
var slices = require('../components/slices')
var callout = require('../components/callout')
var { i18n, asText, loader, HTTPError, src, srcset, memo, resolve } = require('../components/base')

var text = i18n()

module.exports = view(home, meta)

function home (state, emit) {
  return state.prismic.getSingle('homepage', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${Hero.loading({ theme: 'blue' })}
          <div class="u-container u-space1">
            ${callout.loading()}
          </div>
          <div class="u-container u-space1">
            <div class="Text">
              ${loader(65)}
            </div>
          </div>
        </main>
      `
    }

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: 'blue',
          body: asElement(doc.data.intro, resolve)
        })}
        ${doc.data.body.map(function (slice, index, list) {
          switch (slice.slice_type) {
            case 'book': return book({
              rating: slice.primary.rating,
              author: slice.primary.author,
              title: asText(slice.primary.title),
              body: asElement(slice.primary.description, resolve),
              image: memo(function (url) {
                if (!url) return null
                return Object.assign({
                  src: src(url, [900]),
                  alt: slice.primary.image.alt || '',
                  sizes: '(min-width: 1000px) 50vw, 100vw',
                  srcset: srcset(url, [400, 600, 900, 1200, 1800])
                }, slice.primary.image.dimensions)
              }, [slice.primary.image.url]),
              link: slice.primary.link.id && !slice.primary.link.isBroken ? {
                href: resolve(slice.primary.link),
                text: slice.primary.link_text || text`Read more`
              } : null,
              action: memo(function (link, str) {
                if (!str) return null
                if ((!link.id && !link.url) || link.isBroken) return null
                var attrs = { href: resolve(link), text: str }
                if (link.target === '_blank') {
                  attrs.target = '_blank'
                  attrs.rel = 'noopenere nofererrer'
                }
                return attrs
              }, [slice.primary.cta, slice.primary.cta_text])
            })
            default: return slices(slice, index, list, partial)
          }
        })}
      </main>
    `
  })

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial (doc) {
    return function (event) {
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta (state) {
  return state.prismic.getSingle('homepage', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) return { 'theme': 'blue' }
    var props = {
      theme: 'blue',
      title: asText(doc.data.title),
      description: asText(doc.data.description)
    }

    var image = doc.data.featured_image
    if (image.url) {
      Object.assign(props, {
        'og:image': src(image.url, 1200),
        'og:image:width': 1200,
        'og:image:height': 1200 * image.dimensions.height / image.dimensions.width
      })
    }

    return props
  })
}
