import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchNotifications,
  markNotificationRead as markReadApi,
  markAllNotificationsRead as markAllReadApi,
} from '../services/notificationService.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 30000; // simple polling keeps the bell fresh without a websocket server

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: 10 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // non-critical: the bell just won't update this cycle
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    if (isAuthenticated) {
      pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, refresh]);

  const markAsRead = useCallback(async (id) => {
    try {
      await markReadApi(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore — next poll will reconcile state
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore — next poll will reconcile state
    }
  }, []);

  const value = { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
