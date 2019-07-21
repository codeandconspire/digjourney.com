// page types which all have featured fields used for links
var types = ['homepage', 'page', 'post', 'post_listing', 'product',
  'product_listing', 'course', 'course_listing']
var common = ['title', 'description', 'image', 'cta', 'featured_image']
var unique = {
  'page': ['parent', 'theme', 'alternative_publication_date']
}

module.exports = middleware

function middleware (predicates, opts) {
  var fetchLinks = opts.fetchLinks = (opts.fetchLinks || [])

  for (let i = 0, len = types.length; i < len; i++) {
    fetchLinks.push(...common.map((field) => types[i] + '.' + field))
  }

  var keys = Object.keys(unique).sort()
  for (let i = 0, len = keys.length; i < len; i++) {
    fetchLinks.push(...unique[keys[i]].map((field) => keys[i] + '.' + field))
  }

  return transform
}

function transform (err, response) {
  if (err) throw err
  return sanitize(response)
}

function sanitize (src) {
  var keys = Object.keys(src)
  var initial = Array.isArray(src) ? [] : {}
  return keys.reduce(function (target, key) {
    // exclude oembed html as instagram embeds are a complete shit show
    if ('embed_url' in src && key === 'html') return target
    if (src[key] && typeof src[key] === 'object') {
      target[key] = sanitize(src[key])
    } else {
      target[key] = src[key]
    }
    return target
  }, initial)
}
