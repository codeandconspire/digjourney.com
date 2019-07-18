var html = require('choo/html')
var { className } = require('../base')

module.exports = button

function button (props) {
  var attrs = Object.assign({}, props)
  delete attrs.text
  delete attrs.theme

  attrs.class = className('Button', {
    [props.class]: props.class,
    [`Button--${props.theme}`]: props.theme
  })

  if (attrs.href) return html`<a ${attrs}>${props.text}</a>`
  return html`<button ${attrs}>${props.text}</button>`
}
