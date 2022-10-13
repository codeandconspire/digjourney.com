/* global gtag */

module.exports = tracking

function tracking(state, emitter) {
  if (typeof window === 'undefined') return

  let href = state.href
  emitter.on('meta', function (data) {
    const _hsq = window._hsq || []
    _hsq.push(['setPath', href])
    _hsq.push(['trackPageView'])

    if (typeof gtag !== 'function') return
    if (href === state.href || !data.title) return
    href = state.href
    gtag('config', 'UA-46200713-1', {
      page_title: data.title,
      page_path: href
    })
  })

  emitter.on('track', function (action, data) {
    const _hsq = window._hsq || []
    _hsq.push([action, data])

    if (typeof gtag !== 'function') return
    gtag.apply(undefined, ['event', action, data].filter(Boolean))
  })
}
