var html = require('choo/html')
var asElement = require('prismic-element')
var view = require('../components/view')
var Hero = require('../components/hero')
var Card = require('../components/card')
var grid = require('../components/grid')
var embed = require('../components/embed')
var person = require('../components/person')
var compass = require('../components/compass')
var highlight = require('../components/highlight')
var principles = require('../components/principles')
var { i18n, asText, resolve, srcset, HTTPError, memo } = require('../components/base')

var text = i18n()

module.exports = view(page, meta, 'page')

function page (state, emit) {
  var type = state.params.type || 'page'

  return html`
    <main class="View-main">
      ${state.prismic.getByUID(type, state.params.slug, (err, doc) => {
        if (err) throw HTTPError(404, err)
        if (!doc) {
          if (state.partial) {
            return html`
              <div>
                ${state.cache(Hero, `hero-${state.partial.id}`).render({
                  title: asText(state.partial.data.title),
                  body: asText(state.partial.data.description),
                  image: memo(function (url, sizes) {
                    if (!url) return null
                    return Object.assign({
                      alt: state.partial.data.image.alt || '',
                      src: srcset(state.partial.data.image.url, sizes).split(' ')[0]
                    }, state.partial.data.image.dimensions)
                  }, [state.partial.data.image && state.partial.data.image.url, [150]])
                })}
              </div>
            `
          }
          return html`
            <div>
              ${Hero.loading({ center: true })}
            </div>
          `
        }

        var image = memo(function (url, sizes) {
          if (!url) return null
          var sources = srcset(doc.data.image.url, sizes)
          return Object.assign({
            sizes: '100vw',
            srcset: sources,
            alt: doc.data.image.alt || '',
            src: sources.split(' ')[0]
          }, doc.data.image.dimensions)
        }, [doc.data.image && doc.data.image.url, [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']]])

        var action = doc.data.action
        if (action && action.id && !action.isBroken) {
          var button = {
            href: resolve(action),
            onclick: partial(action),
            text: action.data.call_to_action ? action.data.call_to_action : asText(action.data.title)
          }
        }

        return html`
          <div>
            ${state.cache(Hero, `hero-${doc.id}`).render({
              title: asText(doc.data.title),
              body: asText(doc.data.description),
              image: image,
              action: button
            })}
            <div class="u-space2">
              ${doc.data.body.map(asSlice)}
            </div>
          </div>
        `
      })}
    </main>
  `

  // render slice as element
  // (obj, num) -> Element
  function asSlice (slice, index, list) {
    switch (slice.slice_type) {
      case 'text': {
        if (!slice.primary.text.length) return null
        return html`
          <div class="u-container">
            <div class="Text">
              ${asElement(slice.primary.text, resolve, state.serialize)}
            </div>
          </div>
        `
      }
      case 'image': {
        if (!slice.primary.image.url) return null
        let size = slice.primary.width.toLowerCase()
        let large = size === 'large'

        let sources = srcset(slice.primary.image.url, [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']])
        let attrs = Object.assign({
          sizes: large ? '100vw' : '(min-width: 800px) 43rem, 100vw',
          srcset: sources,
          class: large ? 'u-space2' : 'u-space1',
          src: sources.split(' ')[0],
          alt: slice.primary.image.alt || ''
        }, slice.primary.image.dimensions)

        var caption = slice.primary.caption ? asElement(slice.primary.caption) : slice.primary.image.copyright

        return html`
          <div class="${large ? 'u-md-container' : 'u-container'}">
            <figure class="Text u-${size}">
              <img ${attrs}>
              ${caption ? html`<figcaption class="Text-caption">${caption}</figcaption>` : null}
            </figure>
          </div>
        `
      }
      case 'line': {
        return html`
          <div class="u-container"><hr class="u-medium u-space1" /></div>
        `
      }
      case 'video': {
        if (slice.primary.video.type !== 'video') return null
        let children = video(slice.primary.video)
        if (!children) return null

        let size = slice.primary.width.toLowerCase()
        let large = size === 'large'

        return html`
          <div class="${large ? 'u-md-container' : 'u-container'}">
            <figure class="Text u-${size}">
              <div class="u-space1">${children}</div>
            </div>
          </div>
        `
      }
      case 'principles': {
        if (!slice.items.length) return null
        let list = slice.items.map(function (item) {
          return {
            title: item.heading ? asText(item.heading) : null,
            body: item.content ? asElement(item.content) : null
          }
        })

        return html`
          <div class="u-md-container u-overflowHidden">
            ${principles(list)}
          </div>
        `
      }
      case 'highlight': {
        let title = asText(slice.primary.heading)
        if (!title && slice.primary.link.id) {
          title = asText(slice.primary.link.data.title)
        }

        let body = null
        if (slice.primary.highlight_body.length) {
          body = asElement(slice.primary.highlight_body)
        } else if (slice.primary.link.id) {
          body = asElement(slice.primary.link.data.description)
        }

        let image = slice.primary.image
        if (!image || (!image.url && slice.primary.link.id)) {
          image = slice.primary.link.data.featured_image
          if (!image || !image.url) image = slice.primary.link.data.image
        }

        let props = {
          title: title,
          body: body,
          direction: slice.primary.direction.toLowerCase(),
          action: (slice.primary.link.url || slice.primary.link.id) && !slice.primary.link.isBroken ? {
            href: resolve(slice.primary.link),
            onclick: slice.primary.link.id ? partial(slice.primary.link) : null,
            text: slice.primary.link.type === 'Document' ? slice.primary.link.data.call_to_action : text`Read more`
          } : null,
          image: memo(function (url, sizes) {
            if (!url) return null
            var sources = srcset(url, sizes, {
              transforms: 'c_thumb',
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
          }, [image && image.url, [720, 400, 800, 1200]])
        }

        return html`
          <div class="u-container">${highlight(props)}</div>
        `
      }
      case 'compass': {
        if (!slice.primary.heading || !slice.primary.image) return null
        let props = {
          title: asText(slice.primary.heading),
          image: memo(function (url, sizes) {
            if (!url) return null
            var sources = srcset(url, sizes, {
              transforms: 'c_thumb',
              aspect: 1
            })
            return {
              src: sources.split(' ')[0],
              sizes: '(min-width: 1000px) 660px, 400px',
              srcset: sources,
              alt: slice.primary.image.alt || '',
              width: slice.primary.image.dimensions.width,
              height: slice.primary.image.dimensions.width
            }
          }, [slice.primary.image && slice.primary.image.url, [400, 800, 1200, [1500, 'q_50']]]),
          children: slice.items.map(function (item) {
            return Card({
              title: asText(item.heading),
              body: asElement(item.description, resolve, state.serialize),
              link: (item.link.url || item.link.id) && !item.link.isBroken ? {
                href: resolve(item.link),
                onclick: item.link.id ? partial(item.link) : null,
                text: item.link.type === 'Document' ? item.link.data.call_to_action : null
              } : null
            })
          })
        }

        return html`
          <section class="u-space2">
            <div class="u-container">
              ${compass(props)}
            </div>
          </section>
        `
      }
      case 'people': {
        let people = slice.items.filter(function (item) {
          if (item.link) return !item.link.isBroken
          return Boolean(item.image.url)
        })
        if (!people.length) return null

        return html`
          <div class="u-container u-space2">
            ${slice.primary.heading.length ? html`
              <header class="Text u-space2 u-textCenter">
                <h1>${asText(slice.primary.heading)}</h1>
              </header>
            ` : null}
            ${grid({
              size: {
                sm: '1of2',
                md: '1of3',
                lg: people.length > 3 ? '1of4' : '1of3'
              }
            }, people.map(function (item) {
              var title = asText(item.heading)
              var link = item.link
              var linkText = item.link_text
              if (!linkText) {
                if (link.id && !link.isBroken) {
                  linkText = link.data.call_to_action || asText(link.data.title)
                } else if (link.url) {
                  linkText = text`Read more`
                }
              }
              return person({
                title: title,
                body: asElement(item.text, resolve, state.serialize),
                link: (link.id || link.url) && !link.isBroken ? {
                  href: resolve(link),
                  text: linkText,
                  external: link.target === '_blank'
                } : null,
                image: memo(function (url, sizes) {
                  var sources = srcset(url, sizes, {
                    aspect: 1,
                    transforms: 'g_face,r_max'
                  })
                  return {
                    alt: title,
                    width: 180,
                    height: 180,
                    sizes: '180px',
                    srcset: sources,
                    src: sources.split(' ')[0]
                  }
                }, [item.image.url, [180, 360, 500]])
              })
            }))}
          </div>
        `
      }
      case 'blurbs': {
        let blurbs = slice.items.filter(function (item) {
          if (item.link.id) return !item.link.isBroken
          if (item.link.url && item.link_text) return true
          return item.image.url || item.heading.length
        })
        if (!blurbs.length) return null

        return html`
          <div class="u-container u-space2">
            ${slice.primary.heading.length ? html`
              <header class="Text u-space2 u-textCenter">
                <h1>${asText(slice.primary.heading)}</h1>
              </header>
            ` : null}
            ${grid({ size: { md: '1of2', lg: '1of3' } }, blurbs.map(function (item, i) {
              var title = asText(item.heading)
              if (!title && item.link.id) title = asText(item.link.data.title)

              var body = item.text.length ? asElement(item.text, resolve, state.serialize) : null

              if (!body && item.link.id) {
                body = asElement(item.link.data.description, resolve, state.serialize)
              }

              var image = item.image
              if (!image.url && item.link.id) image = item.link.data.featured_image
              if (!image || (!image.url && item.link.id)) image = item.link.data.image
              image = memo(function (url, sizes) {
                if (!url) return null
                var sources = srcset(url, sizes, {
                  aspect: 9 / 16,
                  transforms: 'c_thumb'
                })
                return {
                  srcset: sources,
                  sizes: '(min-width: 600) 33vw, (min-width: 400px) 50vw, 100vw',
                  alt: image.alt || title,
                  src: sources.split(' ')[0],
                  width: image.dimensions.width,
                  height: image.dimensions.width * 9 / 16
                }
              }, [image && image.url, [[520, 'q_50'], [700, 'q_50'], [900, 'q_50']]])

              var linkText = item.link_text
              if (!linkText) {
                if (item.link.id) linkText = item.link.data.call_to_action
                else if (item.link.url) linkText = text`Read more`
              }
              var link = item.link.id || item.link.url ? {
                href: resolve(item.link),
                text: linkText,
                external: item.link.target === '_blank'
              } : null

              var id = `${state.href}-blurb-${index}-${i}`
              var props = { title, body, image, link }
              if (item.link.id) props.onclick = partial(item.link)

              return state.cache(Card, id).render(props)
            }))}
          </div>
        `
      }
      default: return null
    }
  }

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial (doc) {
    return function (event) {
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

// map props to embed player
// obj -> Element
function video (props) {
  var id = embed.id(props)
  if (!id) return null

  var provider = props.provider_name.toLowerCase()
  return embed({
    url: props.embed_url,
    title: props.title,
    src: `/media/${provider}/w_900/${id}`,
    width: props.thumbnail_width,
    height: props.thumbnail_height,
    sizes: '100vw',
    srcset: srcset(id, [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']], { type: provider })
  })
}

function meta (state) {
  var type = state.params.type || 'page'
  return state.prismic.getByUID(type, state.params.slug, (err, doc) => {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description)
    }

    var image = doc.data.featured_image
    if (image && image.url) {
      Object.assign(props, {
        'og:image': image.url,
        'og:image:width': image.dimensions.width,
        'og:image:height': image.dimensions.height
      })
    }

    return props
  })
}
