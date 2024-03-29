const html = require('choo/html')
const figure = require('./figure')
const grid = require('../grid')
const { className, loader } = require('../base')

module.exports = compass
compass.loading = loading

function compass(props = {}) {
  const attrs = {
    class: className('Compass', {
      'Compass--image': props.image
    })
  }

  let image = null
  if (props.image) {
    image = figure(props.image)
  }

  return html`
    <div ${attrs}>
      <div class="Compass-wrap">
        ${image}
        <div class="Compass-content">
          ${props.title &&
          html`
            <h3 class="Compass-title">${props.title}</h3>
          `}
          ${props.children &&
          grid(
            {
              size: {
                sm: '1of2',
                md: image ? '1of1' : '1of2',
                lg: image ? '1of2' : '1of3'
              }
            },
            props.children
          )}
        </div>
      </div>
    </div>
  `
}

function loading(props = {}) {
  return html`
    <div class="Compass">
      <div class="Compass-wrap">
        ${figure.loading()}
        <div class="Compass-content">
          <h3 class="Compass-title">${loader(4)}</h3>
        </div>
      </div>
    </div>
  `
}
