import { get, post } from './api'

export interface NotificationItem {
  id: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string
  body: string
  actionUrl?: string | null
  metadataJson?: string | null
  readAt?: string | null
  createdAt: string
}

export interface NotificationPageResponse {
  page: number
  size: number
  totalElements: number
  totalPages: number
  unreadCount: number
  readCount: number
  totalCount: number
  items: NotificationItem[]
}

export interface NotificationStatsResponse {
  unread: number
  read: number
  total: number
}

export const NotificationService = {
  list: (page = 0, size = 10, estado: 'total' | 'unread' | 'read' = 'total') =>
    get<NotificationPageResponse>(`/api/notifications?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}&estado=${encodeURIComponent(estado)}`),
  stats: () =>
    get<NotificationStatsResponse>('/api/notifications/stats'),
  markAsRead: (id: string) =>
    post<void>(`/api/notifications/${encodeURIComponent(id)}/read`),
  markAllAsRead: () =>
    post<{ updated: number }>('/api/notifications/read-all')
}
