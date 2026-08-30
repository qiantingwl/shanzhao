import { request } from '../request';

export interface FlashItem {
  id: string;
  authorId: string;
  filePath: string;
  fileThumb: string;
  fileMasai?: string;
  fileShare?: string;
  fileOrigin?: string;
  originFlag: string;
  screenFlag: string;
  iosFlag: string;
  pcFlag: string;
  shareBlockFlag: string;
  adFlag: string;
  maxNum: number;
  maxSec: number;
  status: string;
  delFlag: string;
  createdAt: string;
  author?: { id: string; nickname: string; openid: string };
}

export interface FlashRecord {
  id: string;
  flashId: string;
  userId: string;
  recordMode: string;
  viewSec: number;
  screenFlag: string;
  createdAt: string;
  user?: { id: string; nickname: string; openid: string };
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchFlashList(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}) {
  return request<PageResult<FlashItem>>({ url: '/flash', params });
}

export function fetchUpdateFlashStatus(id: string, status: string) {
  return request({ url: `/flash/${id}/status`, method: 'patch', data: { status } });
}

export function fetchDeleteFlash(id: string) {
  return request({ url: `/flash/${id}`, method: 'delete' });
}

export function fetchFlashRecords(flashId: string, params: { page?: number; pageSize?: number }) {
  return request<{ list: FlashRecord[]; total: number }>({
    url: `/flash/${flashId}/records`,
    params
  });
}
