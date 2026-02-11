import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadNotificationCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        // Handle both array and paginated response formats
        const notificationData = Array.isArray(response.data) 
          ? response.data 
          : response.data.results || [];
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
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
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
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Fetch unread count on mount and set up polling
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
