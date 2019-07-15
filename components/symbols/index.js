var html = require('choo/html')

exports.steps = function () {
  return html`
    <svg class="Symbol" width="50" height="50" viewBox="0 0 50 50">
      <g fill="none" fill-rule="evenodd">
        <path fill="#59AAF7" d="M30.3 11V1H40v40H1V31h9.8V21h9.7V11h9.8z" opacity=".6"/>
        <path fill="#4E45F7" d="M21 30v20h29V40h-9.7V30h-9.6V20H21v10z" opacity=".6"/>
      </g>
    </svg>
  `
}

exports.octagons = function () {
  return html`
    <svg class="Symbol" width="50" height="50" viewBox="0 0 50 50">
      <g fill="none" fill-rule="evenodd">
        <path fill="#F24A6F" d="M20 5l17.3 9.8v19.5L20 44 2.7 34.3V14.8z"  opacity=".6"/>
        <path fill="#23ADA1" d="M25.6 27.6l12.1-8 11.4 6.6-1 14.4L36 48.4 24.7 42z"  opacity=".6"/>
      </g>
    </svg>
  `
}
