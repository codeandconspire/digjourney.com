var html = require('choo/html')
var figure = require('./figure')
var { loader } = require('../base')

module.exports = person
person.loading = loading

function person (props = {}) {
  var image = props.image
  if (typeof image === 'function') image = image()
  else if (image) image = figure(image)

  return html`
    <div class="Person">
      ${image}
      <div class="Person-info">
        <h3 class="Person-title">${props.title}</h3>
        <div class="Text Text--small">
          ${props.link ? link(props.link) : null}
          ${props.link && props.body ? html`<br>` : null}
          ${props.body}
        </div>
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
  return html`<a ${attrs}>${props.text}</a>`
}

function loading (props = {}) {
  return html`
    <div class="Person is-loading">
      ${figure.loading()}
      <div class="Person-info">
        <h3 class="Person-title">${loader(4)}</h3>
      </div>
    </div>
  `
}
