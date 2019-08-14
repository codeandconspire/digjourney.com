var html = require('choo/html')
var parse = require('date-fns/parse')
var asElement = require('prismic-element')
var { Predicates } = require('prismic-javascript')
var view = require('../components/view')
var Hero = require('../components/hero')
var course = require('../components/course')
var serialize = require('../components/text/serialize')
var { i18n, loader, asText, src, HTTPError, memo, srcset, resolve, metaKey } = require('../components/base')

var text = i18n()

module.exports = view(courses, meta)

function courses (state, emit) {
  emit('theme', 'turquoise')
  return state.prismic.getSingle('course_listing', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial ? state.cache(Hero, `hero-${state.partial.id}`).render({
            theme: 'turquoise',
            body: html`
              <h1>${asText(state.partial.data.title)}</h1>
              ${asElement(state.partial.data.description, resolve)}
            `
          }) : Hero.loading({ theme: 'turquoise' })}
          <div class="u-container">
            <div class="Text u-space2">
              <p>${loader(65)}</p>
            </div>
          </div>
        </main>
      `
    }

    var title = asText(doc.data.title)
    emit('track', 'view_item_list', { event_label: title })

    var featured = doc.data.featured.map(function ({ link }) {
      if (!link.id || link.isBroken) return null
      return state.prismic.getByUID('course', link.uid, function (err, doc) {
        if (err) return null
        if (!doc) return course.loading()
        return course(asCourse(doc))
      })
    }).filter(Boolean)

    var opts = {
      pageSize: 100,
      orderings: '[document.first_publication_date desc]'
    }
    var predicates = [Predicates.at('document.type', 'course')]
    doc.data.featured.forEach(function ({ link }) {
      if (!link.id || link.isBroken) return
      predicates.push(Predicates.not('document.id', link.id))
    })

    var courses = state.prismic.get(predicates, opts, function (err, response) {
      if (err) return []
      if (!response) return [course.loading()]
      return response.results.map((doc) => course(asCourse(doc)))
    })

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: 'turquoise',
          body: html`
            <h1>${title}</h1>
            ${asElement(doc.data.description, resolve)}
          `
        })}
        <div class="u-container">
          <div class="Text u-space2">
            ${asElement(doc.data.body, resolve, serialize)}
          </div>
          <div class="u-space2 u-expand">
            ${featured.concat(courses)}
          </div>
        </div>
      </main>
    `
  })

  function asCourse (doc) {
    var now = new Date()
    var title = asText(doc.data.title)
    return {
      title: title,
      tags: doc.tags,
      description: asElement(doc.data.description, resolve),
      features: doc.data.features.map(({ text }) => text).filter(Boolean),
      link: {
        href: resolve(doc),
        onclick (event) {
          partial(doc)(event)
          emit('track', 'select_content', { event_label: title })
        }
      },
      teachers: doc.data.teachers.map(function (item) {
        var name = asText(item.name)
        if (!name) return null
        return {
          image: memo(function (url) {
            if (!url) return null
            return Object.assign({
              alt: item.image.alt || '',
              sizes: '60px',
              srcset: srcset(url, [60, 120], {
                transforms: 'q_100',
                aspect: 1
              }),
              src: src(url, [60])
            }, item.image.dimensions)
          }, [item.image.url, 'small']),
          title: name,
          body: asElement(item.description)
        }
      }).filter(Boolean),
      dates: doc.data.schedule.map(function (item) {
        if (parse(item.deadline) < now) return null
        return {
          title: item.title,
          label: item.label,
          meta: doc.data.price,
          link: (item.link.id || item.link.url) && !item.link.isBroken ? {
            theme: 'turquoise',
            href: resolve(item.link),
            text: text`Go to application`,
            external: item.link.target === '_blank',
            onclick () {
              emit('track', 'generate_lead', { event_label: title })
            }
          } : null
        }
      }).filter(Boolean)
    }
  }

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial (doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta (state) {
  return state.prismic.getSingle('course_listing', function (err, doc) {
    if (err) throw err
    if (!doc) return null
    var props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description)
    }

    var image = doc.data.featured_image
    if (image && image.url) {
      Object.assign(props, {
        'og:image': src(image.url, 1200),
        'og:image:width': 1200,
        'og:image:height': 1200 * image.dimensions.height / image.dimensions.width
      })
    }

    return props
  })
}
