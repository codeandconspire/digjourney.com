const html = require('choo/html')
const { className } = require('../base')

module.exports = grid
module.exports.cell = cell

// render children in grid cells
// (obj?, arr) -> Element
function grid(opts, children) {
  if (!children) {
    children = opts
    opts = {}
  }

  const classes = className('Grid', {
    'Grid--carousel': opts.carousel,
    'Grid--divided': opts.divided,
    'Grid--slim': opts.slim
  })

  if (opts.ordered) {
    return html`
      <ol class="${classes}">
        ${children.map(child)}
      </ol>
    `
  }
  return html`
    <div class="${classes}">${children.map(child)}</div>
  `

  // render grid cell
  // (Element|obj -> num) -> Element
  function child(props, index) {
    const attrs = { class: 'Grid-cell' }

    let children = props
    if (children.render) children = children.render
    if (typeof children === 'function') children = children()

    const size = props.size || opts.size
    if (size) attrs.class += ' ' + sizes(size)

    let appear = props.appear
    if (!appear && typeof appear !== 'number') {
      appear = opts.appear
    }
    if (appear || typeof appear === 'number') {
      const order = typeof appear === 'number' ? appear : index
      attrs.class += ' Grid-cell--appear'
      attrs.style = `animation-delay: ${order * 100}ms`
    }

    if (opts.ordered) {
      return html`
        <li ${attrs}>${children}</li>
      `
    }
    return html`
      <div ${attrs}>${children}</div>
    `
  }
}

// convenience function for creating grid cells with options
// (obj, Element|arr) -> obj
function cell(opts, children) {
  if (!children) {
    children = opts
    opts = {}
  }
  return Object.assign({ render: children }, opts)
}

function sizes(opts) {
  let size = ''
  if (opts.xs) size += `u-size${opts.xs} `
  if (opts.sm) size += `u-sm-size${opts.sm} `
  if (opts.md) size += `u-md-size${opts.md} `
  if (opts.lg) size += `u-lg-size${opts.lg} `
  if (opts.xl) size += `u-xl-size${opts.xl} `
  return size
}
