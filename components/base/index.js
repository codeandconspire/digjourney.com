var fs = require('fs')
var path = require('path')
var LRU = require('nanolru')
var assert = require('assert')
var html = require('choo/html')
var common = require('./lang.json')

if (typeof window !== 'undefined') {
  require('focus-visible')
  require('smoothscroll-polyfill').polyfill()
}

// resolve prismic document url
// obj -> str
exports.resolve = resolve
function resolve (doc) {
  var root = ''
  var parent = doc.data && doc.data.parent
  if (parent && parent.id && !parent.isBroken) {
    root = `/${parent.uid}`
  }

  switch (doc.type) {
    case 'website':
    case 'homepage': return '/'
    case 'post_listing': return '/insikter'
    case 'post': return `/insikter/${doc.uid}`
    case 'product_listing': return '/radgivning'
    case 'course_listing': return '/utbildning'
    case 'course': return `/utbildning/${doc.uid}`
    case 'page': return `${root}/${doc.uid}`
    case 'Web':
    case 'Media': return doc.url
    default: {
      // handle links to web and media
      let type = doc.link_type
      if (type === 'Web' || type === 'Media' || type === 'Any') return doc.url
      throw new Error(`Could not resolve href for document type "${doc.type}"`)
    }
  }
}

// initialize translation utility with given language file
// obj -> str
exports.i18n = i18n
function i18n (source) {
  source = source || common

  // get text by applying as tagged template literal i.e. text`Hello ${str}`
  // (arr|str[, ...str]) -> str
  return function (strings, ...parts) {
    parts = parts || []

    var key = Array.isArray(strings) ? strings.join('%s') : strings
    var value = source[key] || common[key]

    if (!value) {
      value = common[key] = key
      if (typeof window === 'undefined') {
        var file = path.join(__dirname, 'lang.json')
        fs.writeFileSync(file, JSON.stringify(common, null, 2))
      }
    }

    var hasForeignPart = false
    var res = value.split('%s').reduce(function (result, str, index) {
      var part = parts[index] || ''
      if (!hasForeignPart) {
        hasForeignPart = (typeof part !== 'string' && typeof part !== 'number')
      }
      result.push(str, part)
      return result
    }, [])

    return hasForeignPart ? res : res.join('')
  }
}

// check if an URL is on the the current domain
// str -> bool
exports.isSameDomain = isSameDomain
function isSameDomain (url) {
  var external = /^[\w-]+:\/{2,}\[?[\w.:-]+\]?(?::[0-9]*)?/

  try {
    var result = external.test(url) && new window.URL(url)
    return !result || (result.hostname === window.location.hostname)
  } catch (err) {
    return true
  }
}

