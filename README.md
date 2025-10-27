# 🛒 NexStore - Full-Stack E-Commerce Platform

A modern, feature-rich e-commerce platform built with Next.js 16, featuring advanced admin controls, real-time chat, multiple payment integrations, and comprehensive order management.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwind-css)

---

## ✨ Features

### 🛍️ **Customer Features**
- **Product Browsing**: Advanced search, filtering by category, price range, and ratings
- **Product Details**: Image galleries, specifications, reviews, and related products
- **Shopping Cart**: Persistent cart synced across devices
- **Favorites/Wishlist**: Save products for later with cross-device sync
- **Reviews & Ratings**: Leave reviews for purchased products (verified purchases only)
- **Order Management**: Track orders, view history, cancel orders, download invoices
- **Address Management**: Multiple shipping addresses with default selection
- **Multiple Payment Methods**:
  - M-Pesa (STK Push for Kenya)
  - Stripe (International cards)
  - Manual payment verification
- **User Profile**: View account stats, recent orders, and settings
- **Real-time Chat**: In-app chat support with admins
- **WhatsApp Support**: Direct link for general inquiries (+254758036936)

### 👨‍💼 **Admin Features**
- **Dashboard**: Real-time analytics, revenue tracking, sales graphs
- **Product Management**:
  - Add/Edit/Delete products
  - Image upload (local or URL)
  - Bulk operations (price update, stock management, category changes)
  - Trending & Flash Deals management
  - Stock management with auto out-of-stock status
- **Order Management**:
  - View all orders with advanced filtering
  - Update order status
  - Approve/decline orders
  - Search by user, order number, or status
  - Cancel orders with automatic refunds
  - Export orders to CSV
  - Generate PDF invoices
- **User Management**: View all registered users and their details
- **Coupon System**: Create and manage discount codes
- **Chat System**: Monitor and respond to customer inquiries
- **Payment Monitoring**:
  - Pending payments dashboard
  - Manual payment verification
  - Payment audit logs
  - Auto-cancellation of expired orders
- **Sales Analytics**: Revenue trends, top products, customer insights

### 🔒 **Security & Authentication**
- Clerk authentication with role-based access control
- Admin-only routes protected by middleware
- Secure API endpoints with authentication checks
- XSS and CSRF protection

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 16 (App Router) with Turbopack
- **UI**: React 19, Tailwind CSS 4.1
- **State Management**: React Context API
- **Notifications**: react-hot-toast

### **Backend**
- **Runtime**: Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.18
- **Authentication**: Clerk
- **Storage**: Supabase Storage
- **Email**: Resend (optional)

### **Payment Integrations**
- **M-Pesa**: Daraja API (Kenya)
- **Stripe**: International payments

