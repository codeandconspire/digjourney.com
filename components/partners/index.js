const html = require('choo/html')
const { pluck } = require('../base')

module.exports = partners

function partners(items) {
  return html`
    <div class="Partners">
      ${items.map(function (image, index) {
        const src = image.src
        const attrs = pluck(image, 'srcset', 'sizes', 'alt')
        return html`
          <div class="Partners-item">
            <img class="Partners-logo" ${attrs} src="${src}" />
          </div>
        `
      })}
    </div>
  `
}
