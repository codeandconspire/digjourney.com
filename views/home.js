var html = require('choo/html')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var { i18n, asText, srcset, HTTPError, src, resolve } = require('../components/base')

var text = i18n()

module.exports = view(home, meta)

function home (state, emit) {
  return html`
    <main class="View-main">
      ${state.prismic.getSingle('homepage', function (err, doc) {
        if (err) throw HTTPError(404, err)
        if (!doc) {
          return html`
            ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
              body: asElement(partial.data.intro, resolve)
            }) : Hero.loading({ image: true })}
          `
        }

        return html`
          ${state.cache(Hero, `hero-${doc.id}`).render({
            body: asElement(doc.data.intro, resolve)
          })}
        `
      })}
    </main>
  `

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial (doc) {
    return function (event) {
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function getHeroImage (image) {
  if (!image.url) return null
  return Object.assign({
    sizes: '100vw',
    srcset: srcset(
      image.url,
      [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']]
    ),
    alt: image.alt || '',
    src: src(image.url, 650)
  }, image.dimensions)
}

function meta (state) {
  return state.prismic.getSingle('homepage', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description)
    }

    var image = doc.data.featured_image
    if (image.url) {
      Object.assign(props, {
        'og:image': src(image.url, 1000),
        'og:image:width': 1000,
        'og:image:height': 1000 * image.dimensions.height / image.dimensions.width
      })
    }

    return props
  })
}
