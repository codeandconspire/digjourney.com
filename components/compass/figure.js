const html = require('choo/html')
const assert = require('assert')
const { pluck } = require('../base')

module.exports = figure
figure.loading = loading

function figure(props = {}) {
  assert(props.src, 'figure: src string is required')
  const src = props.src
  const attrs = pluck(props, 'width', 'height', 'srcset', 'sizes', 'alt')
  attrs.alt = attrs.alt || ''

  return html`
    <figure class="Compass-figure">
      <img class="Compass-image" ${attrs} src="${src}" />
    </figure>
  `
}

function loading(props = {}) {
  return html`
    <div class="Compass-figure is-loading">
      <div class="Compass-image"></div>
    </div>
  `
}
