var html = require('choo/html')
var asElement = require('prismic-element')
var Card = require('../card')
var grid = require('../grid')
var facts = require('../facts')
var embed = require('../embed')
var person = require('../person')
var highlight = require('../highlight')
var serialize = require('../text/serialize')
var { i18n, asText, resolve, srcset, src, memo } = require('../base')

var text = i18n()

module.exports = slices

function slices (slice, index, onclick) {
  switch (slice.slice_type) {
    case 'text': {
      if (!slice.primary.text.length) return null
      return html`
        <div class="u-container">
          <div class="Text">
            ${asElement(slice.primary.text, resolve, serialize)}
          </div>
        </div>
      `
    }
    case 'image': {
      if (!slice.primary.image.url) return null

      let attrs = memo(function (image) {
        var attrs = Object.assign({ alt: image.alt || '' }, image.dimensions)

        if (!/\.(svg|gif?)$/.test(image.url)) {
          attrs.sizes = '100vw'
          attrs.srcset = srcset(
            image.url,
            [640, 750, 1125, 1440, [2880, 'q_50'], [3840, 'q_50']]
          )
        }

        return attrs
      }, [slice.primary.image])

      var caption = slice.primary.image.alt

      return html`
        <figure class="Text u-sizeFull">
          <div class="u-md-container">
            <img ${attrs} src="${src(slice.primary.image.url, 800)}">
          </div>
          <div class="u-container">
            ${caption ? html`<figcaption class="Text-caption">${caption}</figcaption>` : null}
          </div>
        </figure>
      `
    }
    case 'line': {
      return html`
        <div class="u-container"><hr class="u-medium u-space1"></div>
      `
    }
    case 'video': {
      if (slice.primary.video.type !== 'video') return null
      let children = video(slice.primary.video)
      if (!children) return null

      return html`
        <div class="u-md-container">
          <figure class="Text u-sizeFull">
            <div class="u-space1">${children}</div>
          </div>
        </div>
      `
    }
    case 'highlight': {
      let link = slice.primary.link
      let title = asText(slice.primary.heading)
      if (!title && link.id) title = asText(link.data.title)

      let image = slice.primary.image
      if (!image || (!image.url && link.id)) {
        image = link.data.featured_image
        if (!image || !image.url) image = link.data.image
      }

      let props = {
        title: title,
        label: text(link.type || link.link_type),
        direction: slice.primary.direction.toLowerCase(),
        link: (link.url || link.id) && !link.isBroken ? {
          href: resolve(link),
          onclick: link.id ? onclick(link) : null,
          text: link.id ? link.data.cta : text`Read more`
        } : null,
        image: memo(function (url, sizes) {
          if (!url) return null
          return {
            src: src(url, 720),
            sizes: '(min-width: 1000px) 35vw, (min-width: 600px) 200px, 100vw',
            srcset: srcset(url, sizes, { aspect: 10 / 12 }),
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
    case 'people': {
      let people = slice.items.filter(function (item) {
        if (item.link) return !item.link.isBroken
        return Boolean(item.image.url)
      })
      if (!people.length) return null

      return html`
        <section class="u-container u-space2">
          ${slice.primary.heading.length ? html`
            <header class="Text u-space2">
              <h2>${asText(slice.primary.heading)}</h2>
            </header>
          ` : null}
          ${grid({
            size: {
              md: '1of2',
              xl: '1of3'
            }
          }, people.map(function (item) {
            var title = asText(item.heading)
            var link = item.link
            var linkText = item.link_text
            if (!linkText) {
              if (link.id && !link.isBroken) {
                linkText = link.data.cta || asText(link.data.title)
              } else if (link.url) {
                linkText = text`Read more`
              }
            }
            return person({
              title: title,
              body: asElement(item.text, resolve, serialize),
              link: (link.id || link.url) && !link.isBroken ? {
                href: resolve(link),
                text: linkText,
                external: link.target === '_blank',
                onclick: link.id ? onclick(link) : null
              } : null,
              image: memo(function (url, sizes) {
                if (!url) return null
                return {
                  alt: title,
                  width: 180,
                  height: 180,
                  sizes: '180px',
                  srcset: srcset(url, sizes, {
                    aspect: 1,
                    transforms: 'c_fill,g_face'
                  }),
                  src: src(url, 180)
                }
              }, [item.image.url, [180, 360, 500]])
            })
          }))}
        </section>
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
        <section class="u-container u-space2">
          ${slice.primary.heading.length ? html`
            <header class="Text u-space2 u-textCenter">
              <h2>${asText(slice.primary.heading)}</h2>
            </header>
          ` : null}
          ${grid({ size: { md: '1of2' } }, blurbs.map(function (item, i) {
            var title = asText(item.heading)
            if (!title && item.link.id) title = asText(item.link.data.title)

            var body = item.text.length ? asElement(item.text, resolve, serialize) : null

            if (!body && item.link.id) {
              body = asElement(item.link.data.description, resolve, serialize)
            }

            var image = item.image
            if (!image.url && item.link.id) image = item.link.data.featured_image
            if (!image || (!image.url && item.link.id)) image = item.link.data.image
            image = memo(function (url, sizes) {
              if (!url) return null
              var sources = srcset(url, sizes, {
                aspect: 9 / 16,
                transforms: 'c_thumb,g_face'
              })
              return {
                srcset: sources,
                sizes: '(min-width: 600px) 50vw, 100vw',
                alt: image.alt || title,
                src: sources.split(' ')[0],
                width: image.dimensions.width,
                height: image.dimensions.width * 9 / 16
              }
            }, [image && image.url, [[520, 'q_50'], [700, 'q_50'], [900, 'q_50']]])

            var linkText = item.link_text
            if (!linkText) {
              if (item.link.id) linkText = item.link.data.cta
              else if (item.link.url) linkText = text`Read more`
            }
            var link = item.link.id || item.link.url ? {
              href: resolve(item.link),
              text: linkText,
              external: item.link.target === '_blank',
              onclick: item.link.id ? onclick(item.link) : null
            } : null

            return Card({ title, body, image, link })
          }))}
        </section>
      `
    }
    case 'facts_box': {
      let heading = slice.primary.heading
      return html`
        <section class="u-container">
          ${facts({
            heading: heading.length ? asText(heading) : null,
            body: asElement(slice.primary.body)
          })}
        </section>
      `
    }
    default: return null
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
