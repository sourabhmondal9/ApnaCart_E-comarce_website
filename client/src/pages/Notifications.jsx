import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { fetchNotifications, deleteNotification } from '../services/notificationService.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Notifications = () => {
  const { markAsRead, markAllAsRead, refresh } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications({ limit: 50 });
      setNotifications(data.notifications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
      setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item)));
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="empty-state">You have no notifications yet.</p>
      ) : (
        <div className="notification-full-list">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notification-full-item ${n.isRead ? '' : 'notification-full-item-unread'}`}
              onClick={() => handleClick(n)}
            >
              <div className="notification-full-item-body">
                {n.order ? (
                  <Link to={`/my-orders/${n.order}`} className="notification-full-title">
                    {n.title}
                  </Link>
                ) : (
                  <p className="notification-full-title">{n.title}</p>
                )}
                <p className="notification-message">{n.message}</p>
                <p className="notification-time">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                className="btn btn-icon-danger"
                aria-label="Delete notification"
                disabled={busyId === n._id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n._id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
