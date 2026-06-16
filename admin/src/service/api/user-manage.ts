import { request } from '../request';

export interface UserItem {
  id: string;
  openid: string;
  nickname: string;
  avatarUrl: string;
  isBanned: boolean;
  createdAt: string;
}

export interface UserPageResult {
  list: UserItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchUserList(params: { page?: number; pageSize?: number; keyword?: string }) {
  return request<UserPageResult>({ url: '/user', params });
}

export function fetchBanUser(userId: string, banned: boolean) {
  return request({ url: `/user/${userId}/ban`, method: 'patch', data: { banned } });
}
