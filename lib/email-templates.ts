// Additional email templates for NexStore

type AdminOrderNotificationData = {
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  paymentStatus: string;
};

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

export function renderAdminNewOrderEmail(data: AdminOrderNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛒 New Order Received</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
            </td>
          </tr>
          
          <!-- Order Details -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #333;">Order Summary</h2>
              
              <!-- Order Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 12px; color: #666;">Order Number</p>
                    <p style="margin: 5px 0 0 0; font-size: 18px; color: #3b82f6; font-weight: bold;">${data.orderNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 12px; color: #666;">Customer Name</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; color: #333; font-weight: bold;">${data.customerName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 12px; color: #666;">Total Amount</p>
                    <p style="margin: 5px 0 0 0; font-size: 20px; color: #10b981; font-weight: bold;">KES ${data.total.toFixed(2)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 12px; color: #666;">Number of Items</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;">${data.itemsCount} item${data.itemsCount > 1 ? 's' : ''}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #666;">Payment Status</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; color: #f59e0b; font-weight: bold;">${data.paymentStatus}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders" 
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      View Order Details
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                  <strong>⚠️ Action Required:</strong><br>
                  Please review and process this order as soon as possible.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} NexStore Admin System. Built with ❤️ in Kenya.
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

export function renderOrderCancellationEmail(data: OrderCancellationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancellation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Cancelled</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Order #${data.orderNumber}</p>
            </td>
          </tr>
          
          <!-- Cancellation Details -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                Your order <strong>${data.orderNumber}</strong> has been cancelled as per your request.
              </p>
              
              <!-- Cancellation Info -->
              <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #7f1d1d;">
                  <strong>Cancellation Reason:</strong><br>
                  ${data.cancellationReason}
                </p>
                ${data.refundAmount ? `
                  <p style="margin: 15px 0 0 0; font-size: 14px; color: #7f1d1d;">
                    <strong>Refund Amount:</strong> KES ${data.refundAmount.toFixed(2)}<br>
                    ${data.refundMethod ? `<strong>Refund Method:</strong> ${data.refundMethod}<br>` : ''}
                    ${data.refundETA ? `<strong>Expected Refund Time:</strong> ${data.refundETA}` : ''}
                  </p>
                ` : ''}
              </div>
              
              ${data.refundAmount ? `
                <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.6;">
                    <strong>💰 Refund Processing:</strong><br>
                    Your refund has been initiated and will be processed within the specified timeframe. You will receive the refund to your original payment method.
                  </p>
                </div>
              ` : ''}
              
              <p style="margin: 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                We're sorry to see your order cancelled. If you have any questions or concerns, please don't hesitate to reach out to our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                Need assistance? Contact us at <a href="mailto:joshuakinywa96@gmail.com" style="color: #ef4444; text-decoration: none;">joshuakinywa96@gmail.com</a>
                or WhatsApp: <a href="https://wa.me/254758036936" style="color: #ef4444; text-decoration: none;">+254 758 036936</a>
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

