var html = require('choo/html')
var assert = require('assert')
var { i18n, isSameDomain, filetype, loader } = require('../base')

var text = i18n(require('./lang.json'))

module.exports = link
link.loading = loading

function link (opts = {}) {
  assert(opts.href, 'link: href string is required')

  opts.file = opts.file ? opts.file : filetype(opts.href)
  opts.external = opts.external ? opts.external : !isSameDomain(opts.href)

  var attrs = { class: 'Card-link', href: opts.href }
  // Files should only open in new tab if it's a (pdf) document
  if ((opts.external && !opts.file) || opts.file === 'document') {
    attrs.rel = 'noopener noreferrer'
    attrs.target = '_blank'
  }
  if (typeof opts.onclick === 'function') attrs.onclick = opts.onclick
  if (opts.file) attrs.download = ''
  attrs.class = 'Card-link'

  return html`
    <a ${attrs}>
      <span class="${('visible' in opts && !opts.visible) ? 'u-hiddenVisually' : ''}">
        ${label(opts)}
      </span>
    </a>
  `
}

function loading (opts = {}) {
  return html`<div>${loader(4)}</div>`
}

function label (opts) {
  if (opts.text) return opts.text
  if (opts.file) return text(`Download ${opts.file}`)
  if (opts.external) return text`Go to website`
  return text`Read more`
}
