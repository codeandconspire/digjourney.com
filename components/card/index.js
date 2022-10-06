var html = require('choo/html');
var link = require('./link');
var figure = require('./figure');
var { className, loader } = require('../base');

module.exports = card;
module.exports.loading = loading;

function card(props = {}) {
  if (props.link) {
    props.link.block = true;
  }

  var attrs = {
    class: className('Card', {
      'Card--image': props.image,
    }),
  };

  var image = props.image || null;
  if (typeof image === 'function') image = image();
  else if (image) image = figure(image);

  if (props.image && props.image.width && props.image.height) {
    attrs.style = `--Card-aspect: ${props.image.height / props.image.width};`;
  }

  return html`
    <article ${attrs}>
      <div class="u-sm-expand">${image}</div>
      <div class="Card-content">
        <div class="Card-body">
          ${props.date && props.date.text ? date(props.date) : null}
          <h3 class="Card-title">${props.title}</h3>
          ${props.body}
        </div>
        ${props.link
          ? link(
              Object.assign(
                {
                  visible: !props.background && !props.location,
                },
                props.link
              )
            )
          : null}
      </div>
    </article>
  `;
}

function loading(opts = {}) {
  return html`
    <article
      class="${className('Card', { 'Card--background': opts.background })}"
    >
      <div class="u-sm-expand">${opts.image ? figure.loading() : null}</div>
      <div class="Card-content">
        <div class="Card-body">
          ${opts.date
            ? html`<time class="Card-meta">${loader(6)}</time>`
            : null}
          <h3 class="Card-title">${loader(8)}</h3>
          <p class="Card-text">${loader(42)}</p>
        </div>
        ${opts.link ? html`<div class="Card-action">${loader(4)}</div>` : null}
      </div>
    </article>
  `;
}

function date(props) {
  return html`
    <time
      class="Card-meta"
      datetime="${JSON.stringify(props.datetime).replace(/"/g, '')}"
    >
      ${props.text}
    </time>
  `;
}
