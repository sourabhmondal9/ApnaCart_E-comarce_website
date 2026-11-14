import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    setOpen(false);
  };

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="navbar-icon-link notification-bell-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && <span className="cart-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="link-button" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((n) => {
                const content = (
                  <>
                    <p className="notification-title">{n.title}</p>
                    <p className="notification-message">{n.message}</p>
                    <p className="notification-time">{timeAgo(n.createdAt)}</p>
                  </>
                );
                return (
                  <li key={n._id} className={`notification-item ${n.isRead ? '' : 'notification-item-unread'}`}>
                    {n.order ? (
                      <Link to={`/my-orders/${n.order}`} onClick={() => handleNotificationClick(n)}>
                        {content}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => handleNotificationClick(n)}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link to="/notifications" className="notification-view-all" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
