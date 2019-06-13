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

  if (segments.length === 1) {
    let view = require('./page')
    return view(state, emit)
  }

  if (segments.length === 2) {
    state.params.slug = slug
    if (segments[0] === 'insikter') state.params.type = 'post'
    else if (segments[0] === 'radgivning') state.params.type = 'product'
    else if (segments[0] === 'utbildning') state.params.type = 'training'
    else state.params.type = 'page'
    let view = require('./page')
    return view(state, emit)
  }
}
