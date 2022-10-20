const html = require('choo/html')

module.exports = quote

function quote(props) {
  return html`
    <figure class="Quote">
      <div class="u-container">
        <div class="Quote-content">
          <svg class="Quote-symbol" width="67" height="56" viewBox="0 0 67 56">
            <g fill="currentColor" fill-rule="nonzero">
              <path
                d="M31 4.1a20.5 20.5 0 0 0-5.9 14.4 16.8 16.8 0 0 0 7.9 15L19.7 56H0l13.1-22.1C6.7 31.9 1.6 27 1.6 18.8 1.6 9.8 8.4 1 20.4 1A18 18 0 0 1 31 4.1z" />
              <path
                d="M29 55l13.2-22.1c-6.4-2-11.6-6.8-11.6-15.1 0-9 6.8-17.8 18.9-17.8C60.8 0 67 8 67 17.4c0 5.5-2.4 10.7-5 15L48.8 55H29z" />
            </g>
          </svg>
          <div class="Text Text--large">${props.body}</div>
          ${props.label || props.name
            ? html`
                <figcaption class="Text">
                  ${props.name
                    ? html`<p style="margin-bottom: 0;">
                        <strong>${props.name}</strong>
                      </p>`
                    : null}
                  ${props.label
                    ? html`
                        <p style="margin-top: 0;">${props.label}</p>
                      `
                    : null}
                </figcaption>
              `
            : null}
        </div>
      </div>
    </figure>
  `
}
