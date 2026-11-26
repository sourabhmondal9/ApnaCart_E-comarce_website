import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ClipboardList, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">Admin Panel</div>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <LayoutDashboard size={18} aria-hidden="true" /> Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Package size={18} aria-hidden="true" /> Products
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Tags size={18} aria-hidden="true" /> Categories
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ClipboardList size={18} aria-hidden="true" /> Orders
          </NavLink>
          <NavLink to="/admin/messages" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Mail size={18} aria-hidden="true" /> Messages
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          {user?.name && <p className="admin-sidebar-user">Signed in as {user.name}</p>}
          <button type="button" className="admin-logout-link" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
