import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ClipboardList, ArrowLeft } from 'lucide-react';

const AdminLayout = () => (
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
        <NavLink to="/" className="admin-back-link">
          <ArrowLeft size={18} aria-hidden="true" /> Back to store
        </NavLink>
      </nav>
    </aside>
    <main className="admin-content">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
