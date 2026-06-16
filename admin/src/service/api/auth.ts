import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: {
      userName,
      password
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/auth/getUserInfo' });
}

/**
 * Refresh token — not implemented on this backend,
 * returns the same token to prevent infinite logout loop.
 *
 * @param _refreshToken Refresh token (unused)
 */
export function fetchRefreshToken(_refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/getUserInfo',
    method: 'get'
  });
}

