const fs = require('fs')
const path = require('path')
const LRU = require('nanolru')
const assert = require('assert')
const html = require('choo/html')
const common = require('./lang.json')
const { asText } = require('@prismicio/richtext')

if (typeof window !== 'undefined') {
  require('focus-visible')
  require('smoothscroll-polyfill').polyfill()
}

// get hex color code for theme
// str -> str
exports.themeColor = themeColor
function themeColor(name) {
  switch (name) {
    case 'gray':
      return '#F4F3F6'
    case 'yellow':
      return '#FFCB84'
    case 'orange':
      return '#DA6526'
    case 'turquoise':
      return '#07AAB8'
    case 'pink':
      return '#FFB3B3'
    case 'blue':
    default:
      return '#110046'
  }
}

// resolve prismic document url
// obj -> str
exports.resolve = resolve
function resolve(doc) {
  let root = ''
  const parent = doc.data && doc.data.parent
  if (parent && parent.id && !parent.isBroken) {
    root = `/${parent.uid}`
  }

  switch (doc.type) {
    case 'website':
    case 'homepage':
      return '/'
    case 'post_listing':
      return '/insikter'
    case 'post':
      return `/insikter/${doc.uid}`
    case 'product_listing':
      return '/forelasning'
    case 'product':
      return `/forelasning/${doc.uid}`
    case 'course_listing':
      return '/utbildning'
    case 'course':
      return `/utbildning/${doc.uid}`
    case 'page':
      return `${root}/${doc.uid}`
    case 'Web':
    case 'Media':
      return doc.url
    default: {
      // handle links to web and media
      const type = doc.link_type
      if (type === 'Web' || type === 'Media' || type === 'Any') return doc.url
      throw new Error(`Could not resolve href for document type "${doc.type}"`)
    }
  }
}

