const html = require('choo/html')
const Component = require('choo/component')
const { i18n } = require('../base')

// match short and long youtube links
// https://www.youtube.com/watch?foo=bar&v=WwE7TxtoyqM&bin=baz
// https://youtu.be/nEXl5RwjbKU?foo=bar
// https://youtu.be/gd6_ZECm58g
const YOUTUBE_RE =
  /https?:\/\/(?:www.)?youtu\.?be(?:\.com\/watch\?(?:.*?)v=|\/)(.+?)(?:\?|&|$)/

const text = i18n()

class Player extends Component {
  update(content) {
    const shouldUpdate = content !== this.content
    if (shouldUpdate && content) {
      window.addEventListener('wheel', preventScroll, { passive: false })
      window.addEventListener('touchmove', preventScroll, { passive: false })
      window.requestAnimationFrame(() => this.element.focus())
    }
    return shouldUpdate
  }

  close(onclose = Function.prototype) {
    const element = this.element
    const onanimationend = () => {
      element.removeEventListener('animationend', onanimationend)
      window.removeEventListener('wheel', preventScroll, { passive: false })
      window.removeEventListener('touchmove', preventScroll, { passive: false })
      this.render(null)
    }
    element.addEventListener('animationend', onanimationend)
    element.classList.add('is-closing')
  }

  createElement(content, onclose) {
    this.content = content

    if (!content) {
      return html`
        <div class="Embed Embed--hidden" id="player" hidden></div>
      `
    }

    const isUrl =
      typeof content === 'string' && /^(?:https?:)\/\//.test(content)

    return html`
      <div class="Embed Embed--fullscreen" id="player" tabindex="0">
        <div class="Embed-wrapper">
          ${isUrl
            ? html`
            <div class="Embed-iframe">
              <iframe src="${url(content)}" frameborder="0" allowfullscreen>
            </div>
          `
            : content}
        </div>
        <button class="Embed-close" onclick="${() => this.close(onclose)}">
          <span class="Embed-cross">
            <span class="u-hiddenVisually">${text`Close`}</span>
          </span>
        </button>
      </div>
    `
  }
}

// compose iframe embed url
// str -> str
function url(str) {
  if (/youtu\.?be/.test(str)) {
    let [, query = ''] = str.match(/(?:\?(.+))?$/)
    query = query.replace(/t=(\d+)\w?(&|$)/, ';start=$1')
    const id = str.match(YOUTUBE_RE)[1]
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&showinfo=0&${query}`
  } else if (/vimeo/.test(str)) {
    const id = str.match(/vimeo\.com\/(.+)?\??/)[1]
    return `https://player.vimeo.com/video/${id}?badge=0&autoplay=1`
  }
  return str
}

// prevent event default
// obj -> void
function preventScroll(event) {
  event.preventDefault()
}

module.exports = new Player()
