var html = require('choo/html')
var parse = require('date-fns/parse')
var format = require('date-fns/format')
var isSameMonth = require('date-fns/is_same_month')
var view = require('../components/view')
var Hero = require('../components/hero')
var grid = require('../components/grid')
var Card = require('../components/card')
var { asText, srcset, HTTPError, memo } = require('../components/base')

module.exports = view(home, meta)

function home (state, emit) {
  return html`
    <main class="View-main">
      ${state.prismic.getSingle('events', function (err, doc) {
        if (err) throw HTTPError(404, err)
        if (!doc) {
          let items = []
          let opts = { location: true, date: true, body: false }
          for (let i = 0; i < 6; i++) items.push(Card.loading(opts))
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
              <div class="u-container u-space2">
                ${grid({ size: { md: '1of2', lg: '1of3' } }, items)}
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
        }, [doc.data.image.url, [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']]])

        var events = doc.data.events
          .filter((item) => item.start && item.link.url)
          .map((item) => Object.assign({}, item, { start: parse(item.start) }))
          .sort((a, b) => a.start < b.start ? -1 : 1)
          .slice(0, 4)
          .map(function (item) {
            var date
            if (item.end) {
              let end = parse(item.end)
              if (isSameMonth(item.start, end)) {
                date = `${item.start.getDate()} – ${format(end, 'D MMMM')}`
              } else {
                date = `${format(item.start, 'D MMMM')} – ${format(end, 'D MMMM')}`
              }
            } else {
              date = format(item.start, 'D MMMM')
            }

            return Card({
              image: memo(function (url, sizes) {
                if (!url) return () => html`<div class="u-aspect1-1 u-bgOrange"></div>`
                var sources = srcset(url, sizes, {
                  aspect: 10 / 12,
                  transforms: 'c_thumb'
                })
                return {
                  srcset: sources,
                  sizes: '(min-midth: 600px) 33vw, (min-width: 400px) 50vw, 100vw',
                  alt: item.image.alt || '',
                  src: sources.split(' ')[0],
                  width: item.image.dimensions.width,
                  height: item.image.dimensions.width * 10 / 12
                }
              }, [item.image && item.image.url, [520, 700, 900, 1200]]),
              title: asText(item.title),
              date: {
                datetime: item.start,
                text: html`<span class="u-textBold u-textUppercase">${date}</span>`
              },
              location: [item.city, item.country].filter(Boolean).join(', '),
              link: {
                href: item.link.url
              }
            })
          })

        return html`
          <div>
            ${state.cache(Hero, `hero-${doc.id}`).render({
              title: asText(doc.data.title),
              image: image
            })}
            <div class="u-container u-space2">
              ${grid({ size: { md: '1of2', lg: '1of3' } }, events)}
            </div>
          </div>
        `
      })}
    </main>
  `
}

function meta (state) {
  return state.prismic.getSingle('events', function (err, doc) {
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