// initialize translation utility with given language file
// obj -> str
exports.i18n = i18n
function i18n(source) {
  source = source || common

  // get text by applying as tagged template literal i.e. text`Hello ${str}`
  // (arr|str[, ...str]) -> str
  return function (strings, ...parts) {
    parts = parts || []

    const key = Array.isArray(strings) ? strings.join('%s') : strings
    let value = source[key] || common[key]

    if (!value) {
      value = common[key] = key
      if (typeof window === 'undefined') {
        const file = path.join(__dirname, 'lang.json')
        fs.writeFileSync(file, JSON.stringify(common, null, 2))
      }
    }

    let hasForeignPart = false
    const res = value.split('%s').reduce(function (result, str, index) {
      const part = parts[index] || ''
      if (!hasForeignPart) {
        hasForeignPart = typeof part !== 'string' && typeof part !== 'number'
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
function isSameDomain(url) {
  const external = /^[\w-]+:\/{2,}\[?[\w.:-]+\]?(?::[0-9]*)?/

  try {
    const result = external.test(url) && new window.URL(url)
    return !result || result.hostname === window.location.hostname
  } catch (err) {
    return true
  }
}

// get color ligtness from hex
// str -> num
exports.luma = luma
function luma(str) {
  const hex = str.replace(/^#/, '')
  const rgb = parseInt(hex, 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff

  // per ITU-R BT.709
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// returns a general file type from an url
// str -> str
exports.filetype = filetype
function filetype(url) {
  if (!url) return null
  const type = url.toLowerCase().match(/[^.]+$/)

  if (!type) return null

  switch (type[0]) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'tiff':
    case 'bmp':
    case 'svg':
    case 'webp':
      return 'image'
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
    case 'mkv':
    case 'mpg':
    case 'wmv':
      return 'video'
    case 'mp3':
    case 'wma':
    case 'flac':
    case 'wav':
      return 'audio'
    case 'tar':
    case 'zip':
      return 'zip'
    case 'key':
    case 'ppt':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'pdf':
      return 'document'
    default:
      return null
  }
}

// get viewport height
// () -> num
exports.vh = vh
function vh() {
  return Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  )
}

// get viewport width
// () -> num
exports.vw = vw
function vw() {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
}

// compose class name based on supplied conditions
// (str|obj, obj?) -> str
exports.className = className
function className(root, classes) {
  if (typeof root === 'object') {
    classes = root
    root = ''
  }

  return Object.keys(classes)
    .reduce((str, key) => {
      if (!classes[key]) return str
      return str + ' ' + key
    }, root)
    .trim()
}

// detect if meta key was pressed on event
// obj -> bool
exports.metaKey = metaKey
function metaKey(e) {
  if (e.button && e.button !== 0) return true
  return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
}

// pick props from object
// (obj, arr|...str) -> obj
exports.pluck = pluck
function pluck(src, ...keys) {
  keys = Array.isArray(keys[0]) ? keys[0] : keys
  return keys.reduce(function (obj, key) {
    if (src[key]) obj[key] = src[key]
    return obj
  }, {})
}

// compose reduce middlewares that boils down list ot truthy values
// (arr, ...fn) -> arr
exports.reduce = reduce
function reduce(list) {
  const middleware = Array.prototype.slice.call(arguments, 1)
  return list.reduce(function (result, initial, i, from) {
    const val = middleware.reduce((val, fn) => val && fn(val, i, from), initial)
    if (val) result.push(val)
    return result
  }, [])
}

const AUTO_TRANSFORM = /\?(?:.+)?auto=([^&]+)/
const COMPRESS = /compress,?/

// compose src attribute from url for a given size
// (str, num, obj?) -> str
exports.src = src
function src(uri, size, opts = {}) {
  uri = uri.replaceAll('?auto=format,compress', '')
  uri = uri.replaceAll('?auto=compress,format', '')
  uri = uri.replaceAll('?auto=format', '')
  uri = uri.replace(/,\s*$/, '')
  uri = uri.replaceAll('&rect', '?rect')

  let { transforms = 'c_fill,f_auto,q_auto', type = 'fetch' } = opts

  // apply default transforms
  if (!/c_/.test(transforms)) transforms += ',c_fill'
  if (!/f_/.test(transforms)) transforms += ',f_jpg'
  if (!/q_/.test(transforms)) transforms += ',q_auto'

  // trim prismic domain from uri
  if (AUTO_TRANSFORM.test(uri)) {
    uri = uri.replace(AUTO_TRANSFORM, (match) => match.replace(COMPRESS, ''))
  }

  return `/media/${type}/${transforms ? transforms + ',' : ''}w_${size}/${uri}`
}

// compose srcset attribute from url for given sizes
// (str, arr, obj?) -> str
exports.srcset = srcset
function srcset(uri, sizes, opts = {}) {
  if (AUTO_TRANSFORM.test(uri)) {
    uri = uri.replace(AUTO_TRANSFORM, (match) => match.replace(COMPRESS, ''))
  }

  return sizes
    .map(function (size) {
      opts = Object.assign({}, opts)
      if (Array.isArray(size)) {
        opts.transforms = opts.transforms
          ? size[1] + ',' + opts.transforms
          : size[1]
        size = size[0]
      }
      if (opts.aspect) {
        const height = `h_${Math.floor(size * opts.aspect)}`
        opts.transforms = opts.transforms
          ? `${opts.transforms},${height}`
          : height
      }

      return `${src(uri, size, opts)} ${size}w`
    })
    .join(',')
}

// get HH:mm timestamp from date
// Date -> str
exports.timestamp = timestamp
function timestamp(date) {
  return [
    ('0' + date.getHours()).substr(-2),
    ('0' + date.getMinutes()).substr(-2)
  ].join('.')
}

// create placeholder loading text of given length
// (num, bool?) -> Element
exports.loader = loader
function loader(length, light = false) {
  const content = '⏳'
    .repeat(length)
    .split('')
    .reduce(function (str, char) {
      if (Math.random() > 0.7) char += ' '
      return str + char
    }, '')
  return html`
    <span class="u-loading${light ? 'Light' : ''}">${content}</span>
  `
}

// custom error with HTTP status code
// (num, Error?) -> HTTPError
exports.HTTPError = HTTPError
function HTTPError(status, err) {
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

const MEMO = new LRU()

// momize function
// (fn, arr) -> any
exports.memo = memo
function memo(fn, keys) {
  assert(
    Array.isArray(keys) && keys.length,
    'memo: keys should be non-empty array'
  )
  const key = JSON.stringify(keys)
  let result = MEMO.get(key)
  if (!result) {
    result = fn.apply(undefined, keys)
    MEMO.set(key, result)
  }
  return result
}

// render richtext as string
// (arr?) -> str
exports.asText = function (value) {
  return value == null ? '' : asText(value)
}
