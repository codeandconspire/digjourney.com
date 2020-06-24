var html = require('choo/html')
var parse = require('date-fns/parse')
var sv = require('date-fns/locale/sv')
var format = require('date-fns/format')
var asElement = require('prismic-element')
var { Predicates } = require('prismic-javascript')
var view = require('../components/view')
var grid = require('../components/grid')
var card = require('../components/card')
var Hero = require('../components/hero')
var slices = require('../components/slices')
var { i18n, asText, loader, resolve, src, HTTPError, metaKey } = require('../components/base')


var text = i18n()

module.exports = view(post, meta)

function post (state, emit) {
  emit('theme', 'gray')
  return state.prismic.getByUID('post', state.params.slug, function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
            theme: 'gray',
            blobs: false,
            label: loader(12),
            body: html`
              <h1>${asText(state.partial.data.title)}</h1>
            `
          }) : Hero.loading({ theme: 'gray' })}
          <div class="u-container u-space2 u-spaceB0">
            <div class="Text">
              <p>${loader(65)}</p>
            </div>
          </div>
        </main>
      `
    }

    var related = null

    if (doc.data.related_posts && doc.data.related_posts.length) {
      related = doc.data.related_posts
    }

    var date = doc.data.alternative_publication_date
    if (!date) date = doc.first_publication_date
    date = format(parse(date), 'D MMMM YYYY', { locale: sv })

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          blobs: false,
          theme: 'gray',
          label: doc.data.author ? text`Published by ${doc.data.author} on ${date}` : text`Published on ${date}`,
          body: html`
            <h1>${asText(doc.data.title)}</h1>
          `
        })}
        <div class="u-container u-space2 u-spaceB0">
          <div class="Text">
            ${asElement(doc.data.description, resolve)}
          </div>
        </div>
        ${doc.data.body.map((slice, index, list) => slices(slice, index, list, link))}
        <div class="${related && related.length ? 'u-borderB' : ''} u-space2">
          <div class="u-container u-space2">
            ${related && related.length ? html`
              <div class="Text u-space1">
                <h2>${text`Related posts`}</h2>
              </div>
              ${grid({ divided: true, size: { md: '1of2' } }, related.map(function (item) {
                if (!item) return card.loading({ date: true })
                if (item.post && item.post.isBroken) return card.loading({ date: true })
                if (item.post && !item.post.title) return card.loading({ date: true })

                var date = item.post.data && item.post.data.alternative_publication_date
                if (!date) date = item.post.data && item.post.data.first_publication_date
                if (date) {
                  var dateData = {
                    datetime: parse(date),
                    text: format(parse(date), 'D MMMM YYYY', { locale: sv })
                  }
                }

                return card({
                  title: asText(item.post.data.title),
                  body: asText(item.post.data.description),
                  date: dateData,
                  link: {
                    href: resolve(item.post),
                    text: text`Read more`
                  }
                })
              }))}
            ` : null}
          </div>
        </div>
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
  return state.prismic.getByUID('post', state.params.slug, (err, doc) => {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description),
      contact: {
        blurb: doc.data.contact_blurb ? doc.data.contact_blurb : null
      }
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
