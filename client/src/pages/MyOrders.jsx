import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyOrders } from '../services/orderService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const statusClass = (status) => {
  const map = {
    Placed: 'badge-info',
    Confirmed: 'badge-info',
    Shipped: 'badge-warning',
    Delivered: 'badge-success',
    Cancelled: 'badge-danger',
  };
  return map[status] || 'badge-info';
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p>You haven&apos;t placed any orders yet.</p>
        <Link to="/products" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <Link to={`/my-orders/${order._id}`} key={order._id} className="order-row">
            <div>
              <p className="order-id">Order #{order._id.slice(-8).toUpperCase()}</p>
              <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`badge ${statusClass(order.orderStatus)}`}>{order.orderStatus}</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
