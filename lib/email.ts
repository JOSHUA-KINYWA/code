// Email utility for sending notifications
// Uses nodemailer with SMTP (Gmail)

import nodemailer from 'nodemailer';
import { renderAdminNewOrderEmail, renderOrderCancellationEmail } from './email-templates';

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection error:', error);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  status: string;
};

type AdminOrderNotificationData = {
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  paymentStatus: string;
};

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    console.log('📧 Sending Order Confirmation Email...');
    console.log('To:', data.customerEmail);
    console.log('Order:', data.orderNumber);
    console.log('Total:', `KES ${data.total.toFixed(2)}`);
    
    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: `"NexStore" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: renderOrderConfirmationEmail(data),
    });
    
    console.log('✅ Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendPaymentConfirmationEmail(data: OrderEmailData) {
  try {
    console.log('📧 Sending Payment Confirmation Email...');
    console.log('To:', data.customerEmail);
    console.log('Order:', data.orderNumber);
    console.log('Amount Paid:', `KES ${data.total.toFixed(2)}`);
    
    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: `"NexStore" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Payment Received - ${data.orderNumber} ✅`,
      html: renderPaymentConfirmationEmail(data),
    });
    
    console.log('✅ Payment confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send payment confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendOrderStatusUpdateEmail(
  data: OrderEmailData & { newStatus: string; trackingNumber?: string }
) {
  try {
    console.log('📧 Sending Order Status Update Email...');
    console.log('To:', data.customerEmail);
    console.log('Order:', data.orderNumber);
    console.log('New Status:', data.newStatus);
    if (data.trackingNumber) {
      console.log('Tracking Number:', data.trackingNumber);
    }
    
    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: `"NexStore" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Order ${data.newStatus} - ${data.orderNumber} 📦`,
      html: renderOrderStatusUpdateEmail(data),
    });
    
    console.log('✅ Order status update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order status update email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNewOrderNotification(data: AdminOrderNotificationData) {
  try {
    console.log('📧 Sending Admin New Order Notification...');
    console.log('To:', process.env.SMTP_USER);
    console.log('Order:', data.orderNumber);
    console.log('Customer:', data.customerName);
    console.log('Total:', `KES ${data.total.toFixed(2)}`);
    
    // Send email to admin (using SMTP user as admin email)
    const info = await transporter.sendMail({
      from: `"NexStore System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Admin receives notification at their email
      subject: `🛒 New Order: ${data.orderNumber}`,
      html: renderAdminNewOrderEmail(data),
    });
    
    console.log('✅ Admin notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
    return { success: false, error };
  }
}

type OrderCancellationData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  cancellationReason: string;
  refundAmount?: number;
  refundMethod?: string;
  refundETA?: string;
};

export async function sendOrderCancellationEmail(data: OrderCancellationData) {
  try {
    console.log('📧 Sending Order Cancellation Email...');
    console.log('To:', data.customerEmail);
    console.log('Order:', data.orderNumber);
    console.log('Reason:', data.cancellationReason);
    console.log('Refund Amount:', data.refundAmount ? `KES ${data.refundAmount.toFixed(2)}` : 'N/A');
    
    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: `"NexStore" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Order Cancelled - ${data.orderNumber} ❌`,
      html: renderOrderCancellationEmail(data),
    });
    
    console.log('✅ Order cancellation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order cancellation email:', error);
    return { success: false, error };
  }
}

