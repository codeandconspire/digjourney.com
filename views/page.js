const html = require('choo/html')
const asElement = require('prismic-element')
const { asText } = require('@prismicio/helpers')
const view = require('../components/view')
const Hero = require('../components/hero')
const slices = require('../components/slices')
const {
  loader,
  resolve,
  src,
  HTTPError,
  metaKey
} = require('../components/base')

module.exports = view(page, meta, 'page')

function page(state, emit) {
  return state.prismic.getByUID('page', state.params.slug, function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      if (state.partial && state.partial.theme) {
        emit('theme', state.partial.data.theme.toLowerCase())
      }

      return html`
        <main class="View-main">
          ${state.partial
            ? state.cache(Hero, `hero-${state.partial.id}`).render({
                theme: state.partial.data.theme.toLowerCase(),
                body: html`
                  <h1>${asText(state.partial.data.title)}</h1>
                  ${state.partial.data.description
                    ? asElement(state.partial.data.description, resolve)
                    : null}
                `
              })
            : Hero.loading({ theme: state.ui.theme })}
          <div class="u-container u-space1">
            <div class="Text">${loader(65)}</div>
          </div>
        </main>
      `
    }

    emit('theme', doc.data.theme.toLowerCase() || 'gray')

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: doc.data.theme.toLowerCase(),
          pull:
            doc.data.body &&
            doc.data.body.length &&
            (doc.data.body[0].slice_type === 'image' ||
              doc.data.body[0].slice_type === 'video'),
          body: html`
            <h1>${asText(doc.data.title)}</h1>
            ${asElement(doc.data.description, resolve)}
          `
        })}
        ${doc.data.body.map((slice, index, list) =>
          slices(slice, index, list, onclick)
        )}
      </main>
    `
  })

  // create link handler, emitting pushState w/ partial info
  // obj -> fn
  function onclick(doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta(state) {
  return state.prismic.getByUID('page', state.params.slug, (err, doc) => {
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
