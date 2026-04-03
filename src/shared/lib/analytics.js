const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()

let isInitialized = false
let lastTrackedPageView = {
  key: null,
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function isLocalHostname(hostname) {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) || hostname.endsWith('.local')
}

function isGaEnabled() {
  if (!isBrowser() || !GA_MEASUREMENT_ID) {
    return false
  }

  return import.meta.env.PROD && !isLocalHostname(window.location.hostname)
}

function injectGoogleTag() {
  const existingScript = document.querySelector(`script[data-ga-id="${GA_MEASUREMENT_ID}"]`)

  if (existingScript) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.dataset.gaId = GA_MEASUREMENT_ID
  document.head.appendChild(script)
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments)
  }
}

export function initializeAnalytics() {
  if (!isGaEnabled() || isInitialized) {
    return
  }

  injectGoogleTag()
  ensureGtag()

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  })

  isInitialized = true
}

export function trackPageView() {
  if (!isGaEnabled()) {
    return
  }

  initializeAnalytics()

  const pageKey = `${window.location.pathname}${window.location.search}`

  if (lastTrackedPageView.key === pageKey) {
    return
  }

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
  })

  lastTrackedPageView = {
    key: pageKey,
  }
}
