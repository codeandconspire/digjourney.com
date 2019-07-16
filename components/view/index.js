var html = require('choo/html')
var raw = require('choo/html/raw')
var asElement = require('prismic-element')
var error = require('./error')
var Header = require('../header')
var Footer = require('../footer')
var Player = require('../embed/player')
var PrismicToolbar = require('../prismic-toolbar')
var { i18n, asText, memo, resolve, metaKey } = require('../base')

var text = i18n()

var DEFAULT_TITLE = text`SITE_NAME`

module.exports = createView

function createView (view, meta) {
  return function (state, emit) {
    return state.prismic.getSingle('website', function (err, doc) {
      var children

      try {
        if (err) throw err
        children = view(state, emit)
        let next = meta ? meta(state) : {}

        if (next && next.title && next.title !== DEFAULT_TITLE) {
          next.title = `${next.title} – ${DEFAULT_TITLE}`
        }

        let defaults = {
          title: doc ? asText(doc.data.title) : `${text`Loading`} – ${DEFAULT_TITLE}`,
          description: doc ? asText(doc.data.description) : null
        }

        if (doc && doc.data.featured_image && doc.data.featured_image.url) {
          defaults['og:image'] = doc.data.featured_image.url
          defaults['og:image:width'] = doc.data.featured_image.dimensions.width
          defaults['og:image:height'] = doc.data.featured_image.dimensions.height
        }

        emit('meta', Object.assign(defaults, next))
      } catch (err) {
        err.status = state.offline ? 503 : err.status || 500
        children = error(err, state, emit)
        emit('meta', { title: `${text`Oops`} – ${DEFAULT_TITLE}` })
      }

      var menu = memo(function () {
        if (!doc) return { menu: [] }
        var homepage = doc.data.homepage_link
        return {
          isOpen: state.ui.openNavigation,
          homepage: homepage.id && !homepage.isBroken ? {
            href: resolve(homepage),
            onclick: onclick(homepage)
          } : null,
          menu: doc.data.main_menu.map(branch).filter(Boolean)
        }
      }, [doc && doc.id, state.ui.openNavigation, 'menu'])

      var footer = memo(function () {
        if (!doc) return null
        return doc.data.footer_menu.map(branch).filter(Boolean)
      }, [doc && doc.id, 'footer'])

      return html`
        <body class="View ${state.ui.openNavigation ? 'is-overlayed' : ''}" id="view">
          <script type="application/ld+json">${raw(JSON.stringify(linkedData(state)))}</script>
          ${state.cache(Header, 'header').render(state.href, menu)}
          ${children}
          ${state.cache(Footer, 'footer').render(footer, doc ? asElement(doc.data.newsletter) : null, doc ? asElement(doc.data.contact_blurb) : null)}
          ${Player.render()}
          ${state.cache(PrismicToolbar, 'prismic-toolbar').placeholder(state.href)}
        </body>
      `

      // format document as schema-compatible linked data table
      // obj -> obj
      function linkedData (state) {
        return {
          '@context': 'http://schema.org',
          '@type': 'Organization',
          name: DEFAULT_TITLE,
          url: state.origin,
          logo: state.origin + '/icon.png'
        }
      }
    })

    // construct menu branch
    // obj -> obj
    function branch (slice) {
      var { primary, items } = slice
      if (slice.slice_type !== 'menu_item') return null
      if (primary.link.isBroken) return null
      return {
        label: primary.label || asText(primary.link.data.title),
        href: primary.link.id ? resolve(primary.link) : null,
        onclick: onclick(primary.link),
        children: items.map(function (item) {
          if ((!item.link.id && !item.link.url) || item.link.isBroken) return null
          return {
            label: item.label || asText(item.link.data.title),
            href: resolve(item.link),
            onclick: onclick(item.link),
            description: asText(item.description)
          }
        }).filter(Boolean)
      }
    }

    function onclick (doc) {
      return function (event) {
        if (metaKey(event)) return
        emit('pushState', event.currentTarget.href, { partial: doc })
        event.preventDefault()
      }
    }
  }
}
