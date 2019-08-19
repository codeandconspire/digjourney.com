var html = require('choo/html')
var grid = require('../grid')
var person = require('../person')
var button = require('../button')
var { i18n, loader } = require('../base')

var text = i18n()

module.exports = product
module.exports.loading = loading

function product (props) {
  var attrs = Object.assign({}, props.image)
  delete attrs.src

  return html`
    <article class="Product ${props.standalone ? 'Product--standalone' : ''}">
      ${props.image ? html`
        <figure class="Product-figure">
          <img class="Product-image" ${attrs} src="${props.image.src}">
        </figure>
      ` : null}
      <div class="Product-header">
        ${props.duration ? html`<strong class="Product-label">${props.duration}</strong>` : null}
        ${props.title ? html`<h3 class="Product-title">${props.title}</h3>` : null}
        <dl class="Product-properties">
          ${props.target ? html`
            <dt class="u-hiddenVisually">${text`Target audience`}</dt>
            <dd class="Product-value">${props.target}</dd>
          ` : null}
          ${props.duration ? html`
            <dt class="u-hiddenVisually">${text`Duration`}</dt>
            <dd class="Product-value">${props.duration}</dd>
          ` : null}
          ${props.location ? html`
            <dt class="u-hiddenVisually">${text`Location`}</dt>
            <dd class="Product-value">${props.location}</dd>
          ` : null}
        </dl>
      </div>
      <div class="Product-body">
        <div class="Text">
          ${props.body}
        </div>
        ${props.features ? html`
          <h4 class="Product-heading">${text`The course includes`}:</h4>
          <ul class="Product-features">
            ${props.features.map((feature) => html`
              <li class="Product-feature">${feature}</li>
            `)}
          </ul>
        ` : null}
        ${props.action ? html`
          <div class="u-spaceT4">
            ${button(Object.assign({ theme: 'blue' }, props.action))}
          </div>
        ` : null}
      </div>
      ${props.contact ? html`
        <div class="Product-contact">
          <div class="Text u-spaceB2">
            <h4>${text`Interested?`}</h4>
          </div>
          ${person(Object.assign({ small: true }, props.contact))}
        </div>
      ` : null}
    </article>
  `
}

function loading () {
  return html`
    <article class="Product is-loading">
      ${grid([
        grid.cell({ size: { lg: '1of3' } }, html`
          <div>
            <figure class="Product-figure">
              <div class="Product-image"></div>
            </figure>
            <div class="Text u-spaceB2">
              <h4>${loader(6)}</h4>
            </div>
            ${person.loading({ small: true })}
          </div>
        `),
        grid.cell({ size: { lg: '2of3' } }, html`
          <strong class="Product-label">${loader(5)}</strong>
          <h3 class="Product-title">${loader(7)}</h3>
          <dl class="Product-properties">
            <dt class="Product-prop">
              <span class="u-hiddenVisually">${text`Target audience`}</span>
            </dt>
            <dd class="Product-value">${loader(6)}</dd>
            <dt class="Product-prop">
              <span class="u-hiddenVisually">${text`Duration`}</span>
            </dt>
            <dd class="Product-value">${loader(4)}</dd>
            <dt class="Product-prop">
              <span class="u-hiddenVisually">${text`Location`}</span>
            </dt>
            <dd class="Product-value">${loader(4)}</dd>
          </dl>
          <div class="Text">
            <p>${loader(38)}</p>
          </div>
          <h4 class="Product-heading">${loader(4)}</h4>
          <ul class="Product-features">
            <li class="Product-feature">${loader(12)}</li>
            <li class="Product-feature">${loader(15)}</li>
            <li class="Product-feature">${loader(8)}</li>
            <li class="Product-feature">${loader(14)}</li>
          </ul>
        `)
      ])}
    </article>
  `
}
