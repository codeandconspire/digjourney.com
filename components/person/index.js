const html = require('choo/html')
const figure = require('./figure')
const { loader, className } = require('../base')

module.exports = person
person.loading = loading

function person(props = {}) {
  let image = props.image
  if (typeof image === 'function') image = image()
  else if (image) image = figure(image)

  return html`
    <article
      class="${className('Person', {
        'Person--small': props.small,
        'Person--course': props.course
      })}">
      ${image}
      <div class="Person-info">
        <h3 class="Person-title">${props.title}</h3>
        ${props.role
          ? html`
              <span>${props.role}</span>
            `
          : null}
        ${props.body
          ? html`
              <div class="Person-text">${props.body}</div>
            `
          : null}
        ${props.link ? link(props.link) : null}
      </div>
    </article>
  `
}

function link(props) {
  const attrs = { href: props.href, class: 'Person-link' }
  if (props.external) {
    props.target = '_blank'
    props.rel = 'noopenere nofererrer'
  }
  return html`
    <a ${attrs}>${props.text}</a>
  `
}

function loading(props = {}) {
  return html`
    <div
      class="${className('Person is-loading', {
        'Person--small': props.small
      })}">
      ${figure.loading()}
      <div class="Person-info">
        <h3 class="Person-title">${loader(4)}</h3>
        <div class="Person-text"><p>${loader(15)}</p></div>
      </div>
    </div>
  `
}
