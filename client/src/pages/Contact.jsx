import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { sendContactMessage } from '../services/contactService.js';
import { isValidEmail, required } from '../utils/validators.js';

const emptyForm = { name: '', email: '', subject: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', text }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!required(form.name)) errs.name = 'Name is required';
    if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address';
    if (!required(form.subject)) errs.subject = 'Subject is required';
    if (!form.message.trim() || form.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!validate()) return;
    if (submitting) return; // guard against double submission

    setSubmitting(true);
    try {
      const res = await sendContactMessage(form);
      setResult({ type: 'success', text: res.message });
      setForm(emptyForm);
      setErrors({});
    } catch (err) {
      setResult({ type: 'error', text: err.details ? err.details.join(', ') : err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="static-page">
      <h1>Contact Us</h1>
      <p className="static-page-lead">
        Questions about an order, a product, or this project? Send us a message and we&apos;ll get
        back to you.
      </p>

      <div className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {result && (
            <p className={result.type === 'error' ? 'form-error' : 'form-success'} role="status">
              {result.text}
            </p>
          )}

          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
          {errors.name && <p className="field-error">{errors.name}</p>}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}

          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <p className="field-error">{errors.subject}</p>}

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={form.message}
            onChange={handleChange}
            aria-invalid={!!errors.message}
          />
          {errors.message && <p className="field-error">{errors.message}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="contact-info">
          <h2>Other Ways to Reach Us</h2>
          <p className="contact-info-row">
            <Mail size={18} aria-hidden="true" /> support@shopcom.example
          </p>
          <p className="contact-info-row">
            <Phone size={18} aria-hidden="true" /> +91 79081 61009
          </p>
          <p className="contact-info-row">
            <MapPin size={18} aria-hidden="true" /> MCA Department, IMS Business School College Campus, Kolkata, India
          </p>  
          <p className="field-note">
            This is a demo contact form for an academic project — messages are stored in the
            project&apos;s own database and reviewed by an administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
