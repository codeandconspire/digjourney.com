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

var RELATED_SIZE = 2

var text = i18n()

module.exports = view(post, meta)

function post (state, emit) {
  return state.prismic.getByUID('post', state.params.slug, function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
            theme: 'gray',
            label: loader(12),
            body: html`
              <h1>${asText(state.partial.data.title)}</h1>
            `
          }) : Hero.loading({ theme: 'gray' })}
        </main>
      `
    }

    var opts = {
      pageSize: 2,
      orderings: '[document.first_publication_date, my.post.alternative_publication_date desc]'
    }
    var predicates = [
      Predicates.at('document.type', 'post'),
      Predicates.any('document.tags', doc.tags),
      Predicates.not('document.id', doc.id)
    ]
    var related = state.prismic.get(predicates, opts, function (err, response) {
      if (err) return []
      if (!response) return new Array(RELATED_SIZE).fill()

      var result = response.results.filter(Boolean)
      if (result.length < RELATED_SIZE) {
        opts.pageSize = RELATED_SIZE - result.length
        let predicates = [
          Predicates.at('document.type', 'post'),
          Predicates.not('document.id', doc.id)
        ]
        result.forEach(function (doc) {
          if (!doc) return
          predicates.push(Predicates.not('document.id', doc.id))
        })
        result.push(...state.prismic.get(predicates, opts, function (err, response) {
          if (err) return []
          if (!response) return new Array(RELATED_SIZE - result.length).fill()
          return response.results
        }))
      }
      return result
    })

    var date = doc.data.alternative_publication_date
    if (!date) date = doc.first_publication_date
    date = format(parse(date), 'D MMMM YYYY', { locale: sv })

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: 'gray',
          label: doc.data.author ? text`Published by ${doc.data.author} on ${date}` : text`Published on ${date}`,
          body: html`
            <h1>${asText(doc.data.title)}</h1>
          `
        })}
        <div class="u-container u-spaceB4">
          <div class="Text">
            ${asElement(doc.data.description, resolve)}
          </div>
        </div>
        ${doc.data.body.map((slice, index, list) => slices(slice, index, list, link))}
        <div class="u-container u-space2">
          ${related.length ? html`
            <div class="Text u-space1">
              <h2>${text`Related posts`}</h2>
            </div>
          ` : null}
          ${grid({ divided: true, size: { md: '1of2' } }, related.map(function (doc, index, list) {
            if (!doc) return card.loading({ date: true })

            var date = doc.data.alternative_publication_date
            if (!date) date = doc.first_publication_date
            date = parse(date)

            return card({
              title: asText(doc.data.title),
              body: asText(doc.data.description),
              date: {
                datetime: date,
                text: format(date, 'D MMMM YYYY', { locale: sv })
              },
              link: {
                href: resolve(doc),
                text: text`Read more`
              }
            })
          }))}
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
    if (!doc) return { 'theme': 'gray' }
    var props = {
      theme: 'gray',
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
