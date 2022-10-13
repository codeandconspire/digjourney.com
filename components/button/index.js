const html = require('choo/html')
const { className } = require('../base')

module.exports = button

function button(props) {
  if (!props) return null
  const attrs = Object.assign({}, props)
  delete attrs.text
  delete attrs.theme

  attrs.class = className('Button', {
    [props.class]: props.class,
    [`Button--${props.theme}`]: props.theme
  })

  if (attrs.href) {
    return html`
      <a ${attrs}><span>${props.text}</span></a>
    `
  }
  return html`
    <button ${attrs}><span>${props.text}</span></button>
  `
}
