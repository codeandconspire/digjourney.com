const html = require('choo/html')
const asElement = require('prismic-element')
const card = require('../card')
const grid = require('../grid')
const facts = require('../facts')
const embed = require('../embed')
const quote = require('../quote')
const partners = require('../partners')
const person = require('../person')
const callout = require('../callout')
const symbols = require('../symbols')
const book = require('../book')
const serialize = require('../text/serialize')
const { i18n, resolve, srcset, src, memo, asText } = require('../base')

const text = i18n()

module.exports = slices

function slices(slice, index, list, onclick) {
  const last = index === list.length - 1

  switch (slice.slice_type) {
    case 'text': {
      if (!slice.primary.text.length) return null
      return html`
        <div class="${last ? 'u-borderB u-space2end' : ''}">
          <div class="u-container u-space1">
            <div class="Text Text--centerOnlyChildHeading">
              ${asElement(slice.primary.text, resolve, serialize)}
            </div>
          </div>
        </div>
      `
    }
    case 'image': {
      if (!slice.primary.image.url) return null

      const attrs = memo(
        function (image) {
          const attrs = Object.assign(
            { alt: image.alt || '' },
            image.dimensions
          )

          if (!/\.(svg|gif?)$/.test(image.url)) {
            attrs.sizes = '100vw'
            attrs.srcset = srcset(image.url, [
              640,
              750,
              1125,
              1440,
              [2880, 'q_90'],
              [3840, 'q_80']
            ])
          }

          return attrs
        },
        [slice.primary.image]
      )

      const caption = slice.primary.image.alt

      return html`
        <figure class="Text u-sizeFull u-space1">
          <div class="u-md-container">
            <div class="">
              <img ${attrs} src="${src(slice.primary.image.url, 800)}" />
              <div class="u-container">
                ${caption
                  ? html`
                      <figcaption class="Text-caption">${caption}</figcaption>
                    `
                  : null}
              </div>
            </div>
          </div>
        </figure>
      `
    }
    case 'line': {
      const prev = list[index - 1]
      const next = list[index + 1]
      const narrow =
        next &&
        next.slice_type === 'text' &&
        (!prev || prev.slice_type === 'text')
      return html`
        <div class="u-container">
          <hr class="${narrow ? 'u-medium' : ''} u-space1" />
        </div>
      `
    }
    case 'video': {
      if (slice.primary.video.type !== 'video') return null
      const children = video(slice.primary.video)
      if (!children) return null

      return html`
        <div class="u-md-container ${
          index === 0 ? 'u-spacePullUpHero' : 'u-space2'
        }">
          <figure class="Text u-sizeFull">
            <div class="${index === 0 ? '' : 'u-space1'}">${children}</div>
          </div>
        </div>
      `
    }
    case 'callout': {
      const link = slice.primary.link
      let title = asText(slice.primary.heading)
      if (!title && link.id) title = asText(link.data.title)
      let body = asElement(slice.primary.text, resolve, serialize)
      if (!text.length && link.id) body = asText(link.data.description)

      let image = slice.primary.image
      if ((!image || !image.url) && link.id && !link.isBroken) {
        image = link.data.featured_image
        if (!image || !image.url) image = link.data.image
      }

      let action = slice.primary.link_text
      if (!action) {
        if (link.id) action = link.data.cta
        else action = text`Read more`
      }

      const props = {
        title,
        body,
        theme: slice.primary.theme.toLowerCase(),
        direction: slice.primary.direction.toLowerCase(),
        link:
          (link.url || link.id) && !link.isBroken
            ? {
                href: resolve(link),
                onclick: link.id ? onclick(link) : null,
                text: action,
                target: link.target,
                rel: link.target === '_blank' ? 'noopenere nofererrer' : ''
              }
            : null,
        image: memo(
          function (url, sizes) {
            if (!url) return null
            return {
              src: src(url, 720),
              sizes:
                '(min-width: 1000px) 35vw, (min-width: 600px) 200px, 100vw',
              srcset: srcset(url, sizes),
              alt: image.alt || '',
              width: image.dimensions.width,
              height: (image.dimensions.width * 10) / 12
            }
          },
          [image && image.url, [720, 400, 800, 1200, 2000]]
        )
      }

      return html`
        <div class="u-calloutFix u-container u-space2">${callout(props)}</div>
      `
    }
    case 'book': {
      return html`
        <div class="u-space2">
          ${book({
            rating: slice.primary.rating,
            author: slice.primary.author,
            title: asText(slice.primary.title),
            body: asElement(slice.primary.description, resolve, serialize),
            image: memo(
              function (url) {
                if (!url) return null
                return Object.assign(
                  {
                    src: src(url, [900]),
                    alt: slice.primary.image.alt || '',
                    sizes: '(min-width: 1000px) 50vw, 100vw',
                    srcset: srcset(url, [400, 600, 900, 1200, 1800])
                  },
                  slice.primary.image.dimensions
                )
              },
              [slice.primary.image.url]
            ),
            link:
              slice.primary.link.id && !slice.primary.link.isBroken
                ? {
                    href: resolve(slice.primary.link),
                    text: slice.primary.link_text || text`Read more`,
                    target: slice.primary.link.target,
                    rel:
                      slice.primary.link.target === '_blank'
                        ? 'noopenere nofererrer'
                        : ''
                  }
                : null,
            action: memo(
              function (link, str) {
                if (!str) return null
                if ((!link.id && !link.url) || link.isBroken) return null
                const attrs = { href: resolve(link), text: str }
                if (link.target === '_blank') {
                  attrs.target = '_blank'
                  attrs.rel = 'noopenere nofererrer'
                }
                return attrs
              },
              [slice.primary.cta, slice.primary.cta_text]
            )
          })}
        </div>
      `
    }
    case 'people': {
      const people = slice.items.filter(function (item) {
        if (item.link) return !item.link.isBroken
        return Boolean(item.image.url)
      })
      if (!people.length) return null

      return html`
        <section class="u-container u-space2">
          ${slice.primary.heading.length
            ? html`
                <header class="Text Text--centerOnlyChildHeading u-space1">
                  <h2>${asText(slice.primary.heading)}</h2>
                </header>
              `
            : null}
          ${grid(
            {
              size: {
                lg: '1of2'
              }
            },
            people.map(function (item) {
              const title = asText(item.heading)
              const link = item.link
              let linkText = item.link_text
              if (!linkText) {
                if (link.id && !link.isBroken) {
                  linkText = link.data.cta || asText(link.data.title)
                } else if (link.url) {
                  linkText = text`Read more`
                }
              }
              return person({
                title,
                role: item.role,
                body: asElement(item.text, resolve, serialize),
                link:
                  (link.id || link.url) && !link.isBroken
                    ? {
                        href: resolve(link),
                        text: linkText,
                        external: link.target === '_blank',
                        onclick: link.id ? onclick(link) : null
                      }
                    : null,
                image: memo(
                  function (url, sizes) {
                    if (!url) return null
                    return {
                      alt: title,
                      width: 180,
                      height: 180,
                      sizes: '180px',
                      srcset: srcset(url, sizes, {
                        aspect: 1,
                        transforms: 'q_100'
                      }),
                      src: src(url, 180)
                    }
                  },
                  [item.image.url, [180, 360, 500]]
                )
              })
            })
          )}
        </section>
      `
    }
    case 'blurbs': {
      const blurbs = slice.items.filter(function (item) {
        if (item.link.id) return !item.link.isBroken
        if (item.link.url && item.link_text) return true
        return item.image.url || item.heading.length
      })
      if (!blurbs.length) return null

      return html`
        <div class="${last ? 'u-borderB u-space2end' : ''}">
          <section class="u-container u-space2">
            ${slice.primary.heading.length
              ? html`
                  <header class="Text u-space2 u-textCenter">
                    <h2>${asText(slice.primary.heading)}</h2>
                  </header>
                `
              : null}
            ${grid(
              { divided: true, size: { md: '1of2' } },
              blurbs.map(function (item, i) {
                let title = asText(item.heading)
                if (!title && item.link.id) title = asText(item.link.data.title)

                let body = item.text.length
                  ? asElement(item.text, resolve, serialize)
                  : null

                if (!body && item.link.id) {
                  body = item.link.data.description
                    ? asElement(item.link.data.description, resolve, serialize)
                    : null
                }

                let image = item.image
                if (!image.url && item.link.id) {
                  image = item.link.data.featured_image
                }
                if (!image || (!image.url && item.link.id)) {
                  image = item.link.data.image
                }
                image = memo(
                  function (url, sizes) {
                    if (!url) return null
                    const sources = srcset(url, sizes, {
                      aspect: 9 / 16
                    })
                    return {
                      srcset: sources,
                      sizes: '(min-width: 600px) 50vw, 100vw',
                      alt: image.alt || title,
                      src: sources.split(' ')[0],
                      width: image.dimensions.width,
                      height: (image.dimensions.width * 9) / 16
                    }
                  },
                  [image && image.url, [520, 700, 900, 1280]]
                )

                let linkText = item.link_text
                if (!linkText) {
                  if (item.link.id) linkText = item.link.data.cta
                  else if (item.link.url) linkText = text`Read more`
                }
                const link =
                  item.link.id || item.link.url
                    ? {
                        href: resolve(item.link),
                        text: linkText,
                        external: item.link.target === '_blank',
                        onclick: item.link.id ? onclick(item.link) : null
                      }
                    : null

                return card({ title, body, image, link })
              })
            )}
          </section>
        </div>
      `
    }
    case 'facts_box': {
      const heading = slice.primary.heading
      return html`
        <section class="u-md-container u-space1">
          ${facts({
            heading: heading.length ? asText(heading) : null,
            body: asElement(slice.primary.body, resolve, serialize)
          })}
        </section>
      `
    }
    case 'features': {
      const items = slice.items.filter((item) => item.heading.length)
      if (!items.length) return null

      return html`
        <div class="u-container u-space1">
          ${slice.primary.heading
            ? html`
                <div class="Text Text--left u-spaceB6">
                  ${asElement(slice.primary.heading)}
                </div>
              `
            : null}
          ${grid(
            { size: { md: '1of2' } },
            items.map(function (item) {
              const symbol = item.symbol && item.symbol.toLowerCase()
              return html`
                <div class="Text Text--small">
                  ${symbol && symbol in symbols
                    ? symbols[symbol]()
                    : symbol && symbol.length === 1
                    ? html`
                        <span class="Text-number">${symbol}</span>
                      `
                    : null}
                  <div>
                    ${asElement(item.heading, resolve, serialize)}
                    ${asElement(item.text, resolve, serialize)}
                  </div>
                </div>
              `
            })
          )}
        </div>
      `
    }
    case 'logos': {
      const items = slice.items
        .map(function (item) {
          return memo(
            function (url, sizes) {
              if (!url) return null
              return {
                alt: item.image.alt,
                sizes: '180px',
                srcset: srcset(url, sizes),
                src: src(url, 180)
              }
            },
            [item.image.url, [180, 30, 600]]
          )
        })
        .filter(Boolean)

      if (!items.length) return null
      const heading = asText(slice.primary.heading)
      return html`
        <div class="u-container u-space2">
          <div class="Text u-sizeFull u-textCenter">
            ${heading
              ? html`
                  <h2
                    style="max-width: 20em; margin: 0 auto;"
                    class="u-spaceB4">
                    ${asText(slice.primary.heading)}
                  </h2>
                `
              : null}
          </div>
          ${partners(items)}
        </div>
      `
    }
    case 'quote': {
      return html`
        <div class="${last ? 'u-borderB u-space2end' : ''}">
          <div class="u-space1">
            ${quote({
              body: asElement(slice.primary.body, resolve, serialize),
              label: slice.primary.label,
              name: slice.primary.name
            })}
          </div>
        </div>
      `
    }
    default:
      return null
  }
}

// map props to embed player
// obj -> Element
function video(props) {
  const id = embed.id(props)
  if (!id) return null

  const provider = props.provider_name.toLowerCase()
  return embed({
    url: props.embed_url,
    title: props.title,
    src: `/media/${provider}/w_900/${id}`,
    width: props.thumbnail_width,
    height: props.thumbnail_height,
    sizes: '100vw',
    srcset: srcset(id, [640, 750, 1125, 1440, [2880, 'q_80'], [3840, 'q_70']], {
      type: provider
    })
  })
}
