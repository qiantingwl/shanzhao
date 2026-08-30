// Backend API domain. Use HTTPS in production and do not add a trailing slash.
const DEFAULT_BASE_URL = 'https://shan.pipix.cc'

export function getBaseUrl() {
  const runtimeUrl = uni.getStorageSync('api_base_url')
  return String(runtimeUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

export function getUploadUrl() {
  return `${getBaseUrl()}/api/mp/upload/image`
}
