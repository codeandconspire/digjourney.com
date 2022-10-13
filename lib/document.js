const hyperstream = require('hstream')

module.exports = document

function document() {
  return hyperstream({
    'meta[name="viewport"]': {
      content: 'width=device-width, initial-scale=1, viewport-fit=cover'
    }
  })
}
