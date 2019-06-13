module.exports = catchall

// custom view matching
// (obj, fn) -> Element
function catchall (state, emit) {
  var segments = state.href.split('/').slice(1)
  var slug = state.params.slug || segments[segments.length - 1]

  if (segments.length > 2) {
    let view = require('./404')
    return view(state, emit)
  }

  if (segments.length === 2) {
    state.params.slug = slug
    state.params.type = segments[0] === 'discover' ? 'article' : 'page'
    let view = require('./page')
    return view(state, emit)
  }

  return state.prismic.getByUID('landing', slug, function (err, doc) {
    if (!err) {
      let view = require('./page')
      state.params.slug = slug
      state.params.type = 'landing'
      return view(state, emit)
    }

    return state.prismic.getByUID('page', slug, function (err, doc) {
      var view = err ? require('./404') : require('./page')
      state.params.slug = slug
      state.params.type = 'page'
      return view(state, emit)
    })
  })
}
