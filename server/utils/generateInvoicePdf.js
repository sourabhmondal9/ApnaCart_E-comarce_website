import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your logo - change this to where your logo actually is
const LOGO_PATH = path.join(__dirname, '../assets/logoNav.webp');

const formatINR = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

export const streamInvoicePdf = (order, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const orderNumber = order._id.toString().slice(-8).toUpperCase();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderNumber}.pdf"`);

  doc.pipe(res);

  // ----- Header with Logo -----
  const headerY = doc.y;

  if (fs.existsSync(LOGO_PATH)) {
    // Logo on left, 140px wide, keep aspect ratio
    doc.image(LOGO_PATH, 50, headerY, { width: 140 });
    // Tagline under logo
    doc.fontSize(9).fillColor('#64748b').text('ApnaCart — E-Commerce Invoice', 50, headerY + 48);
  } else {
    // Fallback if logo file is missing - keep old text
    doc.fontSize(20).fillColor('#1e293b').text('ApnaCart', { continued: false });
    doc.fontSize(9).fillColor('#64748b').text('ApnaCart — E-Commerce Invoice');
  }

  // Invoice title on right, aligned with logo
  doc.fontSize(16).fillColor('#1e293b').text('INVOICE', 50, headerY, { align: 'right' });
  doc.fontSize(10).fillColor('#64748b');
  doc.text(`Invoice No: INV-${orderNumber}`, { align: 'right' });
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
  doc.text(`Order Status: ${order.orderStatus}`, { align: 'right' });

  doc.moveDown(1.2);
  // Move cursor below whichever is taller - logo or invoice info
  doc.y = Math.max(doc.y, headerY + 70);

  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#e2e8f0')
    .stroke();
  doc.moveDown(0.8);

  // ----- Billing / Shipping details -----
  const colStartY = doc.y;
  doc.fontSize(11).fillColor('#1e293b').text('Billed To', 50, colStartY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(order.user?.name || 'N/A', 50);
  doc.text(order.user?.email || 'N/A', 50);

  doc.fontSize(11).fillColor('#1e293b').text('Shipping Address', 300, colStartY);
  doc.fontSize(10).fillColor('#334155');
  doc.text(order.shippingAddress.street, 300);
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`, 300);
  doc.text(order.shippingAddress.pincode, 300);

  doc.moveDown(2);

  // ----- Items table -----
  const tableTop = doc.y;
  const col = { name: 50, qty: 320, price: 390, total: 470 };

  doc.fontSize(10).fillColor('#ffffff');
  doc.rect(50, tableTop, 495, 22).fill('#2563eb');
  doc.fillColor('#ffffff');
  doc.text('Item', col.name + 8, tableTop + 6);
  doc.text('Qty', col.qty, tableTop + 6);
  doc.text('Unit Price', col.price, tableTop + 6);
  doc.text('Line Total', col.total, tableTop + 6);

  let rowY = tableTop + 22;
  doc.fillColor('#334155').fontSize(10);

  order.items.forEach((item, idx) => {
    const rowHeight = 22;
    if (idx % 2 === 1) {
      doc.rect(50, rowY, 495, rowHeight).fill('#f8fafc');
      doc.fillColor('#334155');
    }
    doc.text(item.name, col.name + 8, rowY + 6, { width: 360 });
    doc.text(String(item.quantity), col.qty, rowY + 6);
    doc.text(formatINR(item.price), col.price, rowY + 6);
    doc.text(formatINR(item.price * item.quantity), col.total, rowY + 6);
    rowY += rowHeight;
  });

  doc
    .moveTo(50, rowY)
    .lineTo(545, rowY)
    .strokeColor('#e2e8f0')
    .stroke();
  rowY += 12;

  // ----- Totals -----
  doc.fontSize(11).fillColor('#1e293b');
  doc.text('Total Amount', col.price, rowY, { width: 80 });
  doc.font('Helvetica-Bold').text(formatINR(order.totalAmount), col.total, rowY);
  doc.font('Helvetica');

  rowY += 30;

  // ----- Payment info -----
  doc.fontSize(10).fillColor('#64748b');
  doc.text(
    `Payment Method: ${order.paymentMethod === 'Online' ? 'Online (Razorpay)' : 'Cash on Delivery'}`,
    50,
    rowY
  );
  doc.text(`Payment Status: ${order.paymentStatus}`, 50, rowY + 14);
  if (order.paymentMethod === 'Online' && order.razorpayPaymentId) {
    doc.text(`Razorpay Payment ID: ${order.razorpayPaymentId}`, 50, rowY + 28);
  }

  // ----- Footer -----
  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(
      'This is a system-generated invoice for ApnaCart, represent a real commercial transaction.',
      50,
      750,
      { width: 495, align: 'center' }
    );

  doc.end();
};

