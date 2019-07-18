var html = require('choo/html')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var { asText, HTTPError, src, resolve } = require('../components/base')

module.exports = view(home, meta)

function home (state, emit) {
  return state.prismic.getSingle('homepage', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
            body: asElement(state.partial.data.intro, resolve)
          }) : Hero.loading()}
        </main>
      `
    }

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          body: asElement(doc.data.intro, resolve)
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
    if (!doc) return null
    var props = {
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
