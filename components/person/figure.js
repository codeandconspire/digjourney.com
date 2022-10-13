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
  const icon = props.icon || ''

  return html`
    <figure class="Person-figure">
      <img class="Person-image" ${attrs} src="${src}" />
      ${icon}
    </figure>
  `
}

function loading(props = {}) {
  return html`
    <div class="Person-figure is-loading">
      <div class="Person-image"></div>
    </div>
  `
}
