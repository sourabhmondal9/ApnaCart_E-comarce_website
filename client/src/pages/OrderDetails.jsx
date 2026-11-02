import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { fetchOrderById, downloadInvoice } from '../services/orderService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

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

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadInvoice(order._id);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!order) return <ErrorMessage message="Order not found." />;

  return (
    <div className="order-details-page">
      <Link to="/my-orders" className="back-link">
        &larr; Back to my orders
      </Link>

      {location.state?.justPlaced && (
        <div className="toast toast-success">Your order was placed successfully!</div>
      )}

      <div className="order-details-header">
        <div>
          <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="order-date">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <button type="button" className="btn btn-secondary" disabled={downloading} onClick={handleDownloadInvoice}>
          <Download size={16} aria-hidden="true" />
          {downloading ? 'Preparing invoice...' : 'Download Invoice'}
        </button>
      </div>
      {downloadError && <p className="form-error">{downloadError}</p>}

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
            Order status: <span className="badge badge-info">{order.orderStatus}</span>
          </p>
          <p>
            Payment: <span className="badge badge-info">{order.paymentStatus}</span> (
            {order.paymentMethod === 'Online' ? 'Paid Online via Razorpay' : 'Cash on Delivery'})
          </p>
          {order.paymentMethod === 'Online' && order.razorpayPaymentId && (
            <p className="field-note">Payment ID: {order.razorpayPaymentId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
