// ----- Items table -----
const tableTop = doc.y;

// Wider Item column
const col = {
  name: 50,
  qty: 370,
  price: 410,
  total: 485,
};

const tableWidth = 495;
const itemWidth = 310;

doc.fontSize(10).fillColor('#ffffff');

// Table Header
doc.rect(50, tableTop, tableWidth, 24).fill('#2563eb');

doc.fillColor('#ffffff');
doc.font('Helvetica-Bold');

doc.text('Item', col.name + 8, tableTop + 7, {
  width: itemWidth - 10,
});

doc.text('Qty', col.qty, tableTop + 7, {
  width: 30,
  align: 'center',
});

doc.text('Unit Price', col.price - 5, tableTop + 7, {
  width: 65,
  align: 'right',
});

doc.text('Line Total', col.total - 5, tableTop + 7, {
  width: 65,
  align: 'right',
});

doc.font('Helvetica');

let rowY = tableTop + 24;

doc.fillColor('#334155').fontSize(9.5);

// Table rows
order.items.forEach((item, idx) => {
  const itemName = item.name || 'Unnamed Product';

  // Calculate required height based on item name
  const itemHeight = doc.heightOfString(itemName, {
    width: itemWidth - 10,
    lineGap: 2,
  });

  const rowHeight = Math.max(26, itemHeight + 10);

  // Alternating row background
  if (idx % 2 === 1) {
    doc
      .rect(50, rowY, tableWidth, rowHeight)
      .fill('#f8fafc');

    doc.fillColor('#334155');
  }

  // Item name
  doc.text(itemName, col.name + 8, rowY + 7, {
    width: itemWidth - 10,
    lineGap: 2,
  });

  // Quantity
  doc.text(String(item.quantity), col.qty, rowY + 7, {
    width: 30,
    align: 'center',
  });

  // Unit price
  doc.text(formatINR(item.price), col.price - 5, rowY + 7, {
    width: 65,
    align: 'right',
  });

  // Line total
  doc.text(
    formatINR(item.price * item.quantity),
    col.total - 5,
    rowY + 7,
    {
      width: 65,
      align: 'right',
    }
  );

  rowY += rowHeight;
});

// Bottom border
doc
  .moveTo(50, rowY)
  .lineTo(545, rowY)
  .strokeColor('#e2e8f0')
  .stroke();

rowY += 12;