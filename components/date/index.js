var html = require('choo/html')
var button = require('../button')

module.exports = date

function date (props) {
  return html`
    <div class="Date">
      <div class="Date-content">
        <strong class="Date-title">${props.title}</strong>
        ${props.label ? html`<br><span class="Date-label">${props.label}</span>` : null}
      </div>
      ${props.link ? link(props.link) : null}
    </div>
  `
}

function link (props) {
  var attrs = Object.assign({}, props)
  if (attrs.external) {
    attrs.target = '_blank'
    attrs.rel = 'noopenere nofererrer'
  }
  return button(attrs)
}