// get color ligtness from hex
// str -> num
exports.luma = luma
function luma (str) {
  var hex = str.replace(/^#/, '')
  var rgb = parseInt(hex, 16)
  var r = (rgb >> 16) & 0xff
  var g = (rgb >> 8) & 0xff
  var b = (rgb >> 0) & 0xff

  // per ITU-R BT.709
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// returns a general file type from an url
// str -> str
exports.filetype = filetype
function filetype (url) {
  if (!url) return null
  var type = url.toLowerCase().match(/[^.]+$/)

  if (!type) return null

  switch (type[0]) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'tiff':
    case 'bmp':
    case 'svg':
    case 'webp': return 'image'
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
    case 'mkv':
    case 'mpg':
    case 'wmv': return 'video'
    case 'mp3':
    case 'wma':
    case 'flac':
    case 'wav': return 'audio'
    case 'tar':
    case 'zip': return 'zip'
    case 'key':
    case 'ppt':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'pdf': return 'document'
    default: return null
  }
}

// get viewport height
// () -> num
exports.vh = vh
function vh () {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
}

// get viewport width
// () -> num
exports.vw = vw
function vw () {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
}

// compose class name based on supplied conditions
// (str|obj, obj?) -> str
exports.className = className
function className (root, classes) {
  if (typeof root === 'object') {
    classes = root
    root = ''
  }

  return Object.keys(classes).reduce((str, key) => {
    if (!classes[key]) return str
    return str + ' ' + key
  }, root).trim()
}

// detect if meta key was pressed on event
// obj -> bool
exports.metaKey = metaKey
function metaKey (e) {
  if (e.button && e.button !== 0) return true
  return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
}

// pick props from object
// (obj, arr|...str) -> obj
exports.pluck = pluck
function pluck (src, ...keys) {
  keys = Array.isArray(keys[0]) ? keys[0] : keys
  return keys.reduce(function (obj, key) {
    if (src[key]) obj[key] = src[key]
    return obj
  }, {})
}

// compose reduce middlewares that boils down list ot truthy values
// (arr, ...fn) -> arr
exports.reduce = reduce
function reduce (list) {
  var middleware = Array.prototype.slice.call(arguments, 1)
  return list.reduce(function (result, initial, i, from) {
    var val = middleware.reduce((val, fn) => val && fn(val, i, from), initial)
    if (val) result.push(val)
    return result
  }, [])
}

// compose src attribute from url for a given size
// (str, num, obj?) -> str
exports.src = src
function src (uri, size, opts = {}) {
  var { transforms = 'c_fill,f_auto,q_auto', type = 'fetch' } = opts

  // apply default transforms
  if (!/c_/.test(transforms)) transforms += ',c_fill'
  if (!/f_/.test(transforms)) transforms += ',f_jpg'
  if (!/q_/.test(transforms)) transforms += ',q_auto'

  // trim prismic domain from uri
  var parts = uri.split('digjourney.cdn.prismic.io/digjourney/')
  uri = parts[parts.length - 1]

  return `/media/${type}/${transforms ? transforms + ',' : ''}w_${size}/${uri}`
}

// compose srcset attribute from url for given sizes
// (str, arr, obj?) -> str
exports.srcset = srcset
function srcset (uri, sizes, opts = {}) {
  return sizes.map(function (size) {
    opts = Object.assign({}, opts)
    if (Array.isArray(size)) {
      opts.transforms = opts.transforms ? size[1] + ',' + opts.transforms : size[1]
      size = size[0]
    }
    if (opts.aspect) {
      let height = `h_${Math.floor(size * opts.aspect)}`
      opts.transforms = opts.transforms ? `${opts.transforms},${height}` : height
    }

    return `${src(uri, size, opts)} ${size}w`
  }).join(',')
}

// get HH:mm timestamp from date
// Date -> str
exports.timestamp = timestamp
function timestamp (date) {
  return [
    ('0' + date.getHours()).substr(-2),
    ('0' + date.getMinutes()).substr(-2)
  ].join('.')
}

// nullable text getter for Prismic text fields
// (arr?) -> str
exports.asText = asText
function asText (richtext) {
  if (!richtext || !richtext.length) return null
  var text = ''
  for (let i = 0, len = richtext.length; i < len; i++) {
    text += (i > 0 ? ' ' : '') + richtext[i].text
  }
  return text
}

// create placeholder loading text of given length
// (num, bool?) -> Element
exports.loader = loader
function loader (length, light = false) {
  var content = '⏳'.repeat(length).split('').reduce(function (str, char) {
    if (Math.random() > 0.7) char += ' '
    return str + char
  }, '')
  return html`<span class="u-loading${light ? 'Light' : ''}">${content}</span>`
}

// custom error with HTTP status code
// (num, Error?) -> HTTPError
exports.HTTPError = HTTPError
function HTTPError (status, err) {
  if (!(this instanceof HTTPError)) return new HTTPError(status, err)
  if (!err || typeof err === 'string') err = new Error(err)
  err.status = status
  Object.setPrototypeOf(err, Object.getPrototypeOf(this))
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, HTTPError)
  }
  return err
}

HTTPError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: Error,
    enumerable: false,
    writable: true,
    configurable: true
  }
})

if (Object.setPrototypeOf) {
  Object.setPrototypeOf(HTTPError, Error)
} else {
  HTTPError.__proto__ = Error // eslint-disable-line no-proto
}

var MEMO = new LRU()

// momize function
// (fn, arr) -> any
exports.memo = memo
function memo (fn, keys) {
  assert(Array.isArray(keys) && keys.length, 'memo: keys should be non-empty array')
  var key = JSON.stringify(keys)
  var result = MEMO.get(key)
  if (!result) {
    result = fn.apply(undefined, keys)
    MEMO.set(key, result)
  }
  return result
}
