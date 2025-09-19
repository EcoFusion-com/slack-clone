import { useState, useEffect } from 'react'
import { useApiClient } from '@/lib/api'
import { getWebSocketUrlFromEnv } from '@/lib/websocket-utils'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  entityId?: string
  entityType?: string
  createdAt: string
  readAt?: string
}

interface NotificationStats {
  total: number
  unread: number
  by_type: Record<string, number>
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, by_type: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiClient = useApiClient()

  const loadNotifications = async (page = 1, size = 20, unreadOnly = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.getNotifications(page, size, unreadOnly)
      setNotifications(response.notifications || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.getNotificationStats()
      setStats(response)
    } catch (err) {
      console.error('Failed to load notification stats:', err)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await apiClient.markNotificationsRead(notificationIds)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - notificationIds.length)
      }))
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
      throw err
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead()
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      )
      
      // Update stats
      setStats(prev => ({ ...prev, unread: 0 }))
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      throw err
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.deleteNotification(notificationId)
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: Math.max(0, prev.unread - 1)
      }))
    } catch (err) {
      console.error('Failed to delete notification:', err)
      throw err
    }
  }

  useEffect(() => {
    loadNotifications()
    loadStats()
  }, [])

  // WebSocket connection for real-time notifications - DISABLED for now
  // TODO: Implement proper WebSocket connection for notifications
  // The current WebSocket requires channel_id and token, which is complex for global notifications
  // For now, notifications will be fetched on page load and manual refresh

  return {
    notifications,
    stats,
    isLoading,
    error,
    loadNotifications,
    loadStats,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
