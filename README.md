<div align="center">

# DigJourney

</div>

## Setup
The application has a few dependencies to external services. Environment
variables are used to configure these services. To set them up, copy
`.env.example` to `.env` and fill in the missing credentials.

## Dependencies
Most of the external dependencies should be easy enough to switch out would the
need arise.

### Prismic ([link](https://prismic.io))
The content is managed on Prismic and fetched while rendering pages.

### Cloudflare Pages ([link](https://www.cloudflare.com))
The site is hosted on Cloudflare Pages as a statically prerendered snapshot of
the app, with a few dynamic endpoints running as Pages Functions. Publishing in
Prismic triggers a rebuild + redeploy. See [MIGRATION.md](MIGRATION.md) for the
build pipeline, project settings and cutover steps.

### Cloudflare Images
Editors are encouraged to upload high resolution images to Prismic. These images
are resized and optimised on the fly via Cloudflare Image Transformations,
proxied through the `/media/*` Pages Function (functions/media/[[path]].js) and
cached on Cloudflare's edge.

## Development
Local development is configured by reading environment variables from the local `.env`
file. The environment variable `NODE_ENV` toggles application behaviors such as
minification and optimazations.

```bash
$ npm start
```

Setting `NODE_ENV=production` will enable minification and optimisations to the
application bundle. A build script is used for compiling the client assets.

```bash
$ NODE_ENV=production npm run build
$ NODE_ENV=production npm start
```

## License

[Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
