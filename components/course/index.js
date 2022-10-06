var html = require('choo/html');
var date = require('../date');
var grid = require('../grid');
var person = require('../person');
var { i18n, loader, luma } = require('../base');

var COLORS = ['FFCB84', 'DA6526', '07AAB8', 'FFB3B3', '110046'];

var text = i18n();

module.exports = course;
module.exports.loading = loading;

function course(props) {
  var colors = [];
  if (props.tags) {
    for (let i = 0, len = props.tags.length; i < len; i++) {
      let color;
      for (let i = 0, len = COLORS.length; i < len; i++) {
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
        if (!colors.includes(color)) break;
      }
      colors.push(color);
    }
  }

  return html`
    <article class="Course">
      ${grid([
        grid.cell(
          { size: { lg: '1of3' } },
          html`
            <div>
              ${props.tags
                ? html`
                    <ul>
                      ${props.tags.map(
                        (tag, index) => html`
                          <li
                            class="Course-tag"
                            style="background: #${colors[index]}; color: ${luma(
                              colors[index]
                            ) < 170
                              ? '#fff'
                              : 'currentColor'};"
                          >
                            ${tag}
                          </li>
                        `
                      )}
                    </ul>
                  `
                : null}
              <h3 class="Course-title">${props.title}</h3>
              ${props.description}
              ${props.link
                ? html`
                    <a class="Course-link" ${props.link}
                      >${text`Read more about the course`}</a
                    >
                  `
                : null}
            </div>
          `
        ),
        grid.cell(
          { size: { md: '1of2', lg: '1of3' } },
          html`
            <div class="Course-panel u-sm-expand">
              <h4 class="Course-heading">${text`The course includes`}</h4>
              <ul class="Course-features">
                ${props.features.map(
                  (text) => html` <li class="Course-feature">${text}</li> `
                )}
              </ul>
            </div>
          `
        ),
        grid.cell(
          { size: { md: '1of2', lg: '1of3' } },
          html`
            <div class="Course-panel u-sm-expand">
              <h4 class="Course-heading">${text`Kursledare`}</h4>
              ${props.teachers.map(
                (props, index) => html`
                  <div class="${index > 0 ? 'u-spaceT2' : ''}">
                    ${person(
                      Object.assign({ small: true, course: true }, props)
                    )}
                  </div>
                `
              )}
            </div>
          `
        ),
      ])}
      ${props.dates
        ? html`
            <div class="Course-dates">
              <h2><strong>${text`Upcoming course dates`}</strong></h2>
              <ol class="u-sm-expand">
                ${props.dates.map((item) => html` <li>${date(item)}</li> `)}
              </ol>
            </div>
          `
        : null}
    </article>
  `;
}

function loading() {
  return html`
    <article class="Course is-loading">
      ${grid([
        grid.cell(
          { size: { lg: '1of3' } },
          html`
            <div class="Text">
              <h3 class="Course-title">${loader(12)}</h3>
              ${loader(42)}
            </div>
          `
        ),
        grid.cell(
          { size: { md: '1of2', lg: '1of3' } },
          html`
            <div class="Course-panel u-sm-expand">
              <h4 class="Course-heading">${loader(4)}</h4>
              <ul class="Course-features">
                <li class="Course-feature">${loader(12)}</li>
                <li class="Course-feature">${loader(15)}</li>
                <li class="Course-feature">${loader(8)}</li>
                <li class="Course-feature">${loader(14)}</li>
              </ul>
            </div>
          `
        ),
        grid.cell(
          { size: { md: '1of2', lg: '1of3' } },
          html`
            <div class="Course-panel u-sm-expand">
              <h4 class="Course-heading">${loader(4)}</h4>
              ${person.loading({ small: true })}
              <div class="u-spaceT2">${person.loading({ small: true })}</div>
            </div>
          `
        ),
      ])}
    </article>
  `;
}