### **Additional Libraries**
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Image Optimization**: Next.js Image component
- **TypeScript**: Full type safety

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Clerk account (for authentication)
- M-Pesa developer account (optional, for M-Pesa payments)
- Stripe account (optional, for card payments)

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/JOSHUA-KINYWA/code.git
cd code
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Supabase Storage (for image uploads)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# M-Pesa (Optional)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=your_business_shortcode
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email (Optional - Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Cron Jobs (Optional)
CRON_SECRET=your_cron_secret_for_auto_cancellation
```

4. **Setup Database**

Generate Prisma client:
```bash
npx prisma generate
```

Run database migrations:
```bash
npx prisma db push
```

5. **Create Admin User**

After signing up, update your user role in the database or Clerk dashboard:
- Set `publicMetadata.role = "admin"` in Clerk

6. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📂 Project Structure

```
code/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── products/        # Product CRUD
│   │   ├── orders/          # Order management
│   │   ├── payments/        # Payment processing
│   │   ├── cart/            # Cart operations
│   │   ├── reviews/         # Review system
│   │   ├── chat/            # Chat system
│   │   └── admin/           # Admin-only APIs
│   ├── admin/               # Admin dashboard pages
│   ├── products/            # Product pages
│   ├── orders/              # User order pages
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout flow
│   └── ...                  # Other pages
├── components/              # React components
│   ├── products/           # Product-related components
│   ├── cart/               # Cart components
│   ├── admin/              # Admin components
│   ├── global/             # Shared components
│   └── ...
├── context/                 # React Context providers
├── lib/                     # Utility libraries
│   ├── prisma.ts           # Prisma client
│   ├── mpesa.ts            # M-Pesa integration
│   ├── stripe.ts           # Stripe integration
│   └── ...
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                  # Static assets
└── middleware.ts            # Route protection
```

---

## 🔑 Key Features Explained

### **1. Payment System**
- **M-Pesa STK Push**: Automated mobile payment for Kenyan customers
- **Stripe Checkout**: Secure card payments for international customers
- **Payment Verification**: Manual verification for stuck payments
- **Auto-Cancellation**: Orders pending for 24+ hours are automatically cancelled
- **Refund Support**: Automatic refunds for Stripe, manual requests for M-Pesa

### **2. Order Management**
- **Status Tracking**: Pending → Processing → Shipped → Delivered
- **Cancellation**: Users can cancel orders with automatic refunds
- **Invoice Generation**: PDF invoices downloadable by users and admins
- **Export**: CSV export for admin reporting

### **3. Reviews System**
- Only users who purchased a product can review it
- Star ratings with half-star precision
- One review per user per product
- Average ratings displayed on product cards

### **4. Stock Management**
- Automatic stock reduction on purchase
- Out-of-stock status prevents purchases
- Admin bulk stock updates
- Stock restoration on order cancellation

### **5. Chat System**
- Real-time messaging between users and admins
- Unread message notifications
- Message persistence
- Admin can close/delete conversations

---

## 🔧 Configuration

### **Setting up M-Pesa**
1. Register at [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)
2. Create an app and get Consumer Key & Secret
3. Get your Shortcode and Passkey
4. Configure your callback URL in the portal
5. Add credentials to `.env.local`

### **Setting up Stripe**
1. Create account at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from Developers section
3. Setup webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Add webhook secret and keys to `.env.local`

### **Setting up Supabase Storage**
1. Create a project at [Supabase](https://supabase.com/)
2. Create a storage bucket named `product-images`
3. Set bucket to public access
4. Add Supabase credentials to `.env.local`

---

## 📱 API Endpoints

### **Public Endpoints**
- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product details
- `GET /api/products/search` - Search products
- `POST /api/orders` - Create order
- `POST /api/reviews` - Submit review

### **Protected Endpoints**
- `GET /api/orders` - User's orders
- `POST /api/cart` - Manage cart
- `GET /api/favorites` - User's favorites
- `POST /api/chat/messages` - Send message

### **Admin Endpoints**
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/admin/orders` - All orders
- `POST /api/admin/analytics` - Analytics data
- `GET /api/admin/payments/pending` - Pending payments

---

## 🎨 Customization

### **Branding**
Update the store name in:
- `components/navbar/Logo.tsx`
- `components/global/Footer.tsx`
- `app/layout.tsx` (metadata)

### **Color Scheme**
Modify Tailwind config or use CSS variables in `app/globals.css`

### **Payment Methods**
Enable/disable payment methods in checkout by modifying `app/checkout/page.tsx`

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Kill process on port 3000 (Windows)
taskkill /F /PID <process_id>

# Find process (Unix/Mac)
lsof -ti:3000 | xargs kill -9
```

### **Database Connection Issues**
- Verify `DATABASE_URL` in `.env.local`
- Check database is running
- Run `npx prisma generate` to regenerate client

### **Clerk Authentication Not Working**
- Verify all Clerk environment variables
- Check Clerk dashboard for allowed URLs
- Clear browser cookies/cache

### **M-Pesa Payments Failing**
- Verify callback URL is accessible (use ngrok for local testing)
- Check M-Pesa credentials
- Ensure Shortcode and Passkey are correct
- Test with small amounts first

---

## 🚢 Deployment

### **Vercel (Recommended)**
1. Push code to GitHub
2. Connect repository to Vercel
3. Add all environment variables
4. Deploy!

### **Other Platforms**
Compatible with any Node.js hosting:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

**Important**: 
- Set up webhook endpoints for Stripe and M-Pesa
- Configure CORS if using custom domain
- Setup cron job for auto-cancellation (optional)

---

## 📊 Cron Jobs (Optional)

Setup automated tasks:

### **Auto-Cancel Expired Orders**
Call this endpoint every hour:
```
POST https://yourdomain.com/api/payments/auto-cancel
Headers: x-api-key: your_cron_secret
```

Using Vercel Cron:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/payments/auto-cancel",
    "schedule": "0 * * * *"
  }]
}
```

---

## 🤝 Contributing

This is a private project. For suggestions or bug reports, contact the development team.

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Developer

**Joshua Kinywa**  
📧 Email: [Your Email]  
📱 WhatsApp: +254758036936  
🐙 GitHub: [@JOSHUA-KINYWA](https://github.com/JOSHUA-KINYWA)

---

## 🙏 Acknowledgments

- Built with ❤️ in Kenya
- Powered by Next.js, Prisma, and Supabase
- Payment integrations: Safaricom M-Pesa & Stripe
- Authentication: Clerk

---

## 📝 Changelog

### Version 1.0.0 (October 2025)
- ✅ Initial release
- ✅ Complete e-commerce functionality
- ✅ Admin dashboard
- ✅ Payment integrations (M-Pesa & Stripe)
- ✅ Reviews & ratings system
- ✅ Chat system
- ✅ Order management
- ✅ Coupon system
- ✅ Address management
- ✅ Payment edge case handling
- ✅ Analytics dashboard

---

**Made with ❤️ using Next.js**
