var html = require('choo/html')
var Component = require('choo/component')
var { i18n } = require('../base')
var symbol = require('../base/symbol')

var text = i18n()

module.exports = class Footer extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.local = state.components[id] = {
      id: id,
      message: null,
      isLoading: false,
      alternative: state.ui.openNavigation
    }
  }

  update (menu) {
    if (menu && !this.local.menu) return true
    return this.state.ui.openNavigation !== this.local.alternative
  }

  createElement (menu, newsletter) {
    if (!menu) return html`<footer class="Footer"></footer>`

    this.local.menu = menu
    var self = this
    var alt = this.local.alternative = this.state.ui.openNavigation

    return html`
      <footer class="Footer ${newsletter ? 'Footer--newsletter' : ''} ${alt ? 'Footer--alt' : ''}" id="navigation">
        ${newsletter ? html`
          <div class="Footer-newsletter">
            <div class="Text">${newsletter}</div>
            <form class="Footer-form" method="POST" action="${this.state.mailchimp}" onsubmit=${onsubmit}>
              <label for="TODO:EMAIL">
                <span class="u-hiddenVisually">${text`Fill in your e-mail address`}</span>
                <input class="Footer-email" type="email" name="TODO:EMAIL" id="TODO:EMAIL" placeholder="${text`Fill in your e-mail address`}" disabled=${this.local.isLoading} required>
              </label>
              <button class="Footer-button" type="submit" disabled=${this.local.isLoading}>${text`Subscribe`}</button>
              ${self.local.message ? html`<span class="Footer-message">${this.local.message}</span>` : null}
            </form>
          </div>
        ` : null}
        <div class="u-container">
          <nav>
            <ul class="Footer-menu">
              ${menu.map(({ label, href, children, onclick }, index, list) => html`
                <li class="Footer-section ${alt ? 'u-slideDown' : ''} u-size1of${Math.floor(list.length / 2)} u-md-size1of${list.length}" style="animation-delay: ${alt ? index * 150 : 0}ms">
                  <div class="Footer-item">
                    ${href ? html`
                      <a class="Footer-link Footer-link--primary" href="${href}" onclick=${onclick}>${symbol.arrow(label)}</a>
                    ` : html`
                      <span class="Footer-link Footer-link--primary">${label}</span>
                    `}
                  </div>
                  <ul class="Footer-list">
                    ${children.map(({ label, href, onclick }) => html`
                      <li class="Footer-item">
                        <a class="Footer-link" href="${href}" onclick=${onclick}>${label}</a>
                      </li>
                    `)}
                  </ul>
                </li>
              `)}
            </ul>
          </nav>

          <div class="Footer-meta ${alt ? 'u-slideDown' : ''}">
            <a class="Footer-home" href="/" onclick=${scrollTop}>
              <svg class="Footer-logo" width="138" height="29" viewBox="0 0 138 29">
                <g fill="#110046" fill-rule="evenodd">
                  <path fill-rule="nonzero" d="M38.7 21V7.7h4.6c4 0 6.8 2.6 6.8 6.6 0 3.8-2.7 6.7-6.8 6.7h-4.6zm2.8-2.6h1.6c2.5 0 4-1.3 4-4 0-2.8-1.5-4-4-4h-1.6v8zM53.1 10c-1.1 0-1.7-.6-1.7-1.7 0-1 .6-1.7 1.7-1.7s1.8.7 1.8 1.7S54.2 10 53 10zm-1.5 11V11h3v10h-3zm9 4.6c-2.7 0-4.5-1.5-4.6-3.7H59c0 .6.7 1.1 1.6 1.1 1.3 0 2-.6 2-1.5V20h-.1c-.5.5-1.2 1-2.6 1-2.5 0-4-2-4-5s1.5-5.2 4-5.2c1.4 0 2.1.5 2.6 1l.4-.9h2.6v10.5c0 2.5-2.1 4-4.9 4zm0-7c1.5 0 2-1.2 2-2.6 0-1.4-.5-2.6-2-2.6-1.4 0-1.9 1.2-1.9 2.6 0 1.4.5 2.6 2 2.6zm10.1 2.6c-2.9 0-4.4-2-4.4-4.2h2.9c0 .9.5 1.5 1.6 1.5 1 0 1.5-.7 1.5-1.7V7.7h3v9.1c0 2.5-1.6 4.4-4.6 4.4zm11.1 0C78.6 21.2 77 19 77 16s1.8-5.1 5-5.1c3 0 4.8 2.1 4.8 5.1 0 3-1.7 5.2-4.9 5.2zm0-2.6c1.2 0 2-.7 2-2.6 0-1.8-.8-2.6-2-2.6s-2 .8-2 2.6c0 1.9.8 2.6 2 2.6zM94.3 11h2.9v6c0 2.1-1.3 4.2-4.5 4.2-3.3 0-4.5-2-4.5-4.2v-6H91v5.6c0 1.1.4 1.8 1.6 1.8 1.1 0 1.6-.7 1.6-1.8V11zM99 21V11h2.4l.2 1.5c.5-.9 1.3-1.6 2.6-1.6h.7v2.7h-1c-1.3 0-2.2.9-2.2 2.5v5H99zm7.3 0V11h2.6l.2 1h.1c.6-.7 1.4-1.1 2.7-1.1 2.2 0 3.7 1.3 3.7 3.6V21h-3v-5.6c0-1.2-.5-1.9-1.6-1.9-1 0-1.8.8-1.8 2V21h-2.9zm15.4.2c-3.1 0-5-2.3-5-5.2 0-2.8 1.7-5.1 5-5.1 3 0 4.6 2.1 4.6 4.8v1.1h-6.6c0 1.2.6 2 2 2 1 0 1.5-.5 1.7-1h2.8c-.3 1.8-1.8 3.4-4.5 3.4zm-2-6.2h3.7c0-1-.6-1.7-1.8-1.7-1.2 0-1.8.7-1.8 1.7zm9.5 10.4v-.2l1.4-4.2h-.5l-3.1-9.8V11h3l2 7.1 2.2-7h3.1v.1l-5 14.2h-3.1z"/>
                  <path d="M4 4.5a8.7 8.7 0 0 1 10.6 5.2 10.7 10.7 0 0 0 .8 19.2A14.4 14.4 0 0 1 0 14.6c0-3.9 1.5-7.4 4-10zm23.5 4.3a8.8 8.8 0 0 1-12.8 8.5c-1-.6-2-1.4-2.7-2.3a8.6 8.6 0 0 1 4.8-4v-.2h.2A10.5 10.5 0 0 0 6.8 2.2C9 .8 11.6 0 14.3 0c6 0 11 3.6 13.2 8.8zM19.7 28a8.8 8.8 0 0 1-8.5-10.7 10.7 10.7 0 0 0 17.5-3.4v.7c0 6-3.7 11.3-9 13.4z"/>
                </g>
              </svg>
            </a>
            <span class="Footer-copy">${text`© ${(new Date()).getFullYear()} DigJourney`}</span>
          </div>
        </div>
      </footer>
    `

    function onsubmit (event) {
      if (!this.checkValidity()) {
        this.reportValidity()
        event.preventDefault()
        return
      }

      self.local.message = null
      self.local.isLoading = true
      self.rerender()

      window.fetch('/api/subscribe', {
        method: 'POST',
        body: new window.FormData(this),
        headers: {
          'Accept': 'application/json'
        }
      }).then(function (res) {
        if (!res.ok) throw new Error(res.statusMessage)
        return res.json().then(function (data) {
          self.local.message = text`Hooray! You'll hear from us soon.`
          self.local.isLoading = false
          self.rerender()
        })
      }).catch(function () {
        self.local.message = text`Oops! Something went wrong, please try again.`
        self.local.isLoading = false
        self.rerender()
      })

      event.preventDefault()
    }
  }
}

function scrollTop () {
  window.scrollTo(0, 0)
}
