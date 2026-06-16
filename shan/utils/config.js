// Backend API domain. Use HTTPS in production and do not add a trailing slash.
const DEFAULT_BASE_URL = 'https://zhao.qiantingwl.top'

export function getBaseUrl() {
  const runtimeUrl = uni.getStorageSync('api_base_url')
  return String(runtimeUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

export const BASE_URL = getBaseUrl()
export const UPLOAD_URL = `${BASE_URL}/api/mp/upload/image`
