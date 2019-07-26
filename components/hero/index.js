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
          ${opts.label ? html`<span class="Hero-label">${loader(12)}</span>` : null}
          <h1 class="Hero-title">${loader(10)}</h1>
          <p class="Hero-text">${loader(42)}</p>
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
      <div class="${className('Hero', { 'Hero--small': props.small, [`Hero--${props.theme}`]: props.theme })}" id="${this.local.id}">
        ${typeof props.blobs === 'undefined' || props.blobs ? html`
        <svg class="Hero-blob Hero-blob--1" viewBox="0 0 383 718">
          <path fill="currentColor" fill-rule="evenodd" d="M383 718a337.8 337.8 0 0 1-53.7-165.4C319 363.3 82.3 299.3 25.1 170.2A274.4 274.4 0 0 1 5.8 0H383v718z"/>
        </svg>
        <svg class="Hero-blob Hero-blob--2" viewBox="0 0 125 355">
          <path fill="currentColor" fill-rule="evenodd" d="M-.5-.1C2.8.7 6.2 1.7 9.6 2.8c156.2 47.6 114.5 184.7 93 253.4a154.9 154.9 0 0 1-103 99V-.2z"/>
        </svg>
        ` : null}
        <div class="u-container">
          <div class="Hero-body">
            ${props.label ? html`<span class="Hero-label">${props.label}</span>` : null}
            ${props.body}
          </div>
        </div>
      </div>
    `
  }
}
