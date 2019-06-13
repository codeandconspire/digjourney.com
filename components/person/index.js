var html = require('choo/html')
var figure = require('./figure')
var { snippet, loader } = require('../base')

module.exports = person
person.loading = loading

function person (props = {}) {
  var body = props.body
  if (body) {
    if (typeof window === 'undefined') {
      if (Array.isArray(body) || body[0] === '<') body = html`<div class="Person-text">${body}</div>`
      else body = html`<p class="Person-text">${snippet(body, props.truncate || 170)}</p>`
    } else if (Array.isArray(body) || body instanceof window.Element) {
      body = html`<div class="Person-text">${body}</div>`
    } else {
      body = html`<p class="Person-text">${snippet(body, props.truncate || 170)}</p>`
    }
  }

  var image = props.image
  if (typeof image === 'function') image = image()
  else if (image) image = figure(image)

  return html`
    <div class="Person">
      ${image}
      <div class="Person-info">
        <h3 class="Person-title">
          ${props.title}
        </h3>
        ${body}
        ${props.link ? link(props.link) : null}
      </div>
    </div>
  `
}

function link (props) {
  var attrs = { href: props.href }
  if (props.external) {
    props.target = '_blank'
    props.rel = 'noopenere nofererrer'
  }
  return html`<a class="Person-link" ${attrs}>${props.text}</a>`
}

function loading (props = {}) {
  return html`
    <div class=Person is-loading">
      ${figure.loading()}
      <div class="Person-info">
        <h3 class="Person-title">${loader(4)}</h3>
      </div>
    </div>
  `
}
