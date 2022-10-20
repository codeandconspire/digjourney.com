const html = require('choo/html')
const parse = require('date-fns/parse')
const asElement = require('prismic-element')
const { predicate } = require('@prismicio/client')
const view = require('../components/view')
const Hero = require('../components/hero')
const course = require('../components/course')
const serialize = require('../components/text/serialize')
const {
  i18n,
  loader,
  src,
  HTTPError,
  memo,
  srcset,
  resolve,
  metaKey,
  asText
} = require('../components/base')

const text = i18n()

module.exports = view(courses, meta)

function courses(state, emit) {
  emit('theme', 'yellow')
  return state.prismic.getSingle('course_listing', function (err, doc) {
    if (err) throw HTTPError(404, err)
    if (!doc) {
      return html`
        <main class="View-main">
          ${state.partial
            ? state.cache(Hero, `hero-${state.partial.id}`).render({
                theme: 'yellow',
                body: html`
                  <h1>${asText(state.partial.data.title)}</h1>
                  ${state.partial.data.description
                    ? asElement(
                        state.partial.data.description,
                        resolve,
                        serialize
                      )
                    : null}
                `
              })
            : Hero.loading({ theme: 'yellow' })}
          <div class="u-container">
            <div class="Text u-space2">
              <p>${loader(65)}</p>
            </div>
          </div>
        </main>
      `
    }

    const title = asText(doc.data.title)
    emit('track', 'view_item_list', { event_label: title })

    const featured = doc.data.featured
      .map(function ({ link }) {
        if (!link.id || link.isBroken) return null
        return state.prismic.getByUID('course', link.uid, function (err, doc) {
          if (err) return null
          if (!doc) return course.loading()
          return course(asCourse(doc))
        })
      })
      .filter(Boolean)

    const opts = {
      pageSize: 100,
      orderings: '[document.first_publication_date desc]'
    }
    const predicates = [predicate.at('document.type', 'course')]
    doc.data.featured.forEach(function ({ link }) {
      if (!link.id || link.isBroken) return
      predicates.push(predicate.not('document.id', link.id))
    })

    const courses = state.prismic.get(
      predicates,
      opts,
      function (err, response) {
        if (err) return []
        if (!response) return [course.loading()]
        if (!response.results) return [course.loading()]
        return response.results.map((doc) => course(asCourse(doc)))
      }
    )

    return html`
      <main class="View-main">
        ${state.cache(Hero, `hero-${doc.id}`).render({
          theme: 'yellow',
          body: html`
            <h1>${title}</h1>
            ${asElement(doc.data.description, resolve, serialize)}
          `
        })}
        <div class="u-container">
          <div class="Text u-space2">
            ${asElement(doc.data.body, resolve, serialize)}
          </div>
          <div class="u-space2">${featured.concat(courses)}</div>
        </div>
      </main>
    `
  })

  function asCourse(doc) {
    const now = new Date()
    const title = asText(doc.data.title)
    return {
      title,
      tags: doc.tags,
      description: asElement(doc.data.description, resolve, serialize),
      features: doc.data.features.map(({ text }) => text).filter(Boolean),
      link: {
        href: resolve(doc),
        onclick(event) {
          partial(doc)(event)
          emit('track', 'select_content', { event_label: title })
        }
      },
      teachers: doc.data.teachers
        .map(function (item) {
          const name = asText(item.name)
          if (!name) return null
          return {
            image: memo(
              function (url) {
                if (!url) return null
                return Object.assign(
                  {
                    alt: item.image.alt || '',
                    sizes: '90px',
                    srcset: srcset(url, [90, 180], {
                      transforms: 'q_100',
                      aspect: 1
                    }),
                    src: src(url, [60])
                  },
                  item.image.dimensions
                )
              },
              [item.image.url, 'small']
            ),
            title: name,
            body: asElement(item.description, resolve, serialize)
          }
        })
        .filter(Boolean),
      dates: doc.data.schedule
        .map(function (item) {
          if (parse(item.deadline) < now) return null
          return {
            title: item.title,
            label: item.label,
            link:
              (item.link.id || item.link.url) && !item.link.isBroken
                ? {
                    theme: 'yellow',
                    href: resolve(item.link),
                    text: text`Go to application`,
                    external: item.link.target === '_blank',
                    onclick() {
                      emit('track', 'generate_lead', { event_label: title })
                    }
                  }
                : null
          }
        })
        .filter(Boolean)
    }
  }

  // create onclick handler which emits pushState w/ partial info
  // obj -> fn
  function partial(doc) {
    return function (event) {
      if (metaKey(event)) return
      emit('pushState', event.currentTarget.href, { partial: doc })
      event.preventDefault()
    }
  }
}

function meta(state) {
  return state.prismic.getSingle('course_listing', function (err, doc) {
    if (err) throw err
    if (!doc) return null
    const props = {
      title: asText(doc.data.title),
      description: asText(doc.data.description),
      hubspot: doc.data.hubspot,
      contact: {
        blurb: doc.data.contact_blurb ? doc.data.contact_blurb : null
      }
    }

    const image = doc.data.featured_image
    if (image && image.url) {
      Object.assign(props, {
        'og:image': src(image.url, 1200),
        'og:image:width': 1200,
        'og:image:height':
          (1200 * image.dimensions.height) / image.dimensions.width
      })
    }

    return props
  })
}
