import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadNotificationCount();
      // Backend returns { count: N } directly — no success wrapper
      const raw = response as unknown as { count?: number };
      setUnreadCount(typeof raw.count === 'number' ? raw.count : 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadMessageCount();
      const raw = response as unknown as { count?: number };
      setUnreadMessageCount(typeof raw.count === 'number' ? raw.count : 0);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  }, []);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications();
      // Backend returns { results: [...], count: N } directly — no success wrapper
      const raw = response as unknown as { results?: unknown[] };
      const items: Notification[] = Array.isArray(raw.results)
        ? raw.results.filter((i): i is Notification => i !== null && typeof i === 'object')
        : [];
      setNotifications(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, is_read: true } : n)
      );
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Fetch both counts on mount, poll every 30 s, and re-fetch on demand events
  useEffect(() => {
    void fetchUnreadCount();
    void fetchUnreadMessageCount();

    const interval = setInterval(() => {
      void fetchUnreadCount();
      void fetchUnreadMessageCount();
    }, 30000);

    // Custom event fired by Messages page after marking a thread as read
    const onMessageRead = () => { void fetchUnreadMessageCount(); };
    window.addEventListener('messages-thread-read', onMessageRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-thread-read', onMessageRead);
    };
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
