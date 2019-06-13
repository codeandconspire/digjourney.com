var html = require('choo/html')
var Component = require('choo/component')
var symbol = require('../base/symbol')
var { i18n, className } = require('../base')

var text = i18n()

module.exports = class Header extends Component {
  constructor (id, state, emit) {
    super(id)
    this.emit = emit
    this.local = state.components[id] = {
      id: id,
      open: false
    }
  }

  update (href, open, props) {
    return href !== this.local.href || open !== this.local.open
  }

  createElement (href, open, props) {
    this.local.href = href.replace(/\/$/, '')
    var { id } = this.local
    var emit = this.emit
    var home = { href: (props.homepage && props.homepage.href) || '/' }
    if (props.homepage && typeof props.homepage.onclick === 'function') {
      home.onclick = props.homepage.onclick
    }

    var animate = (href === '/' || href === '')

    return html`
      <header class="Header ${animate ? 'is-animate' : ''} ${open ? 'is-open' : ''}" id="${id}">
        <div class="Header-content u-container">
          <a class="Header-home" ${home}>
            ${symbol.logo('Header-logo')}${symbol.global('Header-logotype')}
          </a>
          <div class="Header-menu">
            <a class="Header-toggle" onclick=${toggle} href="#navigation">
              <span class="u-hiddenVisually">${text`Toggle navigation`}</span>
              <div class="Header-figure"><div class="Header-lines"></div></div>
            </a>
            <ul class="Header-list">
              ${props.menu.map(({ label, href, children, onclick }) => html`
                <li class="${className('Header-item', { 'Header-item--dropdown': children.length })}">
                  <a class="Header-link" href="${href}" onclick=${onclick}>
                    ${children.length ? symbol.chevron(label) : label}
                  </a>
                  ${children.length ? html`
                    <ul class="Header-dropdown">
                      ${children.map(({ label, href, description, onclick }) => html`
                        <li class="Header-item">
                          <a class="Header-link" href="${href}" onclick=${onclick}>
                            <div><strong class="Header-title">${label}</strong> <span class="u-hiddenVisually">–</span> ${description}</div>
                          </a>
                        </li>
                      `)}
                    </ul>
                  ` : null}
                </li>
              `)}
            </ul>
          </div>
        </div>
      </header>
    `

    function toggle (event) {
      emit('header:toggle', !open)
      window.scrollTo(0, 0)
      event.preventDefault()
    }
  }
}
