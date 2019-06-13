var html = require('choo/html')
var figure = require('./figure')
var button = require('../button')
var { className, loader } = require('../base')

module.exports = spur
spur.loading = loading

function spur (props) {
  var { action, image, title } = props

  var attrs = {
    class: className('Spur', {
      'Spur--image': image
    })
  }

  if (image) {
    image = figure(image)
  }

  return html`
    <div ${attrs}>
      <div class="Spur-content">
        <h1 class="Spur-title">${title}</h1>
        ${action ? html`<div class="Spur-action">
          ${button({ href: action.href, text: action.text })}
        </div>` : null}
      </div>
      ${image}
    </div>
  `
}

function loading (props = {}) {
  return html`
    <div class="Spur is-loading">
      <div class="Spur-content">
        <h1 class="Spur-title">${loader(4)}</h1>
      </div>
      ${figure.loading()}
    </div>
  `
}
