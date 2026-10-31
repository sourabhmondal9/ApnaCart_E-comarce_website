import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus } from '../../services/orderService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const ALL_STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

// Mirrors the backend's allowed transitions so the dropdown only ever
// offers a legal next status — but the backend re-validates regardless.
const NEXT_STATUS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllOrders(statusFilter ? { status: statusFilter } : {});
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus) return;
    setBusyId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Manage Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="empty-state">No orders found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const options = NEXT_STATUS[order.orderStatus] || [];
                return (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/admin/orders/${order._id}`}>#{order._id.slice(-8).toUpperCase()}</Link>
                    </td>
                    <td>{order.user?.name || 'Unknown'}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className="badge badge-info">{order.orderStatus}</span>
                    </td>
                    <td>
                      {options.length > 0 ? (
                        <select
                          defaultValue=""
                          disabled={busyId === order._id}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        >
                          <option value="" disabled>
                            {busyId === order._id ? 'Updating...' : 'Change to...'}
                          </option>
                          {options.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="field-note">No further actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
