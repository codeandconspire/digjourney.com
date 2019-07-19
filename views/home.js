var html = require('choo/html')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var callout = require('../components/callout')
var { asText, loader, HTTPError, src, resolve } = require('../components/base')

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
