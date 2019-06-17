var html = require('choo/html')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var slices = require('../components/slices')
var { asText, resolve, src, HTTPError, metaKey } = require('../components/base')

module.exports = view(page, meta, 'page')

function page (state, emit) {
  return html`
    <main class="View-main">
      ${state.prismic.getByUID('page', state.params.slug, function (err, doc) {
        if (err) throw HTTPError(404, err)
        if (!doc) {
          if (!state.partial) return Hero.loading()
          return state.cache(Hero, `hero-${state.partial.id}`).render({
            body: html`
              <h1>${asText(state.partial.data.title)}</h1>
              ${asElement(state.partial.data.description, resolve)}
            `
          })
        }

        return html`
          ${state.cache(Hero, `hero-${doc.id}`).render({
            body: html`
              <h1>${asText(doc.data.title)}</h1>
              ${asElement(doc.data.description, resolve)}
            `
          })}
          ${doc.data.body.map((slice, index) => slices(slice, index, link))}
        `
      })}
    </main>
  `

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
  return state.prismic.getByUID('page', state.params.slug, (err, doc) => {
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
