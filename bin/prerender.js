#!/usr/bin/env node
/**
 * Static prerender for Cloudflare Pages.
 *
 * Jalla has no static-export mode, so we boot the real production server
 * (`node server.js` in serve mode) and crawl every route, snapshotting the
 * server-rendered HTML — which already contains `window.initialState`, the
 * (unhashed) bundle URLs and meta tags, so the Choo app hydrates client-side.
 *
 * Output layout (written to ./out by default):
 *   out/index.html, out/<path>/index.html   prerendered pages
 *   out/<assets…>                            copied from dist/public
 *   out/robots.txt, out/sw.js                fetched from the server
 *   out/_redirects, out/_headers             Cloudflare Pages config
 *
 * Requires `npm run build` to have produced dist/ first.
 */

const fs = require('fs/promises')
const path = require('path')
const { spawn } = require('child_process')
const prismic = require('@prismicio/client')

const getAllRoutes = require('wayfarer/get-all-routes')
const resolveRoute = require('../lib/resolve-route')
const routeMap = require('../lib/redirects')
const { resolve: resolveDoc } = require('../components/base')

const REPOSITORY = 'digjourney'
const PORT = Number(process.env.PRERENDER_PORT || 8081)
const HOST = process.env.HOST || 'digjourney.com'
const ORIGIN = `http://localhost:${PORT}`
const OUT = path.resolve(process.cwd(), process.env.PRERENDER_OUT || 'out')
const ROOT = path.resolve(__dirname, '..')
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 8)
const EXTRA_FILES = ['/robots.txt', '/sw.js']

main().catch((err) => {
  console.error('\nPrerender failed:', err && err.stack ? err.stack : err)
  process.exit(1)
})

async function main() {
  await fs.rm(OUT, { recursive: true, force: true })
  await fs.mkdir(OUT, { recursive: true })

  console.log('Enumerating routes…')
  const urls = await enumerateUrls()
  console.log(`Found ${urls.length} unique URLs to prerender`)

  const server = await startServer()
  try {
    const failures = await crawl(urls)
    await snapshotExtras()
    await copyAssets()
    await writeRedirects()
    await writeHeaders()

    if (failures.length) {
      const fatal = failures.filter((f) => f.fatal)
      console.warn(`\n${failures.length} URL(s) had issues:`)
      for (const f of failures) console.warn(`  ${f.status}  ${f.url}`)
      if (fatal.length) {
        throw new Error(`${fatal.length} URL(s) returned 5xx / failed to fetch`)
      }
    }
  } finally {
    server.kill('SIGTERM')
  }

  console.log(`\nDone. Static site written to ${OUT}`)
}

/**
 * Build the full URL list: every route registered on the Choo app, with
 * parameterised / catch-all routes expanded to concrete URLs via Prismic
 * (reusing lib/resolve-route — the same enumeration the old purge used).
 */
async function enumerateUrls() {
  const app = require('../index.js')
  const routes = Object.keys(getAllRoutes(app.router.router))

  // wayfarer represents the catch-all ('/*') as '/:'
  const isDynamic = (route) => /\/:/.test(route)
  const all = routes.filter((route) => !isDynamic(route))

  // Resolve the dynamic document types from Prismic in parallel.
  const expanded = await Promise.all(
    routes
      .filter(isDynamic)
      .map((route) => promisifyResolve(route === '/:' ? '/*' : route))
  )
  for (const urls of expanded) {
    if (Array.isArray(urls)) all.push(...urls)
  }

  return [...new Set(all.filter(Boolean))]
}

function promisifyResolve(route) {
  return new Promise((resolve, reject) => {
    resolveRoute(route, (err, urls) => (err ? reject(err) : resolve(urls)))
  })
}

async function startServer() {
  console.log(`Starting build server on ${ORIGIN}…`)
  const child = spawn('node', [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      HEROKU: '1', // jalla serve mode: use prebuilt dist/, no file watching
      NODE_ENV: 'production',
      HOST,
      PORT: String(PORT)
    },
    stdio: ['ignore', 'inherit', 'inherit']
  })

  child.on('exit', (code) => {
    if (code) console.error(`Build server exited early with code ${code}`)
  })

  await waitForServer()
  return child
}

async function waitForServer(timeout = 60000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const res = await fetch(ORIGIN + '/', { redirect: 'manual' })
      if (res.status > 0) return
    } catch (err) {
      // not up yet
    }
    await sleep(300)
  }
  throw new Error('Build server did not become reachable in time')
}

