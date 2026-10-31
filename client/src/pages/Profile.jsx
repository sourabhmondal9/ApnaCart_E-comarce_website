import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateProfile } from '../services/authService.js';

const Profile = () => {
  const { user, updateUserState } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const updated = await updateProfile({
        name: form.name,
        phone: form.phone || undefined,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
      });
      updateUserState(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.details ? err.details.join(', ') : err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>My Profile</h1>
        <p className="field-note">Email: {user?.email} (cannot be changed here)</p>
        {message && <p className={message.type === 'error' ? 'form-error' : 'form-success'}>{message.text}</p>}

        <label htmlFor="name">Full name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} />

        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" value={form.phone} onChange={handleChange} />

        <h2>Default Shipping Address</h2>
        <label htmlFor="street">Street</label>
        <input id="street" name="street" value={form.street} onChange={handleChange} />

        <label htmlFor="city">City</label>
        <input id="city" name="city" value={form.city} onChange={handleChange} />

        <label htmlFor="state">State</label>
        <input id="state" name="state" value={form.state} onChange={handleChange} />

        <label htmlFor="pincode">Pincode</label>
        <input id="pincode" name="pincode" value={form.pincode} onChange={handleChange} />

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
