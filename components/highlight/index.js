var html = require('choo/html')
var button = require('../button')
var { loader } = require('../base')

module.exports = highlight
module.exports.loading = loading

function highlight (props) {
  return html`
    <section class="Highlight Highlight--${props.direction || 'left'}">
      ${props.image ? html`
        <figure class="Highlight-figure">
          ${getImage(props.image)}
        </figure>
      ` : null}
      <div class="Highlight-body">
        <div class="Text Highlight-text">
          ${props.title ? html`<h1>${props.title}</h1>` : null}
          ${props.body ? props.body : null}
          ${props.action ? html`
            <p>
              ${button(props.action)}
            </p>
          ` : null}
        </div>
      </div>
    </section>
  `
}

// get hero image element
// obj -> Element
function getImage (props) {
  var attrs = {}
  Object.keys(props).forEach(function (key) {
    if (key !== 'src') attrs[key] = props[key]
  })
  return html`<img class="Highlight-image" ${attrs} src="${props.src}" />`
}

function loading (opts = {}) {
  return html`
    <section class="Highlight Highlight--${opts.direction || 'left'} is-loading">
      <figure class="Highlight-figure">
        <div class="Highlight-image u-loading">
          <div class="u-aspect1-1"></div>
        </div>
      </figure>
      <div class="Highlight-body">
        <div class="Text Highlight-text">
          <h2>${loader(12)}</h2>
          <p>${loader(48)}</p>
        </div>
      </div>
    </section>
  `
}
