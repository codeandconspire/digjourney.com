const html = require('choo/html')
const button = require('../button')

module.exports = date

function date(props) {
  return html`
    <div class="Date">
      <div class="Date-content">
        <strong class="Date-title">${props.title}</strong>
        ${props.label
          ? html`
              <br />
              <span class="Date-label">${props.label}</span>
            `
          : null}
      </div>
      <div class="Date-action">
        ${props.meta
          ? html`
              <span class="Date-meta">${props.meta}</span>
            `
          : null}
        ${props.link ? link(props.link) : null}
      </div>
    </div>
  `
}

function link(props) {
  const attrs = Object.assign({}, props)
  if (attrs.external) {
    attrs.target = '_blank'
    attrs.rel = 'noopenere nofererrer'
  }
  return button(attrs)
}
