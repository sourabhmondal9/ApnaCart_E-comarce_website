import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Tags, Users, ClipboardList, IndianRupee, Mail } from 'lucide-react';
import { fetchDashboardStats } from '../../services/orderService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
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

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, icon: Package },
    { label: 'Active Products', value: stats.activeProducts, icon: Package },
    { label: 'Categories', value: stats.totalCategories, icon: Tags },
    { label: 'Customers', value: stats.totalCustomers, icon: Users },
    { label: 'Total Orders', value: stats.totalOrders, icon: ClipboardList },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee },
  ];

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="stat-card-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={22} aria-hidden="true" />
            <div>
              <p className="stat-card-value">{value}</p>
              <p className="stat-card-label">{label}</p>
            </div>
          </div>
        ))}

        <Link to="/admin/messages" className="stat-card stat-card-link">
          <Mail size={22} aria-hidden="true" />
          <div>
            <p className="stat-card-value">{stats.unresolvedMessages}</p>
            <p className="stat-card-label">Unresolved Messages</p>
          </div>
        </Link>
      </div>

      <h2>Orders by Status</h2>
      <div className="status-chip-row">
        {Object.entries(stats.ordersByStatus || {}).map(([status, count]) => (
          <span key={status} className="badge badge-info">
            {status}: {count}
          </span>
        ))}
        {Object.keys(stats.ordersByStatus || {}).length === 0 && <p>No orders yet.</p>}
      </div>
    </div>
  );
};

export default AdminDashboard;
