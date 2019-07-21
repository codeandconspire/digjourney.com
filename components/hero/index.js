var html = require('choo/html')
var Component = require('choo/component')
var { className, loader } = require('../base')

module.exports = class Hero extends Component {
  constructor (id, state, emit, opts) {
    super(id)
    this.local = state.components[id] = Object.assign({
      id,
      focus: true,
      prerendered: typeof window !== 'undefined' && document.getElementById(id)
    }, opts)
  }

  static loading (opts = {}) {
    return html`
      <div class="${className('Hero is-loading', { 'Hero--small': opts.small, [`Hero--${opts.theme}`]: opts.theme })}">
        <div class="Hero-body u-container">
          ${opts.label ? html`<span class="Hero-label">${loader(18)}</span>` : null}
          <h1 class="Hero-title">${loader(14)}</h1>
          <p class="Hero-text">${loader(52)}</p>
        </div>
      </div>
    `
  }

  load (el) {
    if (this.local.focus && !this.local.prerendered) {
      el.focus()
    }
  }

  unload () {
    this.local.prerendered = false
  }

  update (props) {
    if (this.local.theme !== props.theme) return true
    if (this.local.label !== props.label) return true
    return false
  }

  createElement (props) {
    this.local.label = props.label
    this.local.theme = props.theme
    return html`
      <div class="${className('Hero', { 'Hero--small': props.small, [`Hero--${props.theme}`]: props.theme })}" tabindex="-1" id="${this.local.id}">
        <div class="Hero-body u-container">
          ${props.label ? html`<span class="Hero-label">${props.label}</span>` : null}
          ${props.body}
        </div>
      </div>
    `
  }
}
