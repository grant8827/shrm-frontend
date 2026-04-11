import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const parseRecord = (value: unknown): Record<string, unknown> | null => {
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return null;
  };

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadNotificationCount();
      if (response.success && response.data) {
        const data = parseRecord(response.data);
        const count = data?.count;
        setUnreadCount(typeof count === 'number' ? count : 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadMessageCount();
      if (response.success && response.data) {
        const data = parseRecord(response.data);
        const count = data?.count;
        setUnreadMessageCount(typeof count === 'number' ? count : 0);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  }, []);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        const notificationData: Notification[] = [];

        if (Array.isArray(response.data)) {
          response.data.forEach((item) => {
            if (item && typeof item === 'object') {
              notificationData.push(item as Notification);
            }
          });
        } else {
          const data = parseRecord(response.data);
          const results = data?.results;
          if (Array.isArray(results)) {
            results.forEach((item) => {
              if (item && typeof item === 'object') {
                notificationData.push(item as Notification);
              }
            });
          }
        }

        setNotifications(notificationData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true, is_read: true } : n)
        );
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Fetch both counts on mount and set up polling
  useEffect(() => {
    void fetchUnreadCount();
    void fetchUnreadMessageCount();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      void fetchUnreadCount();
      void fetchUnreadMessageCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchUnreadMessageCount]);

  return {
    notifications,
    unreadCount,
    unreadMessageCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
