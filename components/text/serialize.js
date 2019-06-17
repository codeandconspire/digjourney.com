var html = require('choo/html')
var { Elements } = require('prismic-richtext')
var { srcset, src } = require('../base')
var embed = require('../embed')

module.exports = serialize

function serialize (type, node, content, children) {
  switch (type) {
    case Elements.paragraph: {
      if (node.text === '' || node.text.match(/^\s+$/)) {
        return html`<!-- Empty paragraph node removed -->`
      }
      return null
    }
    case Elements.embed: {
      let provider = node.oembed.provider_name.toLowerCase()
      let id = embed.id(node.oembed)

      return embed({
        url: node.oembed.embed_url,
        title: node.oembed.title,
        src: `/media/${provider}/w_900/${id}`,
        width: node.oembed.thumbnail_width,
        height: node.oembed.thumbnail_height,
        sizes: '41em',
        srcset: srcset(id, [400, 900, 1800], { type: provider })
      })
    }
    case Elements.image: {
      let attrs = Object.assign({ alt: node.alt || '' }, node.dimensions)
      if (!/\.(svg|gif)$/.test(node.url)) {
        attrs.sizes = '42rem'
        attrs.srcset = srcset(node.url, [400, 600, 800, 1200].map(function (size, index) {
          return Math.min(size, node.dimensions.width * (index + 1))
        }))
      }
      return html`
        <figure>
          <img ${attrs} src="${src(node.url, 800)}">
          ${node.alt ? html`<figcaption class="Text-caption">${node.alt}</figcaption>` : null}
        </figure>
      `
    }
    default: return null
  }
}
