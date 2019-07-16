var html = require('choo/html')
var Component = require('choo/component')
var { className, loader } = require('../base')

module.exports = class Hero extends Component {
  constructor (id, state, emit) {
    super(id)
    this.local = state.components[id] = {
      id
    }
  }

  static loading (opts = {}) {
    return html`
      <div class="${className('Hero is-loading', { 'Hero--small': opts.small, [`Hero--${opts.theme}`]: opts.theme })}">
        <div class="Hero-body u-container">
          ${opts.label ? html`<span class="Hero-label">${loader(18)}</span>` : null}
          <h1 class="Hero-title">${loader(18)}</h1>
          <p class="Hero-text">${loader(32)}</p>
        </div>
      </div>
    `
  }

  update (props) {
    return false
  }

  createElement (props) {
    return html`
      <div class="${className('Hero', { 'Hero--small': props.small, [`Hero--${props.theme}`]: props.theme })}" id="${this.local.id}">
        <div class="Hero-body u-container">
          ${props.label ? html`<span class="Hero-label">${props.label}</span>` : null}
          ${props.body}
        </div>
      </div>
    `
  }
}
