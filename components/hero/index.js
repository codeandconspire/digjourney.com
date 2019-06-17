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
      <div class="${className('Hero is-loading', { 'Hero--center': opts.center })}">
        <div class="Hero-body u-container">
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
      <div class="${className('Hero', { 'Hero--center': props.center })}">
        <div class="Hero-body u-container">
          ${props.body}
        </div>
      </div>
    `
  }
}
