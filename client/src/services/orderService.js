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

export const fetchDashboardStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data.data;
};
