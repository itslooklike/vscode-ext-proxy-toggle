export const EXT_ID = 'proxxy'
export const APP_NAME = 'Proxxy'
export const ACCENT_COLOR = '#FF2D55'

export const COMMANDS = {
  CLICK: `${EXT_ID}.click`,
  TOGGLE: `${EXT_ID}.toggle`,
  SET_ADDRESS: `${EXT_ID}.setAddress`,
} as const

export const CONFIG_KEYS = {
  CUSTOM_URL: 'customUrl',
  SAVED_URLS: 'savedUrls',
  HTTP_PROXY: 'http.proxy',
  HTTP_PROXY_SUPPORT: 'http.proxySupport',
  HTTP_SYSTEM_CERTIFICATES: 'http.systemCertificates',
} as const
