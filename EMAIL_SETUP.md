# 📧 Email Notifications Setup Guide

This guide will help you set up email notifications for your e-commerce platform using **Resend** (recommended) or alternative email services.

---

## 🎯 Current Status

✅ **Email System Implemented**: The email notification system is fully integrated into the application and ready for production.

📝 **Current Mode**: **Demo/Development Mode** - Emails are logged to the console instead of being sent.

🚀 **To Enable**: Follow the steps below to configure a real email service.

---

## 📨 Email Types Implemented

The following email notifications are automatically sent:

### 1. **Order Confirmation Email**
- **Trigger**: When a new order is created
- **Sent to**: Customer
- **Content**: Order details, items, shipping address, payment method
- **Also sends**: Admin notification email

### 2. **Payment Confirmation Email**
- **Trigger**: When payment is successfully processed (M-Pesa/Stripe)
- **Sent to**: Customer
- **Content**: Payment receipt, amount paid, order number

### 3. **Order Status Update Email**
- **Trigger**: When admin updates order status (PROCESSING, SHIPPED, DELIVERED)
- **Sent to**: Customer
- **Content**: New status, tracking number (if provided), order summary

### 4. **Admin New Order Notification**
- **Trigger**: When a new order is placed
- **Sent to**: Admin (configured email)
- **Content**: Order number, customer name, total amount, items count

---

## 🚀 Production Setup with Resend (Recommended)

**Resend** is a modern email API with:
- ✅ Free tier: 3,000 emails/month
- ✅ Easy setup
- ✅ Great deliverability
- ✅ Beautiful email templates support

### Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys**
3. Click **Create API Key**
4. Copy the API key (it will only be shown once!)

### Step 3: Configure Domain (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the provided DNS records to your domain registrar
5. Wait for verification (usually takes a few minutes)

### Step 4: Install Resend Package

```bash
npm install resend
```

### Step 5: Add Environment Variables

Create or update your `.env.local` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=orders@yourdomain.com
```

### Step 6: Update Email Utility

Update `lib/email.ts` to use Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'orders@yourdomain.com',
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: renderOrderConfirmationEmail(data),
    });
    
    console.log('✅ Order confirmation email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error };
  }
}

// Apply the same pattern to other email functions...
```

---

## 🔄 Alternative Email Services

### Option 1: SendGrid

**Pros**: Industry standard, 100 emails/day free  
**Cons**: More complex setup

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const msg = {
    to: data.customerEmail,
    from: 'orders@yourdomain.com',
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: renderOrderConfirmationEmail(data),
  };
  
  await sgMail.send(msg);
}
```

### Option 2: AWS SES

**Pros**: Very cheap, scalable  
**Cons**: Requires AWS account

```bash
npm install @aws-sdk/client-ses
```

### Option 3: Nodemailer (SMTP)

**Pros**: Works with any SMTP server  
**Cons**: More configuration needed

```bash
npm install nodemailer
```

---

## 🧪 Testing Email Delivery

### Development Testing

Use **Mailtrap** for testing without sending real emails:

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials
3. Configure Nodemailer:

```typescript
const transporter = nodemailer.createTransporter({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});
```

---

## 📊 Email Flow Diagram

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Create Order     │──────────┐
│ (POST /api       │          │
│  /orders)        │          ▼
└─────┬────────────┘    ┌──────────────┐
      │                 │ Admin Email  │
      │                 │ Notification │
      │                 └──────────────┘
      ▼
┌──────────────────┐
│ Order            │
│ Confirmation     │
│ Email to Customer│
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ Payment          │
│ Processing       │
│ (M-Pesa/Stripe)  │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│ Payment          │
│ Confirmation     │
│ Email to Customer│
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ Admin Updates    │
│ Order Status     │
│ (PATCH /api/     │
│  admin/orders)   │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│ Status Update    │
│ Email to Customer│
└──────────────────┘
```

---

## 🎨 Email Templates

All email templates are beautifully designed with:
- ✅ Responsive HTML (works on all devices)
- ✅ Professional branding
- ✅ Clear call-to-actions
- ✅ Order summaries and details
- ✅ Dark mode compatible

Templates are located in `lib/email.ts` as inline HTML functions:
- `renderOrderConfirmationEmail()`
- `renderPaymentConfirmationEmail()`
- `renderOrderStatusUpdateEmail()`

---

## 🔧 Environment Variables Reference

```env
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Email Addresses
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=orders@yourdomain.com

# Optional: Custom email addresses for different types
FROM_EMAIL_ORDERS=orders@yourdomain.com
FROM_EMAIL_PAYMENTS=payments@yourdomain.com
FROM_EMAIL_UPDATES=updates@yourdomain.com
FROM_EMAIL_SYSTEM=system@yourdomain.com
```

---

## 📝 Customization

### Customize Email Content

Edit the HTML templates in `lib/email.ts`:

```typescript
export function renderOrderConfirmationEmail(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML here -->
    </html>
  `;
}
```

### Add New Email Types

1. Create a new function in `lib/email.ts`:

```typescript
export async function sendShippingDelayNotification(data: any) {
  // Your email logic here
}
```

2. Call it from the appropriate API route

---

## 🚨 Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check Console**: Look for error messages in server logs
3. **Verify Domain**: Make sure your domain is verified in Resend
4. **Check Spam**: Look in the spam folder

### Email Deliverability Issues

1. **Set up SPF/DKIM**: Configure DNS records for your domain
2. **Use Verified Domain**: Don't send from @gmail.com or @yahoo.com
3. **Warm Up**: Start with small volumes and gradually increase
4. **Monitor Bounces**: Check Resend dashboard for bounce rates

### Rate Limiting

- Resend free tier: 3,000 emails/month
- Consider upgrading or batching emails if you exceed limits

---

## 📈 Monitoring

### Track Email Metrics

1. Log in to your Resend dashboard
2. View:
   - Emails sent
   - Delivery rate
   - Bounce rate
   - Open rate (if tracking enabled)

### Log Email Events

All email sends are logged to the console:

```
📧 Sending Order Confirmation Email...
To: customer@example.com
Order: ORD-1234567890
Total: KES 1,500.00
✅ Order confirmation email sent successfully
```

---

## ✅ Checklist for Production

- [ ] Resend account created
- [ ] API key obtained and added to `.env.local`
- [ ] Domain verified in Resend
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] `lib/email.ts` updated with Resend integration
- [ ] Test emails sent successfully
- [ ] Admin email address configured
- [ ] Email templates customized with your branding
- [ ] Monitoring dashboard checked

---

## 🎯 Next Steps

Once emails are configured:

1. **Test the Flow**:
   - Place a test order
   - Check if confirmation email is received
   - Make a test payment
   - Check if payment email is received
   - Update order status as admin
   - Check if status update email is received

2. **Monitor Performance**:
   - Check Resend dashboard daily
   - Monitor bounce rates
   - Adjust templates if needed

3. **Optimize**:
   - A/B test subject lines
   - Improve email copy
   - Add tracking pixels if needed

---

## 📞 Support

- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Support**: support@resend.com
- **Application Issues**: Check console logs and server output

---

**Made with ❤️ for your e-commerce success!**





