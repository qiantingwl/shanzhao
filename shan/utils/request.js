import { BASE_URL, UPLOAD_URL } from './config'

function buildUrl(url, params) {
  let fullUrl = BASE_URL + url
  if (params && Object.keys(params).length) {
    const qs = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
    if (qs) fullUrl += `?${qs}`
  }
  return fullUrl
}

function parseResponse(data) {
  if (typeof data !== 'string') return data || {}
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

function pickMessage(data, fallback) {
  const result = parseResponse(data)
  const msg =
    result.msg ||
    result.message ||
    (result.data && (result.data.msg || result.data.message))
  return Array.isArray(msg) ? msg.join('，') : (msg || fallback)
}

export function request(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data,
      params,
      auth = true
    } = options

    const header = { 'Content-Type': 'application/json' }
    if (auth) {
      const token = uni.getStorageSync('token')
      if (token) header.Authorization = `Bearer ${token}`
    }

    uni.request({
      url: buildUrl(url, params),
      method,
      data,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.showToast({ title: '请先登录', icon: 'none' })
          reject(new Error('未授权'))
          return
        }

        const msg = pickMessage(res.data, `请求失败(${res.statusCode})`)
        uni.showToast({ title: msg, icon: 'none' })
        reject(new Error(msg))
      },
      fail(err) {
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: UPLOAD_URL,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        if (res.statusCode === 201 || res.statusCode === 200) {
          const result = parseResponse(res.data)
          resolve(result.data || result)
          return
        }

        const msg = pickMessage(res.data, `上传失败(${res.statusCode})`)
        uni.showToast({ title: msg, icon: 'none' })
        const error = new Error(msg)
        error.toastShown = true
        reject(error)
      },
      fail(err) {
        const msg = err && err.errMsg ? err.errMsg : '上传失败，请重试'
        uni.showToast({ title: msg, icon: 'none' })
        const error = new Error(msg)
        error.toastShown = true
        reject(error)
      }
    })
  })
}
