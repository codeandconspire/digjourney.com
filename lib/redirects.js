var cors = require('@koa/cors')
var Router = require('@koa/router')
var compose = require('koa-compose')
var { resolve } = require('../components/base')

var TRAILING_SLASH = '(/)?'

var router = new Router({ strict: false })

// Todo: The redirects below should be handled by the DNS when possible
var routeMap = {
  // Pages
  '/test': '/',
  '/take-action': '/',
  '/anti-corruption': '/anti-corruption-policy',
  '/privacy': '/privacy-policy',
  '/resource-centre(.*)?': '/resources',
  '/media-centre(.*)?': '/resources',
  '/tell-everyone(.*)?': '/media',
  '/outcomes(.*)?': '/',
  '/radio-everyone-partners': 'http://www.project-everyone.org/radio-everyone/',
  '/cinema': 'https://www.youtube.com/watch?v=7V3eSHgMEFM',
  '/2015/09/29/download-the-global-goals-app': 'https://sdgsinaction.com/',
  '/now': 'https://sdgsinaction.com/',
  '/healthynothungry': '/healthy-not-hungry',
  '/leavenowomanbehind': '/leave-no-woman-or-girl-behind',
  '/dizzy-goals': '/news/gareth-bale-dizzy-goals',
  '/dizzygoalsgame': 'http://dizzygoalsgame.globalgoals.org/',
  '/goalkeepers/datareport(.*)?': 'https://datareport.goalkeepers.org/$1',
  '/datareport(.*)?': 'https://datareport.goalkeepers.org/$1',
  '/girls-progress': 'https://dayofthegirl.globalgoals.org/',
  '/join-the-movement-girls/': 'https://dayofthegirl.globalgoals.org/',
  '/dayofthegirl/': 'https://dayofthegirl.globalgoals.org/'
}

Object.keys(routeMap).forEach(route => {
  router.get(route + TRAILING_SLASH, cors({origin: '*'}), ctx => {
    ctx.status = 301;
    var path = ctx.params['0'] ? ctx.params['0'].replace(/^\//, '') : ''
    ctx.redirect(resolve(routeMap[route].replace('$1', path)))
  })
})

module.exports = compose([router.routes(), router.allowedMethods()])