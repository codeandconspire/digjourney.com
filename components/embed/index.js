const assert = require('assert')
const html = require('choo/html')
const player = require('./player')
const { pluck, i18n } = require('../base')

const text = i18n()

// match short and long youtube links
// https://www.youtube.com/watch?foo=bar&v=WwE7TxtoyqM&bin=baz
// https://youtu.be/gd6_ZECm58g
const YOUTUBE_RE =
  /^https?:\/\/(?:www.)?youtu(?:(?:\.be\)|(?:be\.com)))\/(?:(?:watch\?(?:.*?)v=|\/)|(?:(?:shorts|v)\/))(.+?)(?:\?|&|$)/

module.exports = embed
module.exports.id = id

function embed(props) {
  assert(props.src, 'figure: src string is required')
  const src = props.src
  const attrs = pluck(props, 'width', 'height', 'srcset', 'sizes', 'alt')
  attrs.alt = attrs.alt || props.title || ''

  return html`
    <figure class="Embed ${props.size ? `Embed--${props.size}` : ''}">
      <a
        class="Embed-link"
        href="${props.url}"
        target="_blank"
        rel="noopener noreferrer"
        onclick=${onclick}>
        <span class="u-hiddenVisually">${text`Play ${props.title || ''}`}</span>
      </a>
      <img class="Embed-image" ${attrs} src="${src}" />
      <figcaption class="Embed-caption">
        ${props.title
          ? html`
              <strong class="Embed-title">${props.title}</strong>
            `
          : null}
        ${props.description
          ? html`
              <p class="u-spaceT1">
                <span class="Embed-description">${props.description}</span>
              </p>
            `
          : null}
      </figcaption>
    </figure>
  `

  function onclick(event) {
    if (typeof props.onplay === 'function') props.onplay()
    player.render(props.url, props.onstop)
    event.preventDefault()
  }
}

// extract unique embed id
// obj -> str
function id(props) {
  switch (props.provider_name) {
    case 'YouTube': {
      const match = props.embed_url.match(YOUTUBE_RE)
      return match ? match[1] : null
    }
    case 'Vimeo': {
      const match = props.embed_url.match(/vimeo\.com\/(.+)?\??/)
      return match ? match[1] : null
    }
    default:
      return null
  }
}
