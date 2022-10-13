module.exports = navigation

function navigation(state, emitter) {
  state.partial = null

  emitter.prependListener('pushState', onnavigate)
  emitter.prependListener('replaceState', onnavigate)

  emitter.prependListener('pushState', function (href, opts = {}) {
    state.partial = opts.partial || null
  })

  function onnavigate(href, opts = {}) {
    if (!opts.persistScroll) {
      window.requestAnimationFrame(function () {
        window.scrollTo(0, 0)
      })
    }
  }
}
