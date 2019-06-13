var html = require('choo/html')
var view = require('../components/view')
var { asText, HTTPError } = require('../components/base')

module.exports = view(home, meta)

function home (state, emit) {
  return html`
    <main class="View-main">
      ${state.prismic.getSingle('community', function (err, doc) {
        if (err) throw HTTPError(404, err)

        return html`
          <div class="Sponsors u-space2" style="overflow: hidden;">
            <div class="u-space2">
              <div class="Text">
                <h1 class="u-textCenter">The Community</h1>
              </div>    
            </div>    
          </div>
        `
      })}
    </main>
  `
}

function meta (state) {
  return state.prismic.getSingle('community', function (err, doc) {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description)
    }

    var image = doc.data.featured_image
    if (!image.url) image = doc.data.image
    if (image.url) {
      Object.assign(props, {
        'og:image': image.url,
        'og:image:width': image.dimensions.width,
        'og:image:height': image.dimensions.height
      })
    }

    return props
  })
}
