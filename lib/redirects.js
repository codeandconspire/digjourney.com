/**
 * Legacy URL redirects.
 * Consumed both by the local build-time server (server.js, for parity when
 * crawling) and by bin/prerender.js, which writes them to out/_redirects so
 * Cloudflare Pages serves them statically.
 */
module.exports = {
  '/contact': '/kontakt',
  '/om-boken': '/boken-att-leda-digital-transformation',
  '/om-boken/bestall-boken-att-leda-digital-transformation/':
    '/boken-att-leda-digital-transformation',
  '/organisation': 'radgivning',
  '/vad-vi-gor': '/',
  '/en': '/',
  '/tag/konsultutbildning/': '/utbildning',
  '/tag/organisationsstruktur/': '/',
  '/about-methodology': '/metodik-arbetssatt',
  '/jul': '/boken-att-leda-digital-transformation',
  '/tag': '/insikter',
  '/finally-the-book-leading-digital-transformation-is-out-and-we-need-your-help':
    'boken-att-leda-digital-transformation',
  '/vilken-nytta-ger-egentligen-var-utbildning-att-leda-digital-transformation-som-konsult':
    'kunder',
  '/artiklar-och-inspiration': '/insikter',
  '/transformationday-23rd-of-april-2018': '/',
  '/larande-organisation': '/utbildning',
  '/digital-konkurrenskraft':
    '/forelasning/digital-transformationsplan-som-framtidssakrar-din-verksamhet',
  '/digital-transformation': '/radgivning',
  '/forelasningar-workshops': '/forelasningar',
  '/forvandlingen': '/',
  '/innovation': '/radgivning',
  '/om-digjourney': '/vision',
  '/omrostning-vilken-logga-tycker-du-att-vi-skall-ha': '/',
  '/the-digital-maturity-matrix-digital-transformation-with-maximum-roi':
    '/kontakt',
  '/undersokningar': '/',
  '/verktyg-for-digital-transformation': '/digitalt-mognadstest',
  '/fran-gammelgadda-till-mort-branschanalys-av-media-i-sagoform/':
    '/insikter/fran-gammelgadda-till-mort--branschanalys-av-media',
  '/skaraborgsdagen-30-januari-fokuserar-pa-kompetensforsorjning-och-digitalisering':
    '/insikter/skaraborgsdagen-30-januari-fokuserar-pa-kompetensforsorjning',
  '/certifieringskurs-i-ramverket-for-att-leda-digital-transformation-genomfors-i-umea':
    '/insikter/certifieringskurs-i-ramverket-for-att-leda-digital',
  '/yeah-our-tranformationday-at-internetdagarna-a-success':
    '/insikter/our-tranformationdaydigitalization--sustainability',
  '/future-proof-maturity-matrix-en-transformationsmetodik-som-kombinerar-digitalisering-och-hallbarhet':
    '/insikter/future-proof-maturity-matrix---en-transformationsmetodik',
  '/digitalisering-hallbarhet-framtidssaker-digjourney-kor-spar-pa-internetdagarna':
    '/insikter/digitalisering--hallbarhet--framtidssaker---digjourney',
  '/142-changemakers-ar-nu-certifierade-i-digital-transformation-framework':
    '/insikter/142-changemakers-ar-nu-certifierade-i-digital-transformation',
  '/innoday-2019-en-grym-dag-i-transformationens-tecken':
    '/insikter/innoday-2019---en-grym-dag-i-transformationens-tecken',
  '/leading-digital-transformation-finalist-i-business-books-awards':
    '/insikter/boken-leading-digital-transformation--finalist-i-business',
  '/sokes-entreprenoriell-hallbarhetsexpert-med-digitala-fardigheter':
    '/insikter/sokes--entreprenoriell-hallbarhetsexpert-med-digitala',
  '/innovationens-manga-ansikten': '/',
  '/den-digitala-revolutionen-kan-drastiskt-forbattra-klimatarbetet':
    '/insikter/den-digitala-revolutionen-kan-drastiskt-forbattra-klimatarbetet',
  '/dagensrosling': '/insikter/dagensrosling'
}
