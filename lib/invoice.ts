import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: Date;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  paymentMethod: string;
  status: string;
  shippingAddress: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export function generateInvoicePDF(order: OrderData): jsPDF {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('NexStore', 20, 30);
  doc.text('Nairobi, Kenya', 20, 35);
  doc.text('Email: support@nexstore.com', 20, 40);
  doc.text('Phone: +254 758 036 936', 20, 45);
  
  // Invoice Details (Right Side)
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.orderNumber}`, 140, 30);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 35);
  doc.text(`Status: ${order.status}`, 140, 40);
  doc.text(`Payment: ${order.paymentMethod}`, 140, 45);
  
  // Customer Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(order.user.name, 20, 72);
  doc.text(order.user.email, 20, 77);
  
  // Shipping Address
  const addressLines = order.shippingAddress.split('\n');
  let addressY = 82;
  addressLines.forEach((line) => {
    doc.text(line, 20, addressY);
    addressY += 5;
  });
  
  // Order Items Table
  const tableData = order.items.map((item) => [
    item.product.name,
    item.quantity.toString(),
    `KES ${item.price.toFixed(2)}`,
    `KES ${(item.quantity * item.price).toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: addressY + 10,
    head: [['Item', 'Quantity', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [219, 39, 119], // Pink color
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || addressY + 50;
  
  // Summary
  const summaryX = 130;
  let summaryY = finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', summaryX, summaryY);
  doc.text(`KES ${order.subtotal.toFixed(2)}`, 180, summaryY, { align: 'right' });
  summaryY += 7;
  
  doc.text('Shipping:', summaryX, summaryY);
  doc.text(`KES ${order.shipping.toFixed(2)}`, 180, summaryY, { align: 'right' });
  summaryY += 7;
  
  doc.text('Tax:', summaryX, summaryY);
  doc.text(`KES ${order.tax.toFixed(2)}`, 180, summaryY, { align: 'right' });
  summaryY += 7;
  
  if (order.discount && order.discount > 0) {
    doc.setTextColor(220, 38, 38); // Red color
    doc.text('Discount:', summaryX, summaryY);
    doc.text(`-KES ${order.discount.toFixed(2)}`, 180, summaryY, { align: 'right' });
    if (order.couponCode) {
      doc.setFontSize(8);
      doc.text(`(${order.couponCode})`, summaryX + 20, summaryY);
      doc.setFontSize(10);
    }
    summaryY += 7;
    doc.setTextColor(0, 0, 0); // Reset to black
  }
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', summaryX, summaryY);
  doc.text(`KES ${order.total.toFixed(2)}`, 180, summaryY, { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for shopping with NexStore!', 105, 280, { align: 'center' });
  doc.text('For questions, contact us at support@nexstore.com | +254 758 036 936', 105, 285, { align: 'center' });
  
  return doc;
}

export function generateOrdersCSV(orders: any[]): string {
  const headers = [
    'Order Number',
    'Date',
    'Customer',
    'Email',
    'Status',
    'Payment Status',
    'Payment Method',
    'Items',
    'Subtotal (KES)',
    'Tax (KES)',
    'Shipping (KES)',
    'Discount (KES)',
    'Total (KES)',
  ];
  
  const rows = orders.map((order) => {
    // Safely handle all values
    const orderNumber = order.orderNumber || 'N/A';
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
    const customerName = order.user?.name || 'N/A';
    const customerEmail = order.user?.email || 'N/A';
    const status = order.status || 'N/A';
    const paymentStatus = order.paymentStatus || 'N/A';
    const paymentMethod = order.paymentMethod || 'N/A';
    const itemCount = order.items?.length || 0;
    const subtotal = (order.subtotal || 0).toFixed(2);
    const tax = (order.tax || 0).toFixed(2);
    const shipping = (order.shipping || 0).toFixed(2);
    const discount = (order.discount || 0).toFixed(2);
    const total = (order.total || 0).toFixed(2);
    
    return [
      orderNumber,
      date,
      customerName,
      customerEmail,
      status,
      paymentStatus,
      paymentMethod,
      itemCount,
      subtotal,
      tax,
      shipping,
      discount,
      total,
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

