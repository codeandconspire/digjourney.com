var html = require('choo/html')
var date = require('../date')
var grid = require('../grid')
var person = require('../person')
var { i18n, loader } = require('../base')

var text = i18n()

module.exports = course
module.exports.loading = loading

function course (props) {
  return html`
    <article class="Course">
      ${grid([
        grid.cell({ size: { lg: '1of3' } }, html`
          <div>
            <h3 class="Course-title">${props.title}</h3>
            ${props.description}
            <a class="Course-link" href="${props.href}">${text`Read more about the course`}</a>
          </div>
        `),
        grid.cell({ size: { md: '1of2', lg: '1of3' } }, html`
          <div class="Course-panel">
            <h4 class="Course-heading">${text`The course includes`}</h4>
            <ul class="Course-features">
              ${props.features.map((text) => html`
                <li class="Course-feature">${text}</li>
              `)}
            </ul>
          </div>
        `),
        grid.cell({ size: { md: '1of2', lg: '1of3' } }, html`
          <div class="Course-panel">
            <h4 class="Course-heading">${text`Kursledare`}</h4>
            ${props.teachers.map((props, index) => html`
              <div class="${index > 0 ? 'u-spaceT2' : ''}">
                ${person(Object.assign({ small: true }, props))}
              </div>
            `)}
          </div>
        `)
      ])}
      ${props.dates ? html`
        <div class="Course-dates">
          <h4>${text`Upcoming course dates`}</h4>
          <ol>
            ${props.dates.map((item) => html`
              <li>${date(item)}</li>
            `)}
          </ol>
        </div>
      ` : null}
    </article>
  `
}

function loading () {
  return html`
    <article class="Course is-loading">
      ${grid([
        grid.cell({ size: { lg: '1of3' } }, html`
          <div class="Text">
            <h3 class="Course-title">${loader(12)}</h3>
            ${loader(42)}
          </div>
        `),
        grid.cell({ size: { md: '1of2', lg: '1of3' } }, html`
          <div class="Course-panel">
            <h4 class="Course-heading">${loader(4)}</h4>
            <ul class="Course-features">
              <li class="Course-feature">${loader(12)}</li>
              <li class="Course-feature">${loader(15)}</li>
              <li class="Course-feature">${loader(8)}</li>
              <li class="Course-feature">${loader(14)}</li>
            </ul>
          </div>
        `),
        grid.cell({ size: { md: '1of2', lg: '1of3' } }, html`
          <div class="Course-panel">
            <h4 class="Course-heading">${loader(4)}</h4>
            ${person.loading({ small: true })}
            <div class="u-spaceT2">
              ${person.loading({ small: true })}
            </div>
          </div>
        `)
      ])}
    </article>
  `
}
