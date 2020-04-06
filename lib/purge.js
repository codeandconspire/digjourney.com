var cccpurge = require('cccpurge')
var resolveRoute = require('./resolve-route')

module.exports = purge

function purge (entry, urls, callback = Function.prototype) {
  if (typeof urls === 'function') {
    callback = urls
    urls = []
  }

  cccpurge(require(entry), {
    urls: urls,
    resolve: resolveRoute,
    root: `https://${process.env.HOST}`,
    zone: process.env.CLOUDFLARE_ZONE,
    email: process.env.CLOUDFLARE_EMAIL,
    key: process.env.CLOUDFLARE_KEY
  }, callback)
}
