import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderById, updateOrderStatus } from '../../services/orderService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const NEXT_STATUS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!order) return <ErrorMessage message="Order not found." />;

  const options = NEXT_STATUS[order.orderStatus] || [];

  return (
    <div>
      <Link to="/admin/orders" className="back-link">
        &larr; Back to orders
      </Link>
      <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
      <p className="order-date">Placed on {new Date(order.createdAt).toLocaleString()}</p>
      <p>
        Customer: {order.user?.name} ({order.user?.email})
      </p>

      <div className="order-details-grid">
        <div>
          <h2>Items</h2>
          {order.items.map((item, idx) => (
            <div key={idx} className="order-item-row">
              <span>
                {item.name} &times; {item.quantity}
              </span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="order-item-row order-item-total">
            <strong>Total</strong>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>
        </div>

        <div>
          <h2>Shipping Address</h2>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city}
            <br />
            {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </p>

          <h2>Status</h2>
          <p>
            Order: <span className="badge badge-info">{order.orderStatus}</span>
          </p>
          <p>
            Payment: <span className="badge badge-info">{order.paymentStatus}</span> (
            {order.paymentMethod === 'Online' ? 'Razorpay' : 'Cash on Delivery'})
          </p>
          {order.paymentMethod === 'Online' && order.razorpayPaymentId && (
            <p className="field-note">Razorpay Payment ID: {order.razorpayPaymentId}</p>
          )}

          {options.length > 0 && (
            <div className="form-actions">
              {options.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={s === 'Cancelled' ? 'btn btn-danger' : 'btn btn-primary'}
                  disabled={updating}
                  onClick={() => handleStatusChange(s)}
                >
                  Mark as {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
