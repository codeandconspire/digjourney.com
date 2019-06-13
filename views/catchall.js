module.exports = catchall

// custom view matching
// (obj, fn) -> Element
function catchall (state, emit) {
  var view
  var segments = state.href.split('/').slice(1)

  state.params.slug = segments[segments.length - 1]

  if (segments.length === 1) {
    view = require('./page')
    return view(state, emit)
  }

  if (segments.length === 2) {
    if (segments[0] === 'insikter') view = require('./post')
    else if (segments[0] === 'radgivning') view = require('./product')
    else if (segments[0] === 'utbildning') view = require('./training')
    else view = require('./page')
    return view(state, emit)
  }

  if (segments.length > 2) {
    view = require('./404')
    return view(state, emit)
  }
}
