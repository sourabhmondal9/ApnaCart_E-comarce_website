import PDFDocument from 'pdfkit';

const formatINR = (amount) => {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
};

export const streamInvoicePdf = (order, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  const orderNumber = order._id.toString().slice(-8).toUpperCase();

  res.setHeader('Content-Type', 'application/pdf');

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${orderNumber}.pdf"`
  );

  doc.pipe(res);

  // ============================================================
  // HEADER - APNACART NAME ONLY
  // ============================================================

  const headerY = 45;

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(
      'ApnaCart',
      50,
      headerY
    );

  doc
    .fillColor('#64748b')
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(
      'Apni Pasand. Apni Shopping.',
      50,
      headerY + 28
    );

  doc.font('Helvetica');

  doc.x = 50;
  doc.y = headerY + 55;

  // ============================================================
  // INVOICE INFORMATION
  // ============================================================

  doc
    .fontSize(16)
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .text('INVOICE', {
      align: 'right',
    });

  doc.font('Helvetica');

  doc
    .fontSize(10)
    .fillColor('#64748b')
    .text(`Invoice No: INV-${orderNumber}`, {
      align: 'right',
    });

  doc.text(
    `Order Date: ${new Date(
      order.createdAt
    ).toLocaleDateString('en-IN')}`,
    {
      align: 'right',
    }
  );

  doc.text(
    `Order Status: ${order.orderStatus}`,
    {
      align: 'right',
    }
  );

  doc.moveDown(1);

  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#e2e8f0')
    .stroke();

  doc.moveDown(0.8);

  // ============================================================
  // BILLING / SHIPPING
  // ============================================================

  const colStartY = doc.y;

  // ----------------------------
  // BILLED TO
  // ----------------------------

  doc
    .fontSize(11)
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .text(
      'Billed To',
      50,
      colStartY
    );

  doc
    .fontSize(10)
    .fillColor('#334155')
    .font('Helvetica');

  doc.text(
    order.user?.name || 'N/A',
    50
  );

  doc.text(
    order.user?.email || 'N/A',
    50
  );

  // ----------------------------
  // SHIPPING ADDRESS
  // ----------------------------

  doc
    .fontSize(11)
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .text(
      'Shipping Address',
      300,
      colStartY
    );

  doc
    .fontSize(10)
    .fillColor('#334155')
    .font('Helvetica');

  const shippingAddress =
    order.shippingAddress || {};

  doc.text(
    shippingAddress.street || 'N/A',
    300
  );

  doc.text(
    `${shippingAddress.city || ''}, ${
      shippingAddress.state || ''
    }`,
    300
  );

  doc.text(
    shippingAddress.pincode || '',
    300
  );

  doc.moveDown(2);

  // ============================================================
  // ITEMS TABLE
  // ============================================================

  const tableX = 50;
  const tableWidth = 495;

  const itemWidth = 255;
  const qtyWidth = 55;
  const priceWidth = 85;
  const totalWidth = 100;

  const itemX = tableX;

  const qtyX =
    itemX + itemWidth;

  const priceX =
    qtyX + qtyWidth;

  const totalX =
    priceX + priceWidth;

  const tableTop = doc.y;

  const headerHeight = 25;

  // ============================================================
  // TABLE HEADER
  // ============================================================

  doc
    .rect(
      tableX,
      tableTop,
      tableWidth,
      headerHeight
    )
    .fill('#2563eb');

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(10);

  doc.text(
    'Item',
    itemX + 8,
    tableTop + 7,
    {
      width: itemWidth - 16,
    }
  );

  doc.text(
    'Qty',
    qtyX,
    tableTop + 7,
    {
      width: qtyWidth,
      align: 'center',
    }
  );

  doc.text(
    'Unit Price',
    priceX,
    tableTop + 7,
    {
      width: priceWidth,
      align: 'right',
    }
  );

  doc.text(
    'Line Total',
    totalX,
    tableTop + 7,
    {
      width: totalWidth - 8,
      align: 'right',
    }
  );

  // ============================================================
  // TABLE ROWS
  // ============================================================

  let rowY =
    tableTop + headerHeight;

  doc
    .font('Helvetica')
    .fontSize(9.5);

  order.items.forEach(
    (item, index) => {
      const itemName =
        item.name || 'Product';

      // Calculate height based on item name
      const itemNameHeight =
        doc.heightOfString(
          itemName,
          {
            width:
              itemWidth - 16,
            lineGap: 2,
          }
        );

      // Minimum row height = 25
      const rowHeight =
        Math.max(
          25,
          itemNameHeight + 10
        );

      // Alternate row background
      if (index % 2 === 1) {
        doc
          .rect(
            tableX,
            rowY,
            tableWidth,
            rowHeight
          )
          .fill('#f8fafc');
      }

      // ----------------------------
      // ITEM NAME
      // ----------------------------

      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(9.5)
        .text(
          itemName,
          itemX + 8,
          rowY + 5,
          {
            width:
              itemWidth - 16,
            lineGap: 2,
          }
        );

      // ----------------------------
      // QUANTITY
      // ----------------------------

      doc.text(
        String(
          item.quantity || 0
        ),
        qtyX,
        rowY + 8,
        {
          width: qtyWidth,
          align: 'center',
        }
      );

      // ----------------------------
      // UNIT PRICE
      // ----------------------------

      doc.text(
        formatINR(item.price),
        priceX,
        rowY + 8,
        {
          width: priceWidth,
          align: 'right',
        }
      );

      // ----------------------------
      // LINE TOTAL
      // ----------------------------

      doc.text(
        formatINR(
          Number(item.price || 0) *
          Number(item.quantity || 0)
        ),
        totalX,
        rowY + 8,
        {
          width:
            totalWidth - 8,
          align: 'right',
        }
      );

      // Move to next row
      rowY += rowHeight;

      // Horizontal separator
      doc
        .moveTo(
          tableX,
          rowY
        )
        .lineTo(
          tableX + tableWidth,
          rowY
        )
        .strokeColor(
          '#e2e8f0'
        )
        .stroke();
    }
  );

  // ============================================================
  // TABLE BORDER
  // ============================================================

  doc
    .rect(
      tableX,
      tableTop,
      tableWidth,
      rowY - tableTop
    )
    .strokeColor('#e2e8f0')
    .stroke();

  // Quantity separator
  doc
    .moveTo(
      qtyX,
      tableTop
    )
    .lineTo(
      qtyX,
      rowY
    )
    .strokeColor('#e2e8f0')
    .stroke();

  // Price separator
  doc
    .moveTo(
      priceX,
      tableTop
    )
    .lineTo(
      priceX,
      rowY
    )
    .strokeColor('#e2e8f0')
    .stroke();

  // Total separator
  doc
    .moveTo(
      totalX,
      tableTop
    )
    .lineTo(
      totalX,
      rowY
    )
    .strokeColor('#e2e8f0')
    .stroke();

  // ============================================================
  // TOTAL AMOUNT
  // ============================================================

  rowY += 15;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1e293b')
    .text(
      'Total Amount',
      priceX,
      rowY,
      {
        width: priceWidth,
        align: 'right',
      }
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1e293b')
    .text(
      formatINR(
        order.totalAmount
      ),
      totalX,
      rowY,
      {
        width:
          totalWidth - 8,
        align: 'right',
      }
    );

  // ============================================================
  // PAYMENT INFORMATION
  // ============================================================

  rowY += 32;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#64748b');

  doc.text(
    `Payment Method: ${
      order.paymentMethod === 'Online'
        ? 'Online (Razorpay)'
        : 'Cash on Delivery'
    }`,
    50,
    rowY
  );

  doc.text(
    `Payment Status: ${
      order.paymentStatus ||
      'Pending'
    }`,
    50,
    rowY + 14
  );

  // Razorpay payment ID
  if (
    order.paymentMethod === 'Online' &&
    order.razorpayPaymentId
  ) {
    doc.text(
      `Razorpay Payment ID: ${
        order.razorpayPaymentId
      }`,
      50,
      rowY + 28
    );
  }

  // ============================================================
  // FOOTER
  // ============================================================

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(
      'This is a system-generated invoice for ApnaCart and represents a real commercial transaction.',
      50,
      750,
      {
        width: 495,
        align: 'center',
      }
    );

  // ============================================================
  // FINISH PDF
  // ============================================================

  doc.end();
};