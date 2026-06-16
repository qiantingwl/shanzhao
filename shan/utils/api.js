import { request, uploadImage } from './request'

export function wxLogin(code) {
  return request({ url: '/api/mp/auth/login', method: 'POST', data: { code }, auth: false })
}

export function getPublicConfig() {
  return request({ url: '/api/mp/config', auth: false })
}

export function getHelpList() {
  return request({ url: '/api/mp/help', auth: false })
}

export function getBannedUsers(page = 1, pageSize = 20) {
  return request({ url: '/api/mp/user-ban', params: { page, pageSize }, auth: false })
}

export function adUnlock(flashId) {
  return request({ url: `/api/mp/flash/${flashId}/ad-unlock`, method: 'POST' })
}

export function recordShare(flashId) {
  return request({ url: `/api/mp/flash/${flashId}/share`, method: 'POST' })
}

export { uploadImage }

export function createFlash(dto) {
  return request({ url: '/api/mp/flash', method: 'POST', data: dto })
}

export function getMyFlashList(page = 1, pageSize = 20) {
  return request({ url: '/api/mp/flash', params: { page, pageSize } })
}

export function getFlashDetail(id) {
  return request({ url: `/api/mp/flash/${id}` })
}

export function deleteFlash(id) {
  return request({ url: `/api/mp/flash/${id}`, method: 'DELETE' })
}

export function revokeFlash(id) {
  return request({ url: `/api/mp/flash/${id}/revoke`, method: 'PATCH' })
}

export function getFlashRecords(id, page = 1, pageSize = 20) {
  return request({ url: `/api/mp/flash/${id}/records`, params: { page, pageSize } })
}

export function getFlashForViewer(id) {
  return request({ url: `/api/mp/flash/${id}/viewer` })
}

export function recordView(id, dto) {
  return request({ url: `/api/mp/flash/${id}/view`, method: 'POST', data: dto })
}

export function getRemain(id) {
  return request({ url: `/api/mp/flash/${id}/remain` })
}

export function updateProfile(dto) {
  return request({ url: '/api/mp/user/profile', method: 'PATCH', data: dto })
}
