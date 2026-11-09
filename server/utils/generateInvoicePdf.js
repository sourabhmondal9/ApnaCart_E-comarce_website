import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------
// Logo
// ------------------------------------------------------
const LOGO_PATH = path.join(__dirname, '../assets/logoNav.webp');

// ------------------------------------------------------
// Currency formatter
// ------------------------------------------------------
const formatINR = (amount) => {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
};

// ------------------------------------------------------
// Invoice PDF Generator
// ------------------------------------------------------
export const streamInvoicePdf = (order, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
  });

  // ----------------------------------------------------
  // Invoice Number
  // ----------------------------------------------------
  const orderNumber = order?._id
    ? order._id.toString().slice(-8).toUpperCase()
    : 'UNKNOWN';

  // ----------------------------------------------------
  // Response Headers
  // ----------------------------------------------------
  res.setHeader('Content-Type', 'application/pdf');

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${orderNumber}.pdf"`
  );

  // Pipe PDF directly to response
  doc.pipe(res);

  // ====================================================
  // HEADER
  // ====================================================

  const headerY = doc.y;

  // ----------------------------------------------------
  // Logo
  // ----------------------------------------------------
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 50, headerY, {
      width: 140,
    });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        'ApnaCart — E-Commerce Invoice',
        50,
        headerY + 48,
        {
          width: 200,
        }
      );
  } else {
    // Fallback if logo doesn't exist
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#1e293b')
      .text('ApnaCart', 50, headerY);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        'ApnaCart — E-Commerce Invoice',
        50,
        headerY + 25
      );
  }

  // ----------------------------------------------------
  // Invoice Information - Right Side
  // ----------------------------------------------------
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#1e293b')
    .text('INVOICE', 350, headerY, {
      width: 195,
      align: 'right',
    });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#64748b')
    .text(
      `Invoice No: INV-${orderNumber}`,
      350,
      headerY + 24,
      {
        width: 195,
        align: 'right',
      }
    );

  doc.text(
    `Order Date: ${
      order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-IN')
        : 'N/A'
    }`,
    350,
    headerY + 40,
    {
      width: 195,
      align: 'right',
    }
  );

  doc.text(
    `Order Status: ${order?.orderStatus || 'N/A'}`,
    350,
    headerY + 56,
    {
      width: 195,
      align: 'right',
    }
  );

  // ----------------------------------------------------
  // Move below header
  // ----------------------------------------------------
  doc.y = Math.max(doc.y, headerY + 80);

  // ----------------------------------------------------
  // Divider
  // ----------------------------------------------------
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#e2e8f0')
    .stroke();

  doc.moveDown(1);

  // ====================================================
  // BILLING / SHIPPING DETAILS
  // ====================================================

  const colStartY = doc.y;

  // ----------------------------------------------------
  // Billed To
  // ----------------------------------------------------
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1e293b')
    .text('Billed To', 50, colStartY);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#334155')
    .text(order?.user?.name || 'N/A', 50);

  doc.text(order?.user?.email || 'N/A', 50);

  // ----------------------------------------------------
  // Shipping Address
  // ----------------------------------------------------
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1e293b')
    .text('Shipping Address', 300, colStartY);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#334155');

  const shippingAddress = order?.shippingAddress || {};

  doc.text(
    shippingAddress.street || 'N/A',
    300,
    colStartY + 16,
    {
      width: 245,
    }
  );

  doc.text(
    `${shippingAddress.city || 'N/A'}, ${
      shippingAddress.state || 'N/A'
    }`,
    300,
    colStartY + 31,
    {
      width: 245,
    }
  );

  doc.text(
    shippingAddress.pincode || 'N/A',
    300,
    colStartY + 46,
    {
      width: 245,
    }
  );

  // Move below billing section
  doc.y = Math.max(doc.y, colStartY + 70);

  // ====================================================
  // ITEMS TABLE
  // ====================================================

  const tableTop = doc.y;

  // ----------------------------------------------------
  // Column Positions
  // ----------------------------------------------------
  // Item column is now much wider.
  const col = {
    name: 50,
    qty: 365,
    price: 405,
    total: 480,
  };

  const tableWidth = 495;

  // Width available for item names
  const itemWidth = 305;

  // ----------------------------------------------------
  // Table Header
  // ----------------------------------------------------
  doc
    .rect(50, tableTop, tableWidth, 24)
    .fill('#2563eb');

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#ffffff');

  // Item
  doc.text(
    'Item',
    col.name + 8,
    tableTop + 7,
    {
      width: itemWidth,
    }
  );

  // Quantity
  doc.text(
    'Qty',
    col.qty,
    tableTop + 7,
    {
      width: 30,
      align: 'center',
    }
  );

  // Unit Price
  doc.text(
    'Unit Price',
    col.price - 5,
    tableTop + 7,
    {
      width: 65,
      align: 'right',
    }
  );

  // Line Total
  doc.text(
    'Line Total',
    col.total - 5,
    tableTop + 7,
    {
      width: 65,
      align: 'right',
    }
  );

  // ----------------------------------------------------
  // Table Rows
  // ----------------------------------------------------
  let rowY = tableTop + 24;

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor('#334155');

  items.forEach((item, index) => {
    const itemName = item?.name || 'Unnamed Product';

    const quantity = Number(item?.quantity || 0);

    const price = Number(item?.price || 0);

    const lineTotal = price * quantity;

    // --------------------------------------------------
    // Calculate height required for product name
    // --------------------------------------------------
    const itemTextHeight = doc.heightOfString(
      itemName,
      {
        width: itemWidth - 15,
        lineGap: 2,
      }
    );

    // Minimum row height = 28
    // Long names automatically increase row height
    const rowHeight = Math.max(
      28,
      itemTextHeight + 12
    );

    // --------------------------------------------------
    // Alternating background
    // --------------------------------------------------
    if (index % 2 === 1) {
      doc
        .rect(
          50,
          rowY,
          tableWidth,
          rowHeight
        )
        .fill('#f8fafc');
    }

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#334155');

    // --------------------------------------------------
    // Product Name
    // --------------------------------------------------
    doc.text(
      itemName,
      col.name + 8,
      rowY + 7,
      {
        width: itemWidth - 15,
        lineGap: 2,
      }
    );

    // --------------------------------------------------
    // Quantity
    // --------------------------------------------------
    doc.text(
      String(quantity),
      col.qty,
      rowY + 7,
      {
        width: 30,
        align: 'center',
      }
    );

    // --------------------------------------------------
    // Unit Price
    // --------------------------------------------------
    doc.text(
      formatINR(price),
      col.price - 5,
      rowY + 7,
      {
        width: 65,
        align: 'right',
      }
    );

    // --------------------------------------------------
    // Line Total
    // --------------------------------------------------
    doc.text(
      formatINR(lineTotal),
      col.total - 5,
      rowY + 7,
      {
        width: 65,
        align: 'right',
      }
    );

    // Move to next row
    rowY += rowHeight;
  });

  // ----------------------------------------------------
  // Table Bottom Border
  // ----------------------------------------------------
  doc
    .moveTo(50, rowY)
    .lineTo(545, rowY)
    .strokeColor('#e2e8f0')
    .stroke();

  rowY += 14;

  // ====================================================
  // TOTAL
  // ====================================================

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1e293b');

  doc.text(
    'Total Amount',
    col.price - 5,
    rowY,
    {
      width: 70,
      align: 'right',
    }
  );

  doc.text(
    formatINR(order?.totalAmount),
    col.total - 5,
    rowY,
    {
      width: 65,
      align: 'right',
    }
  );

  rowY += 32;

  // ====================================================
  // PAYMENT INFORMATION
  // ====================================================

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#64748b');

  const paymentMethod =
    order?.paymentMethod === 'Online'
      ? 'Online (Razorpay)'
      : 'Cash on Delivery';

  doc.text(
    `Payment Method: ${paymentMethod}`,
    50,
    rowY
  );

  doc.text(
    `Payment Status: ${
      order?.paymentStatus || 'N/A'
    }`,
    50,
    rowY + 15
  );

  // ----------------------------------------------------
  // Razorpay Payment ID
  // ----------------------------------------------------
  if (
    order?.paymentMethod === 'Online' &&
    order?.razorpayPaymentId
  ) {
    doc.text(
      `Razorpay Payment ID: ${order.razorpayPaymentId}`,
      50,
      rowY + 30
    );
  }

  // ====================================================
  // FOOTER
  // ====================================================

  const footerText =
    'This is a system-generated invoice for ApnaCart and represents a real commercial transaction.';

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(
      footerText,
      50,
      750,
      {
        width: 495,
        align: 'center',
      }
    );

  // ====================================================
  // FINISH PDF
  // ====================================================

  doc.end();
};