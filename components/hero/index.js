var html = require('choo/html')
var Component = require('choo/component')
var nanoraf = require('nanoraf')
var button = require('../button')
var { className, loader } = require('../base')

module.exports = class Hero extends Component {
  constructor (id, state, emit) {
    super(id)
    this.local = state.components[id] = {
      id,
      moving: false,
      rotating: false
    }
  }

  static loading (opts = {}) {
    return html`
      <div class="${className('Hero is-loading', { 'Hero--center': opts.center, 'Hero--image': opts.image })}">
        <div class="Hero-content">
          <div class="Hero-container u-container">
            <h2 class="Hero-title">${loader(opts.center ? 8 : 28)}</h2>
          </div>
        </div>
        <div class="Hero-image"></div>
      </div>
    `
  }

  moveContent (el, parent) {
    var speed = 0.2
    var height, offset

    var onscroll = nanoraf(function () {
      var { scrollY } = window
      if (scrollY > offset + height) return // after element
      el.style.setProperty('--Hero-scroll', `${(scrollY * speed).toFixed(2)}px`)
    })

    var onresize = nanoraf(function () {
      height = el.offsetHeight
      onscroll()
    })

    onresize()
    onscroll()
    window.addEventListener('resize', onresize)
    window.addEventListener('scroll', onscroll, { passive: true })

    return function () {
      window.removeEventListener('resize', onresize)
      window.removeEventListener('scroll', onscroll)
    }
  }

  rotateWords (words) {
    var currentText = 0
    var count = words.length
    var rotatingDelay = this.local.rotatingDelay

    changeText()
    var changeTextInterval = setInterval(changeText, 2000)
    return function () {
      clearInterval(changeTextInterval)
    }

    function animateTextOut (el) {
      el.classList.remove('in')
      el.classList.remove('first')
      el.classList.add('out')

      setTimeout(function () {
        el.classList.remove('out')
      }, rotatingDelay + 100)
    }

    function animateTextIn (el) {
      el.classList.remove('out')
      el.classList.add('in')
    }

    function changeText () {
      var currentTextEl = words[currentText]
      var nextTextEl = currentText === words.length - 1 ? words[0] : words[currentText + 1]
      animateTextOut(currentTextEl)
      animateTextIn(nextTextEl)
      currentText = (currentText === count - 1) ? 0 : currentText + 1
    }
  }

  load (el) {
    var callbacks = []
    var moveEl = el.querySelector('.js-move')
    var rotatingWords = Array.from(el.querySelectorAll('.js-rotate'))

    if (!this.local.moving && moveEl) {
      this.local.moving = true
      callbacks.push(this.moveContent(moveEl, el))
    }

    if (!this.local.rotating && this.local.words && rotatingWords.length) {
      this.local.rotating = true
      callbacks.push(this.rotateWords(rotatingWords))
    }

    this.unload = function () {
      this.local.moving = false
      this.local.rotating = false
      callbacks.forEach((fn) => fn())
    }
  }

  update (props) {
    if (props.image && !this.local.image) return true
    return props.image && props.image.src !== this.local.image.src
  }

  afterupdate (el) {
    this.load(el)
  }

  createElement (props) {
    var { action, image, title, body, words } = props

    Object.assign(this.local, props)

    var rotatingWords = false
    var rotatingDelay = this.local.rotatingDelay = 600

    if (title && words) {
      var parts = title.split('#WORDS')
      rotatingWords = (words && parts.length > 1)
    }

    var attrs = {
      id: this.local.id,
      class: className('Hero', {
        'Hero--center': !rotatingWords,
        'Hero--image': image,
        'Hero--rotating': rotatingWords
      })
    }

    var titleElement = rotatingWords ? html`
      ${parts[0]} <span class="Hero-rotateWrap">
      ${words.map(function (title, index) {
        return html`<span class="Hero-rotateText js-rotate ${index === 0 ? 'first' : ''}" style="--Hero-rotatingDelay: ${rotatingDelay}ms">${title}</span>`
      })}
      </span> <span class="u-block">${parts[1]}</span>
    ` : title

    if (body) {
      if (typeof window === 'undefined') {
        if (Array.isArray(body) || body[0] !== '<') body = html`<p>${body}</p>`
      } else if (typeof body === 'string') {
        body = html`<p>${body}</p>`
      }
    }

    return html`
      <div ${attrs}>
        <div class="Hero-content">
          <div class="Hero-container u-container">
            <h1 class="Hero-title ${rotatingWords ? 'Hero-title--rotating js-title' : ''}">${titleElement}</h1>
            ${body ? html`<div class="Hero-text">${body}</div>` : null}
            ${action ? html`
              <div class="Hero-action">
                ${button({ href: action.href, text: action.text })}
              </div>
            ` : null}
          </div>
        </div>
        ${rotatingWords ? html`
          <div class="Hero-wrap">
            <video class="Hero-image js-video js-move" poster="//res.cloudinary.com/dykmd8idd/video/upload/ac_none,f_auto,so_0,q_60/v1552906108/loop4-1_qkpush.jpg" autoplay="autoplay" loop="loop" preload="auto" playsinline="playsinline" muted="muted" width="1920" height="1080">
              <source src="//res.cloudinary.com/dykmd8idd/video/upload/ac_none,q_70/v1552906108/loop4-1_qkpush.webm" type="video/webm">
              <source src="//res.cloudinary.com/dykmd8idd/video/upload/ac_none,q_70,vc_h264/v1552906108/loop4-1_qkpush.mp4" type="video/mp4">
            </video>
          </div>
        ` : (image ? getImage(image) : null)}
      </div>
    `
  }
}

// get hero image element
// obj -> Element
function getImage (props) {
  var attrs = {}
  Object.keys(props).forEach(function (key) {
    if (key !== 'src') attrs[key] = props[key]
  })
  return html`<div class="Hero-wrap"><img class="Hero-image js-move" ${attrs} src="${props.src}" /></div>`
}
