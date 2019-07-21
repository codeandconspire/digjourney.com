module.exports = ui

function ui (state, emitter) {
  state.ui = state.ui || {}
  state.ui.theme = 'blue'
  state.ui.isLoading = false
  state.ui.openNavigation = false

  emitter.on('theme', function (theme) {
    state.ui.theme = theme
  })

  emitter.on('header:toggle', function (toggle) {
    state.ui.openNavigation = toggle
    emitter.emit('render')
  })

  emitter.prependListener('navigate', function () {
    state.ui.openNavigation = false
  })

  var requests = 0
  emitter.on('prismic:request', start)
  emitter.on('prismic:response', end)
  emitter.on('prismic:error', end)

  function start () {
    requests++
    state.ui.isLoading = true
  }

  function end () {
    requests--
    state.ui.isLoading = requests > 0
  }
}
