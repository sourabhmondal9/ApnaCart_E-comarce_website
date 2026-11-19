import api from './api.js';

export const placeOrder = async (payload) => {
  const { data } = await api.post('/orders', payload);
  return data.data.order;
};

export const fetchMyOrders = async () => {
  const { data } = await api.get('/orders/my-orders');
  return data.data.orders;
};

export const fetchOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data.data.order;
};

export const fetchAllOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data.data; // { orders, pagination }
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data.data.order;
};

export const downloadInvoice = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const fetchDashboardStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data.data;
};
