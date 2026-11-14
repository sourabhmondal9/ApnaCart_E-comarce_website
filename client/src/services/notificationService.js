import api from './api.js';

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data.data; // { notifications, unreadCount, pagination }
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data.notification;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};
