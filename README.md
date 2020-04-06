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

### Cloudflare ([link](https://www.cloudflare.com))
To ensure fast load times the site is hosted behind Cloudflare which caches
assets, images and HTML pages. The cached HTML pages are purged when changes are
published to Prismic or when deploying a new version of the page.

### Cloudinary ([link](https://cloudinary.com))
Editors are encouraged to upload high resolution images to Prismic. These images
are then transformed using Cloudinary before being served to the client. To keep
costs down the transformations are proxied through our own server which allows
us to cache the image with Cloudflare.

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
