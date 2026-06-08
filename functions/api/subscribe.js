/**
 * Newsletter signup (Cloudflare Pages Function).
 *
 * Ports the `/api/subscribe` Koa route from server.js: forward the email to
 * HubSpot (create contact + subscribe), with a honeypot `name` field for spam.
 * Reads HUBSPOT_API_KEY / HUBSPOT_SUBSCRIPTION_ID from the Pages environment.
 */

export async function onRequestPost(context) {
  const { request, env } = context

  let body = {}
  const type = request.headers.get('content-type') || ''
  try {
    if (type.includes('application/json')) {
      body = await request.json()
    } else {
      const form = await request.formData()
      body = Object.fromEntries(form.entries())
    }
  } catch (err) {
    body = {}
  }

  const { email, name } = body
  const wantsHtml = (request.headers.get('accept') || '').includes('text/html')

  const ok = () => (wantsHtml ? redirectBack(request) : json({}))

  // Honeypot: silently accept but do nothing if filled
  if (typeof name === 'string' && name.trim() !== '') return ok()

  if (!email) {
    return wantsHtml
      ? redirectBack(request)
      : json({ error: 'Email is required' }, 400)
  }

  try {
    // Try to create a new contact, ignore errors (may already exist)
    await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.HUBSPOT_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ properties: { email } })
    })

    // Subscribe the contact
    await fetch(
      'https://api.hubapi.com/communication-preferences/v3/subscribe',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.HUBSPOT_API_KEY}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          emailAddress: email,
          legalBasis: 'CONSENT_WITH_NOTICE',
          subscriptionId: env.HUBSPOT_SUBSCRIPTION_ID,
          legalBasisExplanation:
            'User opted in through the newsletter signup form.'
        })
      }
    )

    return ok()
  } catch (err) {
    return wantsHtml
      ? redirectBack(request)
      : json({ error: 'Could not subscribe' }, 400)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'private, no-cache'
    }
  })
}

function redirectBack(request) {
  const back = request.headers.get('referer') || '/'
  return new Response(null, {
    status: 303,
    headers: { location: back, 'cache-control': 'private, no-cache' }
  })
}
