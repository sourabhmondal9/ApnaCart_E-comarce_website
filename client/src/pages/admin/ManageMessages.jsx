import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Mail, MailOpen } from 'lucide-react';
import { fetchContactMessages, setMessageResolved, deleteContactMessage } from '../../services/contactService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const STATUS_OPTIONS = [
  { value: '', label: 'All Messages' },
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
];

const ManageMessages = () => {
  const [messages, setMessages] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContactMessages({ limit: 100 });
      setMessages(data.messages);
      setUnresolvedCount(data.unresolvedCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleToggleResolved = async (msg) => {
    setBusyId(msg._id);
    try {
      const updated = await setMessageResolved(msg._id, !msg.isResolved);
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      setUnresolvedCount((prev) => prev + (updated.isResolved ? -1 : 1));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteContactMessage(id);
      setConfirmId(null);
      if (expandedId === id) setExpandedId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const visibleMessages = messages.filter((m) => {
    if (statusFilter === 'unresolved') return !m.isResolved;
    if (statusFilter === 'resolved') return m.isResolved;
    return true;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Contact Messages</h1>
        <div className="admin-page-header-actions">
          {unresolvedCount > 0 && (
            <span className="badge badge-warning">{unresolvedCount} unresolved</span>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleMessages.length === 0 ? (
        <p className="empty-state">No messages to show.</p>
      ) : (
        <div className="message-list">
          {visibleMessages.map((msg) => {
            const isExpanded = expandedId === msg._id;
            return (
              <div key={msg._id} className={`message-row ${msg.isResolved ? '' : 'message-row-unread'}`}>
                <button
                  type="button"
                  className="message-row-summary"
                  onClick={() => toggleExpand(msg._id)}
                  aria-expanded={isExpanded}
                >
                  {msg.isResolved ? (
                    <MailOpen size={18} aria-hidden="true" className="message-icon" />
                  ) : (
                    <Mail size={18} aria-hidden="true" className="message-icon" />
                  )}
                  <div className="message-row-info">
                    <p className="message-subject">{msg.subject}</p>
                    <p className="message-meta">
                      {msg.name} &lt;{msg.email}&gt; &middot; {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge ${msg.isResolved ? 'badge-success' : 'badge-warning'}`}>
                    {msg.isResolved ? 'Resolved' : 'Unresolved'}
                  </span>
                  {isExpanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                </button>

                {isExpanded && (
                  <div className="message-row-detail">
                    <p className="message-body">{msg.message}</p>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={busyId === msg._id}
                        onClick={() => handleToggleResolved(msg)}
                      >
                        {busyId === msg._id
                          ? 'Updating...'
                          : msg.isResolved
                          ? 'Mark as Unresolved'
                          : 'Mark as Resolved'}
                      </button>

                      {confirmId === msg._id ? (
                        <span className="confirm-inline">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyId === msg._id}
                            onClick={() => handleDelete(msg._id)}
                          >
                            {busyId === msg._id ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-icon-danger"
                          aria-label={`Delete message from ${msg.name}`}
                          onClick={() => setConfirmId(msg._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageMessages;
