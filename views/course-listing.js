var html = require('choo/html')
var parse = require('date-fns/parse')
var format = require('date-fns/format')
var asElement = require('prismic-element')
var { Predicates } = require('prismic-javascript')
var view = require('../components/view')
var Hero = require('../components/hero')
var grid = require('../components/grid')
var Card = require('../components/card')
var callout = require('../components/callout')
var { i18n, asText, srcset, HTTPError, memo, resolve, metaKey } = require('../components/base')

var text = i18n()

module.exports = view(home, meta)

function home (state, emit) {
  return html`
    <main class="View-main">
      ${state.prismic.getSingle('discover', function (err, doc) {
        if (err) throw HTTPError(404, err)
        if (!doc) {
          let items = []
          for (let i = 0; i < 6; i++) items.push(Card.loading({ date: true }))
          return html`
            <div>
              ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
                title: asText(state.partial.data.title),
                image: memo(function (url, sizes) {
                  if (!url) return null
                  return Object.assign({
                    alt: state.partial.data.image.alt || '',
                    src: srcset(state.partial.data.image.url, sizes).split(' ')[0]
                  }, state.partial.data.image.dimensions)
                }, [state.partial.data.image && state.partial.data.image.url, [150]])
              }) : Hero.loading({ center: true, image: true })}
              <div class="u-container">
                ${callout.loading()}
                <div class="u-space2">
                  ${grid({ size: { md: '1of2', lg: '1of3' } }, items)}
                </div>
              </div>
            </div>
          `
        }

        var image = memo(function (url, sizes) {
          if (!url) return null
          var sources = srcset(url, sizes)
          return Object.assign({
            sizes: '100vw',
            srcset: sources,
            alt: doc.data.image.alt || '',
            src: sources.split(' ')[0]
          }, doc.data.image.dimensions)
        }, [doc.data.image && doc.data.image.url, [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']]])

        var featured = doc.data.featured_articles.map(function (item, index) {
          let title = asText(item.heading)
          if (!title && item.link.id) title = asText(item.link.data.title)

          let body = null
          if (item.body.length) body = asElement(item.body)
          else if (item.link.id) body = asElement(item.link.data.description)

          let image = item.image
          if (!image || (!image.url && item.link.id)) {
            image = item.link.data.featured_image
            if (!image || !image.url) image = item.link.data.image
          }

          let props = {
            title: title,
            body: body,
            direction: index % 2 ? 'right' : 'left',
            action: (item.link.url || item.link.id) && !item.link.isBroken ? {
              href: resolve(item.link),
              onclick: item.link.id ? partial(item.link) : null,
              text: item.link.type === 'Document' ? item.link.data.cta : text`Read more`
            } : null,
            image: memo(function (url, sizes) {
              if (!url) return null
              var sources = srcset(url, sizes, {
                transforms: 'c_thumb,g_face',
                aspect: 10 / 12
              })
              return {
                src: sources.split(' ')[0],
                sizes: '(min-width: 1000px) 35vw, (min-width: 600px) 200px, 100vw',
                srcset: sources,
                alt: image.alt || '',
                width: image.dimensions.width,
                height: image.dimensions.width * 10 / 12
              }
            }, [image && image.url, [400, 800, 1200, [1500, 'q_50']]])
          }

          return callout(props)
        }).filter(Boolean)

        var opts = {
          pageSize: 100,
          orderings: '[document.first_publication_date desc]'
        }
        var predicates = [Predicates.at('document.type', 'article')]
        doc.data.featured_articles.forEach(function (item) {
          if (item.link.id) {
            predicates.push(Predicates.not('document.id', item.link.id))
          }
        })
        var articles = state.prismic.get(predicates, opts, function (err, response) {
          if (err) return null
          if (!response) {
            let items = []
            for (let i = 0; i < 6; i++) items.push(Card.loading({ date: true }))
            return articles
          }
          return response.results.map(function (article) {
            var image = article.data.featured_image
            if (!image.url) image = article.data.image
            var date = parse(article.first_publication_date)

            return state.cache(Card, `${doc.id}-${article.id}`).render({
              image: memo(function (url, sizes) {
                if (!url) return null
                var sources = srcset(url, sizes, {
                  transforms: 'c_thumb,g_face'
                })
                return Object.assign({
                  srcset: sources,
                  sizes: '(min-midth: 600px) 33vw, (min-midth: 400px) 50vw, 100vw',
                  alt: image.alt || '',
                  src: sources.split(' ')[0]
                }, image.dimensions)
              }, [image && image.url, [520, 700, 900]]),
              title: asText(article.data.title),
              date: {
                datetime: date,
                text: html`<span class="u-textBold u-textUppercase">${format(date, 'MMM D, YYYY')}</span>`
              },
              link: {
                onclick: partial(article),
                href: resolve(article),
                visible: false
              }
            })
          })
        })

        return html`
          <div>
            ${state.cache(Hero, `hero-${doc.id}`).render({
              title: asText(doc.data.title),
              image: image
            })}
            <div class="u-container">
              ${featured}
              <div class="u-space2">
                ${articles ? grid({ size: { md: '1of2', lg: '1of3' } }, articles) : null}
              </div>
            </section>
          </div>
        `
      })}
    </main>
  `

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial (doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta (state) {
  return state.prismic.getSingle('discover', function (err, doc) {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description)
    }

    var image = doc.data.featured_image
    if (!image.url) image = doc.data.image
    if (image.url) {
      Object.assign(props, {
        'og:image': image.url,
        'og:image:width': image.dimensions.width,
        'og:image:height': image.dimensions.height
      })
    }

    return props
  })
}
