import { wxLogin } from './api'

let loginPromise = null

export function getStoredUser() {
  const user = uni.getStorageSync('userInfo')
  if (!user) return null
  try {
    return typeof user === 'string' ? JSON.parse(user) : user
  } catch {
    return null
  }
}

export function hasToken() {
  return !!uni.getStorageSync('token')
}

function wxCodeLogin() {
  if (loginPromise) return loginPromise
  loginPromise = new Promise((resolve, reject) => {
    uni.login({
      success: async (loginRes) => {
        try {
          const res = await wxLogin(loginRes.code)
          const { token, user } = res.data || res
          uni.setStorageSync('token', token)
          uni.setStorageSync('userInfo', JSON.stringify(user))
          resolve(user)
        } catch (error) {
          reject(error)
        } finally {
          loginPromise = null
        }
      },
      fail: (error) => {
        loginPromise = null
        reject(error)
      }
    })
  })
  return loginPromise
}

export function ensureLogin(options = {}) {
  if (hasToken()) return Promise.resolve(getStoredUser())

  const title = options.title || '需要登录'
  const content = options.content || '登录后即可继续操作'
  const confirmText = options.confirmText || '微信登录'

  return new Promise((resolve, reject) => {
    uni.showModal({
      title,
      content,
      showCancel: true,
      cancelText: '取消',
      confirmText,
      success: async (modalRes) => {
        if (!modalRes.confirm) {
          const error = new Error('用户取消登录')
          error.silent = true
          reject(error)
          return
        }

        uni.showLoading({ title: '登录中...' })
        try {
          const user = await wxCodeLogin()
          uni.hideLoading()
          uni.showToast({ title: '登录成功', icon: 'success' })
          resolve(user)
        } catch (error) {
          uni.hideLoading()
          if (!error.toastShown) {
            uni.showToast({ title: '登录失败，请重试', icon: 'none', duration: 3000 })
          }
          error.toastShown = true
          reject(error)
        }
      },
      fail: reject
    })
  })
}
