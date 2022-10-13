const html = require('choo/html')
const { loader } = require('../base')

module.exports = intro
module.exports.loading = loading

function intro(opts = {}) {
  let body = opts.body

  if (typeof window === 'undefined') {
    if (Array.isArray(body) || body[0] === '<') {
      html`
        <div>${body}</div>
      `
    } else {
      body = html`
        <p>${body}</p>
      `
    }
  } else if (Array.isArray(body) || body instanceof window.Element) {
    body = html`
      <div>${body}</div>
    `
  } else {
    body = html`
      <p>${body}</p>
    `
  }

  return html`
    <div class="Intro">
      <h1 class="Intro-title">${opts.title}</h1>
      <div class="Intro-body">${body}</div>
    </div>
  `
}

function loading(opts = {}) {
  return html`
    <div class="Intro is-loading">
      <div class="Intro-title">${loader(3)}</div>
      <div class="Intro-body">${loader(30)}</div>
    </div>
  `
}
