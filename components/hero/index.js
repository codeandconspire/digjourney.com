const html = require('choo/html')
const Component = require('choo/component')
const { className, loader } = require('../base')

const SMALL_BLOB = [
  'M7 10.4c-8.5 8-9 24.5-1.7 32.2 8 8.3 20.3 10.9 31.6.7C48 33.2 47.6 12.3 39.6 4c-8-8.3-24.3-1.7-32.7 6.4z',
  'M7.2 6.7C.5 18.1-1.9 30.4 4.6 38.8c10.2 13 29.4 13 35.6 7.6 6-5.5 11.2-28.8 3.2-37C35.4 1 14-4.7 7.2 6.6z',
  'M15.1 3.8C8.1 7.6-3.8 30.7 2.8 39.1c10.1 13 28.4 9.3 37.4 7.1 9-2.2 14.7-19.8 11-34.9-3.5-15-29-11.3-36-7.5z',
  'M12.1.8C2.3 3.8-3 24.7 3.4 33c10.2 13.1 18.5 16 29.4 10.1 11-5.9 17.7-21.6 13.5-30.6C42 3.4 22-2.2 12 .8z'
]
const MEDIUM_BLOB = [
  'M102.6 123.5c25.9-16.9 44.5-48.1 27.6-74-16.8-26-45.7-70.5-99-36C-22 48.3 7 92.7 23.8 118.6c16.9 26 53 21.8 78.9 5z',
  'M95.3 94c24.1-6.7 38.4-29.5 28.6-48.1-9.7-18.6-23.4-54.7-79.5-42.8C-11.6 14.9-4.9 81.2 12 94c16.8 12.7 59.3 6.7 83.3 0z',
  'M65.3 106.7c24.1-6.7 42-30.6 46.4-44 4.5-13.5 0-49.4-46.4-60.5C19-9-4.2 52.4 1.6 69c5.9 16.6 39.6 44.4 63.7 37.7z',
  'M37.4 96.7C60.7 102 90 91.4 95.7 79.2c5.6-12.2 20-39.8-5.6-68.4C64.4-17.8 10.3 22 1.9 39.4c-8.4 17.3 12.1 52 35.5 57.3z'
]
const LARGE_BLOB = [
  'M166 580.7c-41.6 4.8-86.7-3-121.6-40.9-71.2-77.2-50.1-181 16-238.6 75.5-65.6 25.2-184.5 60.4-250.1A150.4 150.4 0 0 1 166 0v580.7z',
  'M166 580.7c-41.6 4.8-105.6-11.8-121.6-40.9C-6 448-1.3 403.2 60.4 301.2c52.8-87.2 25.2-184.5 60.4-250.1A150.4 150.4 0 0 1 166 0v580.7z',
  'M166 580.7c-41.6 4.8-86.7-3-121.6-40.9-71.2-77.2-45.7-136.6 16-238.6 52.8-87.2 25.2-184.5 60.4-250.1A150.4 150.4 0 0 1 166 0v580.7z',
  'M166 580.7c-41.6 4.8-86.7-3-121.6-40.9-71.2-77.2 0-201.7 16-238.6 65.8-151.7 25.2-184.5 60.4-250.1A150.4 150.4 0 0 1 166 0v580.7z'
]

module.exports = class Hero extends Component {
  constructor(id, state, emit, opts) {
    super(id)
    this.local = state.components[id] = Object.assign(
      {
        id,
        focus: true,
        prerendered:
          typeof window !== 'undefined' && document.getElementById(id)
      },
      opts
    )
  }

  static loading(opts = {}) {
    return html`
      <div
        class="${className('Hero is-loading', {
          'Hero--small': opts.small,
          'Hero--center': opts.center,
          'Hero--pull': opts.pull,
          [`Hero--${opts.theme}`]: opts.theme
        })}">
        <div class="Hero-body u-container">
          ${opts.label
            ? html`
                <span class="Hero-label">${loader(12)}</span>
              `
            : null}
          <h1 class="Hero-title">${loader(10)}</h1>
          <p class="Hero-text">${loader(42)}</p>
        </div>
      </div>
    `
  }

  load(el) {
    if (this.local.focus && !this.local.prerendered) {
      el.focus()
    }
  }

  unload() {
    this.local.prerendered = false
  }

  update(props) {
    if (this.local.theme !== props.theme) return true
    if (this.local.label !== props.label) return true
    return false
  }

  createElement(props) {
    this.local.label = props.label
    this.local.theme = props.theme
    return html`
      <div
        class="${className('Hero', {
          'Hero--small': props.small,
          'Hero--center': props.center,
          'Hero--pull': props.pull,
          [`Hero--${props.theme}`]: props.theme
        })}"
        id="${this.local.id}">
        ${(typeof props.blobs === 'undefined' && !props.moving) ||
        (props.blobs && !props.moving)
          ? html`
              <svg class="Hero-blob Hero-blob--1" viewBox="0 0 383 718">
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M383 718a337.8 337.8 0 0 1-53.7-165.4C319 363.3 82.3 299.3 25.1 170.2A274.4 274.4 0 0 1 5.8 0H383v718z" />
              </svg>
              <svg class="Hero-blob Hero-blob--2" viewBox="0 0 125 355">
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M-.5-.1C2.8.7 6.2 1.7 9.6 2.8c156.2 47.6 114.5 184.7 93 253.4a154.9 154.9 0 0 1-103 99V-.2z" />
              </svg>
            `
          : null}
        ${props.moving
          ? html`
              <svg
                width="46"
                height="50"
                viewBox="0 0 46 50"
                class="Hero-moving Hero-moving--small">
                <path
                  id="${this.local.id}-small-blob"
                  d="${SMALL_BLOB[0]}"
                  fill="currentColor"
                  fill-rule="evenodd" />
                <animate
                  xlink:href="#${this.local.id}-small-blob"
                  attributeName="d"
                  begin="0s"
                  dur="8s"
                  repeatCount="indefinite"
                  values="${SMALL_BLOB.concat(SMALL_BLOB[0]).join(';')}" />
              </svg>
              <svg
                width="137"
                height="138"
                viewBox="0 0 137 138"
                class="Hero-moving Hero-moving--medium">
                <path
                  id="${this.local.id}-medium-blob"
                  d="${MEDIUM_BLOB[0]}"
                  fill="currentColor"
                  fill-rule="evenodd" />
                <animate
                  xlink:href="#${this.local.id}-medium-blob"
                  attributeName="d"
                  begin="0s"
                  dur="10s"
                  repeatCount="indefinite"
                  values="${MEDIUM_BLOB.concat(MEDIUM_BLOB[0]).join(';')}" />
              </svg>
              <svg
                width="166"
                height="582"
                viewBox="0 0 166 582"
                class="Hero-moving Hero-moving--large">
                <path
                  id="${this.local.id}-large-blob"
                  d="${LARGE_BLOB[0]}"
                  fill="currentColor"
                  fill-rule="evenodd" />
                <animate
                  xlink:href="#${this.local.id}-large-blob"
                  attributeName="d"
                  begin="0s"
                  dur="6s"
                  repeatCount="indefinite"
                  values="${LARGE_BLOB.concat(LARGE_BLOB[0]).join(';')}" />
              </svg>
            `
          : null}
        <div class="u-container">
          <div class="Hero-body">
            ${props.label
              ? html`
                  <span class="Hero-label">${props.label}</span>
                `
              : null}
            ${props.body}
          </div>
        </div>
      </div>
    `
  }
}
