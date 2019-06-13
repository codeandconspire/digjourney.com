var html = require('choo/html')
var assert = require('assert')
var { pluck, className } = require('../base')

module.exports = figure
figure.loading = loading

function figure (props = {}) {
  assert(props.src, 'figure: src string is required')
  var src = props.src
  var attrs = pluck(props, 'width', 'height', 'srcset', 'sizes', 'alt')
  attrs.alt = attrs.alt || ''
  var icon = props.icon || ''

  return html`
    <figure class="${className('Card-figure', { 'Card-figure--background': props.background })}">
      <img class="Card-image" ${attrs} src="${src}" />
      ${icon}
    </figure>
  `
}

function loading (props = {}) {
  return html`
    <div class="Card-figure is-loading">
      <div class="Card-image"></div>
    </div>
  `
}
