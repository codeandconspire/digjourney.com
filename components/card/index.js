var html = require('choo/html')
var nanoraf = require('nanoraf')
var Component = require('choo/component')
var link = require('./link')
var figure = require('./figure')
var { className, snippet, loader } = require('../base')

module.exports = Card

function Card (id, state, emit) {
  if (!(this instanceof Card)) {
    return Card.prototype.createElement.apply(undefined, arguments)
  }
  Component.call(this, id)
  this.local = state.components[id] = { id }
}

Card.prototype = Object.create(Component.prototype)
Card.prototype.constructor = Card

Card.prototype.load = function (el) {
  var width, height, offsetX, offsetY
  var tilt = el.querySelector('.js-tilt')

  var onmousemove = nanoraf(function (event) {
    var { scrollY } = window
    var minX = 0
    var maxX = offsetX + width
    var minY = 0
    var maxY = offsetY + height
    var x = Math.min(Math.max(minX, event.clientX - offsetX), maxX)
    var y = Math.min(Math.max(minY, event.clientY + scrollY - offsetY), maxY)
    el.style.setProperty('--Card-tiltX', (2 * (x / width) - 1).toFixed(3))
    el.style.setProperty('--Card-tiltY', (2 * (y / height) - 1).toFixed(3))
  })

  var onresize = nanoraf(function () {
    width = el.offsetWidth
    height = el.offsetHeight
    offsetX = el.offsetLeft
    offsetY = el.offsetTop
    var parent = el
    while ((parent = parent.offsetParent)) {
      offsetX += parent.offsetLeft
      offsetY += parent.offsetTop
    }
  })

  onresize()
  window.addEventListener('resize', onresize)
  el.addEventListener('mousemove', onmousemove, { passive: true })
  el.addEventListener('mouseleave', onmouseleave)
  el.addEventListener('mouseenter', onmouseenter)
  this.unload = function () {
    window.removeEventListener('resize', onresize)
  }

  // ensure cards is not in transition while tilting
  function onmouseenter () {
    el.classList.remove('in-transition')
  }

  // apply transition when resetting to initial un-tilted state
  function onmouseleave (event) {
    tilt.addEventListener('transitionend', function ontransitionend () {
      tilt.removeEventListener('transitionend', ontransitionend)
      el.classList.remove('in-transition')
    })
    window.requestAnimationFrame(function () {
      el.classList.add('in-transition')
      el.style.removeProperty('--Card-tiltX')
      el.style.removeProperty('--Card-tiltY')
    })
  }
}

Card.prototype.update = function () {
  return false
}

Card.prototype.createElement = function (props = {}) {
  var body = props.body
  if (body) {
    if (typeof window === 'undefined') {
      if (Array.isArray(body) || body[0] === '<') body = html`<div class="Card-text">${body}</div>`
      else body = html`<p class="Card-text">${snippet(body, props.truncate || 170)}</p>`
    } else if (Array.isArray(body) || body instanceof window.Element) {
      body = html`<div class="Card-text">${body}</div>`
    } else {
      body = html`<p class="Card-text">${snippet(body, props.truncate || 170)}</p>`
    }
  }

  if (props.link) {
    props.link.block = true
  }

  var attrs = {
    class: className('Card', {
      'Card--interactive': props.link,
      'Card--image': props.image,
      'Card--video': props.video,
      'Card--background': props.background,
      'Card--title': this instanceof Card
    })
  }

  if (props.video && props.image) {
    props.image.icon = html`<svg class="Card-figureIcon" width="67" height="67"><g transform="translate(1 1)" fill="none" fill-rule="evenodd"><circle stroke="#FFF" fill="#FFF" cx="32.5" cy="32.5" r="32.5"/><path fill="#201745" d="M41 33l-14 8V25z"/></g></svg>`
  }

  var image = props.image || props.background || null
  if (typeof image === 'function') image = image()
  else if (image) image = figure(image)

  if (props.image && props.image.width && props.image.height) {
    attrs.style = `--Card-aspect: ${props.image.height / props.image.width};`
  }

  if (this instanceof Card) {
    attrs.id = this.local.id
    attrs.class += ' Card--tilt'
    if (image) image = html`<div class="Card-tilt js-tilt">${image}</div>`
  }

  return html`
    <article ${attrs}>
      ${image}
      <div class="Card-content">
        <div class="Card-body">
          ${(props.background || props.location) && props.date && props.date.text ? date(props.date) : null}
          <h3 class="Card-title">
            ${props.title}
          </h3>
          ${body}
          ${props.location || (!props.background && props.date) ? html`
            <div class="Card-footer">
              ${props.location ? html`
                <svg class="Card-footerIcon" width="11" height="13">
                  <g fill="currentColor" fill-rule="nonzero"><path d="M5.5.25a5 5 0 0 0-5 4.95c0 3.42 4.4 7.24 4.6 7.4.23.2.57.2.8 0 .22-.16 4.6-3.97 4.6-7.4a5 5 0 0 0-5-4.95zm0 11.03c-1.04-1-3.75-3.75-3.75-6.08a3.75 3.75 0 0 1 7.5 0c0 2.31-2.7 5.09-3.75 6.08z"/><path d="M5.5 2.75a2.19 2.19 0 1 0 0 4.38 2.19 2.19 0 0 0 0-4.38zm0 3.13A.94.94 0 1 1 5.5 4a.94.94 0 0 1 0 1.88z"/></g>
                </svg>
              ` : null}
              ${props.location || date(props.date)}
            </div>
          ` : null}
        </div>
        ${props.link ? link(Object.assign({
          visible: !props.background && !props.location
        }, props.link)) : null}
      </div>
    </article>
  `
}

Card.loading = function (props = {}) {
  var hasBody = !('body' in props) || props.body
  return html`
    <article class="${className('Card', { 'Card--background': props.background })}">
      ${figure.loading()}
      <div class="Card-content">
        <div class="Card-body">
          ${props.date ? html`<time class="Card-meta">${loader(6)}</time>` : null}
          <h3 class="Card-title">${loader(8)}</h3>
          ${hasBody ? html`<p class="Card-text">${loader(24)}</p>` : null}
          ${props.location ? html`<time class="Card-meta">${loader(8)}</time>` : null}
        </div>
        ${props.link && props.link.title && (
          html`<div class="Card-action">${loader(4)}</div>`
        )}
      </div>
    </article>
  `
}

function date (props) {
  return html`
    <time class="Card-meta" datetime="${JSON.stringify(props.datetime).replace(/"/g, '')}">
      ${props.text}
    </time>
  `
}