async function crawl(urls) {
  const failures = []
  let done = 0
  await pool(urls, CONCURRENCY, async (url) => {
    const result = await fetchPage(url)
    done++
    if (result.ok) {
      await writeFile(urlToFile(url), result.body)
      if (done % 25 === 0) console.log(`  …${done}/${urls.length}`)
    } else {
      failures.push(result)
    }
  })
  console.log(`Crawled ${done} pages`)
  return failures
}

async function fetchPage(url, attempt = 1) {
  try {
    const res = await fetch(ORIGIN + url, { redirect: 'manual' })
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, url, body: await res.text() }
    }
    if (res.status >= 500 && attempt < 3) {
      await sleep(500 * attempt)
      return fetchPage(url, attempt + 1)
    }
    // 3xx/4xx are non-fatal (redirected or removed); 5xx fails the build
    return { ok: false, url, status: res.status, fatal: res.status >= 500 }
  } catch (err) {
    if (attempt < 3) {
      await sleep(500 * attempt)
      return fetchPage(url, attempt + 1)
    }
    return { ok: false, url, status: `ERR ${err.message}`, fatal: true }
  }
}

async function snapshotExtras() {
  for (const file of EXTRA_FILES) {
    try {
      const res = await fetch(ORIGIN + file, { redirect: 'manual' })
      if (res.status >= 200 && res.status < 300) {
        await writeFile(file.replace(/^\//, ''), await res.text())
        console.log(`Saved ${file}`)
      } else {
        console.warn(`Skipped ${file} (status ${res.status})`)
      }
    } catch (err) {
      console.warn(`Skipped ${file} (${err.message})`)
    }
  }
}

async function copyAssets() {
  const src = path.join(ROOT, 'dist', 'public')
  console.log('Copying static assets from dist/public…')
  // Skip source maps — no need to ship/upload them to production.
  await fs.cp(src, OUT, {
    recursive: true,
    filter: (s) => !s.endsWith('.map')
  })
}

async function writeRedirects() {
  const lines = []

  // Legacy redirects (server.js matched these with an optional trailing slash)
  for (const [from, to] of Object.entries(routeMap)) {
    const base = from.replace(/\/$/, '') || '/'
    const dest = to.startsWith('/') ? to : `/${to}`
    lines.push(`${base} ${dest} 301`)
    if (base !== '/') lines.push(`${base}/ ${dest} 301`)
  }

  // Parent-aware page redirects: a page with a parent lives at /:parent/:uid,
  // so redirect the bare /:uid to its canonical URL (was server.js /:slug).
  for (const { uid, url } of await pagesWithParents()) {
    lines.push(`/${uid} ${url} 301`)
  }

  await writeFile('_redirects', lines.join('\n') + '\n')
  console.log(`Wrote _redirects (${lines.length} rules)`)
}

async function pagesWithParents() {
  const endpoint = prismic.getEndpoint(REPOSITORY)
  const client = prismic.createClient(endpoint, { fetch })
  const docs = await client.getAllByType('page', { pageSize: 100 })
  return docs
    .map((doc) => ({ uid: doc.uid, url: resolveDoc(doc) }))
    .filter(({ uid, url }) => uid && url && url !== `/${uid}`)
}

async function writeHeaders() {
  // Bundles/fonts are content-hashed (e.g. /987c….bundle.js) → immutable.
  const content = `# Content-hashed bundles, styles and fonts are immutable
/*.js
  Cache-Control: public, max-age=31536000, immutable
/*.css
  Cache-Control: public, max-age=31536000, immutable
/*.woff
  Cache-Control: public, max-age=31536000, immutable
/*.woff2
  Cache-Control: public, max-age=31536000, immutable
/components/*
  Cache-Control: public, max-age=31536000, immutable
# Edge-transformed images (Cloudflare Image Transformations)
/media/*
  Cache-Control: public, max-age=31536000
`
  await writeFile('_headers', content)
  console.log('Wrote _headers')
}

// --- helpers ---------------------------------------------------------------

function urlToFile(url) {
  const clean = url.split('?')[0].replace(/^\//, '').replace(/\/$/, '')
  return clean === '' ? 'index.html' : path.join(clean, 'index.html')
}

async function writeFile(relPath, body) {
  const full = path.join(OUT, relPath)
  await fs.mkdir(path.dirname(full), { recursive: true })
  await fs.writeFile(full, body)
}

async function pool(items, size, worker) {
  const queue = items.slice()
  const runners = Array.from({ length: Math.min(size, queue.length) }, run)
  await Promise.all(runners)
  async function run() {
    while (queue.length) await worker(queue.shift())
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
