const html = require('choo/html')
const Component = require('choo/component')
const { i18n } = require('../base')
const symbol = require('../base/symbol')
const button = require('../button')

const text = i18n()

module.exports = class Footer extends Component {
  constructor(id, state, emit) {
    super(id)
    this.emit = emit
    this.state = state
    this.local = state.components[id] = {
      id,
      message: null,
      isLoading: false,
      alternative: state.ui.openNavigation
    }
  }

  update() {
    return true
  }

  createElement(menu, newsletter, contact, hubspot) {
    if (!menu) {
      return html`
        <footer class="Footer"></footer>
      `
    }

    this.local.menu = menu
    const self = this
    const alt = (this.local.alternative = this.state.ui.openNavigation)

    return html`
      <footer
        class="Footer ${newsletter ? 'Footer--newsletter' : ''} ${alt
          ? 'Footer--alt'
          : ''}"
        id="navigation">
        ${contact
          ? html`
              <div class="u-container">
                <div class="Footer-contact">
                  <div class="Text u-textCenter">${contact}</div>
                </div>
              </div>
            `
          : null}
        ${newsletter
          ? html`
              <div class="u-container">
                <div class="u-md-expand">
                  <div class="Footer-newsletter">
                    <div class="Text">${newsletter}</div>
                    <form
                      class="Footer-form"
                      method="POST"
                      action="/api/subscribe"
                      onsubmit=${onsubmit}>
                      <label for="email">
                        <span class="u-hiddenVisually">
                          ${text`Fill in your e-mail address`}
                        </span>
                        <input
                          class="Footer-email"
                          type="email"
                          name="email"
                          id="email"
                          placeholder="${text`Fill in your e-mail address`}"
                          disabled=${this.local.isLoading}
                          required />
                      </label>
                      ${button({
                        class: 'Footer-button',
                        theme: 'pink',
                        text: text`Subscribe`,
                        type: 'submit',
                        disabled: this.local.isLoading
                      })}
                      ${self.local.message
                        ? html`
                            <span class="Footer-message">
                              ${this.local.message}
                            </span>
                          `
                        : null}
                    </form>
                  </div>
                </div>
              </div>
            `
          : null}
        <div class="Footer-navigation">
          <div class="u-container">
            <nav>
              <ul class="Footer-menu">
                ${menu.map(
                  ({ label, href, children, onclick }, index, list) => html`
                    <li
                      class="Footer-section ${alt
                        ? 'u-slideDown'
                        : ''} u-size1of${Math.floor(
                        list.length / 2
                      )} u-lg-size1of${list.length}"
                      style="animation-delay: ${alt ? index * 100 : 0}ms">
                      <div class="Footer-item">
                        ${href
                          ? html`
                              <a
                                class="Footer-link Footer-link--primary"
                                href="${href}"
                                onclick=${onclick}>
                                ${symbol.arrow(label)}
                              </a>
                            `
                          : html`
                              <span class="Footer-link Footer-link--primary">
                                ${label}
                              </span>
                            `}
                      </div>
                      <ul class="Footer-list">
                        ${children.map(
                          ({ label, href, onclick }) => html`
                            <li class="Footer-item">
                              <a
                                class="Footer-link"
                                href="${href}"
                                onclick=${onclick}>
                                ${label}
                              </a>
                            </li>
                          `
                        )}
                      </ul>
                    </li>
                  `
                )}
              </ul>
            </nav>

            <div class="Footer-meta ${alt ? 'u-slideDown' : ''}">
              <a class="Footer-home" href="/" onclick=${scrollTop}>
                <svg class="Footer-logo" viewBox="0 0 842 177">
                  <g fill="none" fill-rule="nonzero">
                    <path
                      fill="#000"
                      d="M234.61 128.74v-81.1h28.06c24.24 0 41.98 16.22 41.98 40.55 0 22.6-16.58 40.55-41.98 40.55h-28.06zm17.05-16.1h9.97c15.2 0 24.47-7.53 24.47-24.45 0-16.8-9.28-24.33-24.47-24.33h-9.97v48.78zM322.97 62c-7.07 0-10.78-3.94-10.78-10.42 0-6.38 3.7-10.32 10.78-10.32 6.84 0 10.79 3.94 10.79 10.32 0 6.48-3.95 10.42-10.79 10.42zm-9.04 66.74v-60.6h17.85v60.6h-17.85zm54.73 27.58c-16.35 0-27.25-8.7-27.6-22.36h17.51c.46 4.05 4.52 7.06 10.09 7.06 7.88 0 11.83-4.17 11.83-9.61v-8.46h-.47c-2.9 3.47-7.53 6.83-16.12 6.83-15.3 0-24.58-13.2-24.58-31.28 0-18.19 9.28-31.4 24.58-31.4 8.59 0 13.22 3.36 16.12 6.84h.47l1.85-5.8h16v63.5c0 15.18-12.75 24.68-29.68 24.68zm.7-42.18c9.04 0 11.94-7.18 11.94-15.64s-3.13-15.76-11.95-15.76c-8.8 0-11.94 7.3-11.94 15.76s2.9 15.64 11.94 15.64zm62.03 15.64c-17.97 0-27.25-11.58-27.25-25.37h17.74c.12 5.33 3.02 8.8 9.74 8.8 6.85 0 9.51-4.28 9.51-9.84V47.64h18.32v55.73c0 14.94-9.74 26.41-28.06 26.41zm68.19 0c-19.72 0-30.27-13.09-30.27-31.28s10.78-31.4 30.27-31.4c19.48 0 30.26 13.21 30.26 31.4 0 18.08-10.55 31.28-30.26 31.28zm0-15.64c7.42 0 12.05-4.63 12.05-15.64 0-11-4.63-15.76-12.05-15.76-7.43 0-12.06 4.87-12.06 15.76 0 11 4.75 15.64 12.06 15.64zm76.64-46h17.86v36.39c0 12.86-7.88 25.25-27.71 25.25h-.12c-19.83 0-27.71-12.4-27.71-25.25V68.15h17.85v33.71c0 6.95 2.9 11.12 9.98 11.12 6.95 0 9.85-4.17 9.85-11.12V68.15zm29.46 60.6v-60.6h14.84l1.39 8.81h.46c2.67-5.33 7.77-9.85 15.54-9.85h4.18v16.34h-5.8c-8.47 0-13.92 5.68-13.92 15.4v29.9h-16.7zm45.1 0v-60.6h16l1.4 5.8h.46c3.36-3.94 8.7-6.84 16.58-6.84 13.45 0 22.5 8.34 22.5 21.78v39.86h-17.86v-34.3c0-6.95-3.13-11.12-10.2-11.12-6.38 0-11.02 4.52-11.02 11.82v33.6h-17.86zm94.5 1.04c-19.12 0-30.02-13.9-30.02-31.28 0-17.15 9.97-31.4 29.68-31.4 18.55 0 29 13.1 29 29.55v6.6h-40.48c.12 7.07 3.71 12.05 11.83 12.05 6.6 0 9.5-3.24 10.55-6.02h17.28c-1.62 10.89-11.25 20.5-27.83 20.5zm-11.7-37.77h22.15c-.35-5.79-3.72-10.3-10.79-10.3-7.65 0-11.01 4.51-11.36 10.3zm57.98 63.26v-1.15l8.7-25.38h-3.02L777.99 69.3v-1.15h18.32l12.3 42.98h.46l13.1-42.98h19.25v1.15l-30.5 85.97h-19.36z" />
                    <path
                      fill="#110046"
                      d="M95.5 144.19c9.9 3.5 43.22 2.52 68.63-14.56.1-.06 7.75-11.84 7.79-11.94a88.44 88.44 0 0 0 4.92-29.19c0-48.88-39.59-88.5-88.42-88.5a88.26 88.26 0 0 0-70.61 35.22c-.03.05 8.9 9.91 8.95 9.9C58 43.49 78.7 61.66 86.89 70.29c-8.87 10.44-21.95 63.09 8.61 73.9z" />
                    <path
                      fill="#DA6526"
                      d="M171.9 117.75a88.59 88.59 0 0 1-66.54 57.63 65.01 65.01 0 0 1-26.72-62.09 64.83 64.83 0 0 0 48.79 22.06c17.2 0 32.84-6.68 44.47-17.6z" />
                    <path
                      fill="#FFB3B3"
                      d="M17.82 35.21A72.81 72.81 0 0 1 107 72.01a64.97 64.97 0 0 0-23.79 50.33 64.82 64.82 0 0 0 8.72 32.57c4.96 8.17 10.67 14.72 17.14 19.66A88.58 88.58 0 0 1 88.42 177C39.6 177 0 137.38 0 88.5c0-20 6.63-38.46 17.82-53.29z" />
                  </g>
                </svg>
              </a>
              <span class="Footer-copy">
                ${text`© ${new Date().getFullYear()} DigJourney`}
              </span>
            </div>
          </div>
        </div>
      </footer>
    `

    function onsubmit(event) {
      if (!this.checkValidity()) {
        this.reportValidity()
        event.preventDefault()
        return
      }

      const data = new window.FormData(this)

      self.emit('track', 'sign_up', { method: 'email' })

      self.local.message = null
      self.local.isLoading = true
      self.rerender()

      window
        .fetch('/api/subscribe', {
          method: 'POST',
          body: data,
          headers: {
            Accept: 'application/json'
          }
        })
        .then(async function (res) {
          if (!res.ok) throw new Error(await res.text())
          return res.json().then(function (data) {
            self.local.message = text`Hooray! You'll hear from us soon.`
            self.local.isLoading = false
            self.rerender()
          })
        })
        .catch(function (err) {
          self.local.message = text(err.message)
          self.local.isLoading = false
          self.rerender()
        })

      event.preventDefault()
    }
  }
}

function scrollTop() {
  window.scrollTo(0, 0)
}
