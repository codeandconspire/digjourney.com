var html = require('choo/html')
var assert = require('assert')
var { className, pluck } = require('../base')
var Component = require('choo/component')
var Siema = require('siema')

/**
 * TODO:
 * Mobile design
 * State if only 1 slide
 */

module.exports = class Quotes extends Component {
  constructor (id, state, emit) {
    super(id)
    this.local = state.components[id] = { id }
  }

  load (el) {
    var slideButtons = el.querySelectorAll('.js-slideButton')

    if (!slideButtons.length) {
      return
    }

    function setActiveButton (slideIndex = 0) {
      Array.from(slideButtons, function (button, buttonIndex) {
        button.classList.toggle('is-active', buttonIndex === slideIndex)
      })
    }

    var slideshow = this.local.slideshow = new Siema({
      selector: el.querySelector('.js-slide'),
      duration: 500,
      threshold: 10,
      loop: true,
      easing: 'ease',
      onInit: function () {
        setActiveButton(0)

        Array.from(slideButtons, function (button, index) {
          button.addEventListener('click', function (event) {
            event.preventDefault()
            slideshow.goTo(index)
          })
        })

        el.classList.remove('is-loading')
      },
      onChange: function () {
        setActiveButton(this.currentSlide)
      }
    })
  }

  update () {
    return false
  }

  unload () {
    this.local.slideshow.destroy()
  }

  createElement (props) {
    assert(props.content, 'content: is required')
    assert(props.image.src, 'image: src string is required')

    var isSingle = props.content.length < 2

    var attrs = {
      id: this.local.id,
      class: className('Quotes', {
        'Quotes--single': isSingle,
        'is-loading': true
      })
    }

    var imageSrc = props.image.src
    var imageAttrs = pluck(props, 'width', 'height', 'srcset', 'sizes', 'alt')
    imageAttrs.alt = imageAttrs.alt || ''

    function slide (props) {
      return html`
        <div class="Quotes-slide">
          <div class="Quotes-card">
            <svg class="Quotes-icon" width="55px" height="40px" viewBox="0 0 55 40" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M8.67 36.96a19.3 19.3 0 0 0 7.14-5.27c2.03-2.36 3.26-4.76 3.67-7.21.23-1.3.35-2.4.35-3.33 0-1.07-.12-1.94-.35-2.64a10.94 10.94 0 0 1-8.25 3.4c-3.33 0-6.03-.97-8.11-2.91C1.04 17.06 0 14.38 0 10.96c0-3.24 1.1-5.88 3.3-7.9C5.48 1.01 8.26 0 11.64 0c4.62 0 8 1.66 10.12 5 .97 1.43 1.73 3.2 2.29 5.3.55 2.1.83 4.26.83 6.48 0 4.85-1.25 9.29-3.74 13.31-2.5 4.02-6.22 7.17-11.17 9.43l-1.31-2.56zm29.26 0a19.3 19.3 0 0 0 7.14-5.27c2.03-2.36 3.26-4.76 3.67-7.21.23-1.3.35-2.4.35-3.33 0-1.07-.12-1.94-.35-2.64a10.94 10.94 0 0 1-8.25 3.4c-3.33 0-6.03-.97-8.11-2.91-2.08-1.94-3.12-4.62-3.12-8.04 0-3.24 1.1-5.88 3.3-7.9C34.74 1.01 37.52 0 40.9 0c4.62 0 8 1.66 10.12 5 .97 1.43 1.73 3.2 2.29 5.3.55 2.1.83 4.26.83 6.48 0 4.85-1.25 9.29-3.74 13.31-2.5 4.02-6.22 7.17-11.17 9.43l-1.31-2.56z" />
            </svg>
            <blockquote class="Quotes-quote">
              ${props.body && html`<p class="Quotes-text">${props.body}</p>`}
              <footer class="Quotes-meta">
                <cite>
                  ${props.name && html`<span class="Quotes-metaName">${props.name}</span>`}
                  ${props.body && html`<span class="Quotes-metaTitle">${props.title}</span>`}
                </cite>
              </footer>
            </blockquote>
          </div>
        </div>
      `
    }

    var slideNav = isSingle ? '' : html`
      <nav class="Quotes-nav">
        ${props.content.map(function (content, index) {
          return html`<button class="Quotes-navButton js-slideButton">
            <span class="u-hiddenVisually">Slide ${index}</span>
          </button>`
        })}
      </nav>
    `

    return html`
      <div ${attrs}>
        <div class="Quotes-wrap js-slide">
          ${props.content.map(slide)}
        </div>
        ${slideNav}
        <img class="Quotes-image" ${imageAttrs} src="${imageSrc}" />
      </div>
    `
  }
}
