var html = require('choo/html')
var { pluck } = require('../base')

module.exports = partners

function partners (items) {
  return html`
    <div class="Partners">
      ${items.map(function (image, index) {
        var src = image.src
        var attrs = pluck(image, 'srcset', 'sizes', 'alt')
        return html`
          <div class="Partners-item">
            <img class="Partners-logo" ${attrs} src="${src}">
          </div>
        `
      })}
    </div>
  `
}
