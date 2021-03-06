var html = require('choo/html')

module.exports = facts

function facts (props) {
  return html`
    <div class="Facts u-lg-expand">
      ${props.heading ? html`
        <h2 class="Facts-heading">${props.heading}</h2>
      ` : null}
      <div class="Facts-body">
        <div class="Text">
          ${props.body}
        </div>
      </div>
    </div>
  `
}
