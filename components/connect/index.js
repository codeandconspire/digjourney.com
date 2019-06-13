var html = require('choo/html')
var grid = require('../grid')
var { i18n, memo, srcset } = require('../base')

var text = i18n()

module.exports = connect

function connect (props) {
  var { instagram, newsletter } = props
  return html`
    <div class="Connect">
      <div class="Connect-instagram">
        <div class="Text u-large">
          <h3 class="u-spaceT0">${text`On Instagram`} <a class="Connect-link" href="${instagram.link}">@bomaglobal</a></h3>
        </div>
        <div class="u-md-uncontain">
          ${grid({ size: { md: '1of2', lg: '1of3' }, carousel: true, slim: true }, instagram.images.map(function (embed) {
            return html`
              <a href="${embed.embed_url}" class="Connect-figure" target="_blank" rel="noopener noreferrer">
                <img ${attrs(embed)} class="Connect-post" />
              </a>
            `
          }))}
        </div>
      </div>
      <div class="Connect-newsletter">
        <svg class="Connect-image" width="112" height="79" viewBox="0 0 112 79">
          <g fill="none" fill-rule="evenodd">
            <path fill="#FF8200" d="M79 66.2A33 33 0 1 0 46 33v43.3c0 3.3 3.2 3.3 4.4.6 2.3-5 4-10.8 11.2-10.8H79z"/>
            <path fill="#201745" d="M20 45.4a20 20 0 1 1 20-20.1v26.4c0 2-2 2-2.7.4-1.4-3-2.4-6.7-6.7-6.7H20z"/>
          </g>
        </svg>
        <div class="Text u-large u-textCenter">
          <h2 class="u-spaceA0">${newsletter.heading}</h2>
          ${newsletter.text}
        </div>
        <form method="POST" action="/">
          <input class="Connect-input" type="email" autocomplete="email" placeholder="${text`Enter your email`}">
          <button type="submit" class="u-hiddenVisually">${text`Submit`}</button>
        </form>
      </div>
    </div>
  `
}

function attrs (image) {
  return memo(function (url, sizes) {
    var sources = srcset(url, sizes, { aspect: 1 })
    return {
      srcset: sources,
      sizes: '(min-width: 600px) 250px, 100vw',
      alt: image.title.split('.')[0],
      src: sources.split(' ')[0],
      width: image.width,
      height: image.width
    }
  }, [image.thumbnail_url, [250, 400, 600, 800]])
}
