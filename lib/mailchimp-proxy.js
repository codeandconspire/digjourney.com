module.exports = middleware

// proxy requests through mailchimp endpoint
// (obj, str) -> Promise
async function middleware(fields, url) {
  const data = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) {
    data.append(key, value)
  }

  const body = data.toString()

  const req = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  return req.text()
}
