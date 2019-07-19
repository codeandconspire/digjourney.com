var html = require('choo/html')
var { i18n, loader, className } = require('../base')

var text = i18n()

module.exports = callout
module.exports.loading = loading

function callout (props) {
  var link = Object.assign({}, props.link)
  delete link.text

  var classes = className(`Callout Callout--${props.direction || 'left'}`, {
    'Callout--image': props.image,
    [`Callout--${props.theme}`]: props.theme
  })

  return html`
    <article class="${classes} u-expand">
      ${props.image ? html`
        <figure class="Callout-figure">
          ${getImage(props.image)}
        </figure>
      ` : null}
      <div class="Callout-content">
        <div class="Callout-text">
          ${props.label ? html`<span class="Callout-label">${props.label}</span>` : null}
          ${props.title ? html`<h2 class="Callout-title">${props.title}</h2>` : null}
          <div class="Callout-body">
            <div class="Text">
              ${props.body ? props.body : null}
            </div>
          </div>
        </div>
        ${props.link ? html`
          <a class="Callout-link" ${link}>${props.link.text || text`Read more`}</a>
        ` : null}
      </div>
    </article>
  `
}

// get hero image element
// obj -> Element
function getImage (props) {
  var attrs = {}
  Object.keys(props).forEach(function (key) {
    if (key !== 'src') attrs[key] = props[key]
  })
  return html`<img class="Callout-image" ${attrs} src="${props.src}" />`
}

function loading (opts = {}) {
  var classes = className(`Callout Callout--${opts.direction || 'left'}`, {
    'Callout--image': opts.image
  })
  return html`
    <article class="${classes} is-loading u-expand">
      ${opts.image ? html`
        <figure class="Callout-figure">
          <div class="Callout-image u-loading"></div>
        </figure>
      ` : null}
      <div class="Callout-content">
        <div class="Callout-text">
          ${opts.label ? html`<span class="Callout-label">${loader(4)}</span>` : null}
          <h2 class="Callout-title">${loader(12)}</h2>
          <div class="Callout-body">
            <div class="Text">
              <p>${loader(48)}</p>
            </div>
          </div>
        </div>
        ${opts.link ? html`<span class="Callout-link">${loader(4)}</a>` : null}
      </div>
    </article>
  `
}