// Email HTML Templates
export function renderOrderConfirmationEmail(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
            </td>
          </tr>
          
          <!-- Order Details -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                We've received your order and it's being processed. You'll receive another email when your items are shipped.
              </p>
              
              <!-- Order Number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</p>
                    <p style="margin: 5px 0 0 0; font-size: 20px; color: #f97316; font-weight: bold;">${data.orderNumber}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Items -->
              <h2 style="font-size: 18px; color: #333; margin: 30px 0 15px 0;">Order Items</h2>
              <table width="100%" cellpadding="10" cellspacing="0" style="border-top: 2px solid #e5e7eb;">
                ${data.items.map(item => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 15px 0;">
                      <strong style="color: #333; font-size: 14px;">${item.name}</strong>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Qty: ${item.quantity}</p>
                    </td>
                    <td align="right" style="padding: 15px 0;">
                      <strong style="color: #333; font-size: 14px;">KES ${(item.price * item.quantity).toFixed(2)}</strong>
                    </td>
                  </tr>
                `).join('')}
                <tr>
                  <td style="padding: 20px 0 10px 0;">
                    <strong style="font-size: 16px; color: #333;">Total</strong>
                  </td>
                  <td align="right" style="padding: 20px 0 10px 0;">
                    <strong style="font-size: 18px; color: #f97316;">KES ${data.total.toFixed(2)}</strong>
                  </td>
                </tr>
              </table>
              
              <!-- Shipping Address -->
              <h2 style="font-size: 18px; color: #333; margin: 30px 0 15px 0;">Shipping Address</h2>
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px;">
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                  ${data.shippingAddress.street}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br>
                  ${data.shippingAddress.country}
                </p>
              </div>
              
              <!-- Payment Method -->
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
                <strong>Payment Method:</strong> ${data.paymentMethod}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                Need help? Contact us at <a href="mailto:joshuakinywa96@gmail.com" style="color: #f97316; text-decoration: none;">joshuakinywa96@gmail.com</a>
                or WhatsApp: <a href="https://wa.me/254758036936" style="color: #f97316; text-decoration: none;">+254 758 036936</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} NexStore. Built with ❤️ in Kenya. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function renderPaymentConfirmationEmail(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Received ✅</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Your payment has been processed successfully</p>
            </td>
          </tr>
          
          <!-- Payment Details -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                We've successfully received your payment for order <strong>${data.orderNumber}</strong>. This email serves as your payment receipt.
              </p>
              
              <!-- Payment Amount -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 6px; padding: 30px; margin: 20px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #ffffff; opacity: 0.9;">Amount Paid</p>
                    <p style="margin: 10px 0 0 0; font-size: 36px; color: #ffffff; font-weight: bold;">KES ${data.total.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                <strong>Payment Method:</strong> ${data.paymentMethod}<br>
                <strong>Order Number:</strong> ${data.orderNumber}<br>
                <strong>Status:</strong> <span style="color: #10b981;">Paid</span>
              </p>
              
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.6;">
                  <strong>✓ What's Next?</strong><br>
                  Your order is being prepared for shipment. You'll receive a shipping confirmation email with tracking information once your items are on their way.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                Questions? Contact us at <a href="mailto:joshuakinywa96@gmail.com" style="color: #10b981; text-decoration: none;">joshuakinywa96@gmail.com</a>
                or WhatsApp: <a href="https://wa.me/254758036936" style="color: #10b981; text-decoration: none;">+254 758 036936</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} NexStore. Built with ❤️ in Kenya. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function renderOrderStatusUpdateEmail(
  data: OrderEmailData & { newStatus: string; trackingNumber?: string }
): string {
  const statusColors: Record<string, string> = {
    PROCESSING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    SHIPPED: '#8b5cf6',
    DELIVERED: '#10b981',
  };

  const statusColor = statusColors[data.newStatus] || '#6b7280';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order ${data.newStatus} 📦</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Order #${data.orderNumber}</p>
            </td>
          </tr>
          
          <!-- Status Update -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                Your order status has been updated to <strong style="color: ${statusColor};">${data.newStatus}</strong>.
              </p>
              
              ${data.trackingNumber ? `
                <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Tracking Number</p>
                  <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${data.trackingNumber}</p>
                </div>
              ` : ''}
              
              <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Order Summary</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                  <strong>Order Number:</strong> ${data.orderNumber}<br>
                  <strong>Total:</strong> KES ${data.total.toFixed(2)}<br>
                  <strong>Status:</strong> ${data.newStatus}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                Track your order or contact us at <a href="mailto:joshuakinywa96@gmail.com" style="color: ${statusColor}; text-decoration: none;">joshuakinywa96@gmail.com</a>
                or WhatsApp: <a href="https://wa.me/254758036936" style="color: ${statusColor}; text-decoration: none;">+254 758 036936</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} NexStore. Built with ❤️ in Kenya. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

