const html = require('choo/html')

module.exports = facts

function facts(props) {
  return html`
    <div class="Facts">
      ${props.heading
        ? html`
            <h2 class="Facts-heading">${props.heading}</h2>
          `
        : null}
      <div class="Facts-body">
        <div class="Text Text--small">${props.body}</div>
      </div>
    </div>
  `
}
