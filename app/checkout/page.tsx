'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { useCart, CartItem } from '@/context/CartContext';
import MpesaPaymentModal from '@/components/checkout/MpesaPaymentModal';
import AddressSelector from '@/components/checkout/AddressSelector';
import { loadStripe } from '@stripe/stripe-js';

interface AppliedCoupon {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  freeShipping: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { cartItems, subtotal, tax, shipping, clearCart } = useCart();
  
  // All useState hooks must be called before any conditional returns
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [isLoading, setIsLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'paypal'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  
  // M-Pesa Payment Modal State
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<'initiating' | 'pending' | 'success' | 'failed'>('initiating');
  const [mpesaTransactionId, setMpesaTransactionId] = useState<string | undefined>();
  const [mpesaErrorMessage, setMpesaErrorMessage] = useState<string | undefined>();
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  
  // Currency conversion: 1 USD = 130 KSH
  const USD_TO_KSH = 130;
  const formatCurrency = (amount: number) => {
    if (paymentMethod === 'mpesa') {
      return `KSh ${(amount * USD_TO_KSH).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Protect this route - require authentication
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.error('🔒 Please sign in to continue to checkout');
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Check if cart is empty
  useEffect(() => {
    if (isLoaded && isSignedIn && cartItems.length === 0) {
      toast.error('Your cart is empty! Add some items first.');
      router.push('/products');
    }
  }, [isLoaded, isSignedIn, cartItems, router]);

  // Show loading while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (address: Omit<typeof shippingInfo, 'email'>) => {
    setShippingInfo({ ...shippingInfo, ...address });
    setShowManualEntry(address.fullName === ''); // Show manual entry if address is empty
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        toast.error(data.error || 'Invalid coupon code');
        return;
      }

      setAppliedCoupon(data.coupon);
      setDiscount(data.coupon.discountAmount);
      setFreeShipping(data.coupon.freeShipping || false);
      toast.success(`✅ Coupon applied! You saved $${data.coupon.discountAmount.toFixed(2)}`);
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setFreeShipping(false);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  // Calculate final total with discount
  const finalShipping = freeShipping ? 0 : shipping;
  const finalTotal = subtotal + tax + finalShipping - discount;

  const handleMpesaPayment = async () => {
    if (!mpesaPhone) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    // Validate phone number format
    const cleanPhone = mpesaPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    // Show modal in initiating state
    setMpesaStatus('initiating');
    setMpesaTransactionId(undefined);
    setMpesaErrorMessage(undefined);
    setShowMpesaModal(true);

    try {
      // Step 1: Create order in database
      const orderData = {
        items: cartItems.map((item: CartItem) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: subtotal,
        tax: tax,
        shipping: finalShipping,
        discount: discount,
        total: finalTotal,
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingState: shippingInfo.state,
        shippingZip: shippingInfo.zipCode,
        shippingCountry: shippingInfo.country,
        paymentMethod: 'mpesa',
        couponCode: appliedCoupon?.code || null,
        couponId: appliedCoupon?.id || null,
      };

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        throw new Error('Unable to process order. Please try again.');
      }

      const { order } = await orderResponse.json();
      const orderId = order.id;
      const amountInKsh = Math.round(finalTotal * USD_TO_KSH);
      
      // Step 2: Send STK Push to user's phone
      const stkResponse = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          phoneNumber: cleanPhone,
          amount: amountInKsh,
        }),
      });

      if (!stkResponse.ok) {
        const errorData = await stkResponse.json();
        throw new Error(errorData.message || 'Failed to send M-Pesa payment request');
      }

      const stkData = await stkResponse.json();
      const checkoutRequestID = stkData.payment?.checkoutRequestID;
      
      if (!checkoutRequestID) {
        throw new Error('Payment request failed. Please try again.');
      }
      
      // Update modal to pending state
      setMpesaStatus('pending');
      setMpesaTransactionId(checkoutRequestID);

      // Poll for payment status (check every 3 seconds for up to 2 minutes)
      let attempts = 0;
      const maxAttempts = 40; // 40 * 3 seconds = 2 minutes
      
      const checkPaymentStatus = async (): Promise<boolean> => {
        if (attempts >= maxAttempts) {
          throw new Error('Payment timeout. Please check your M-Pesa messages or try again.');
        }

        attempts++;

        try {
          const statusResponse = await fetch(
            `/api/mpesa/query?checkoutRequestID=${checkoutRequestID}`
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed') {
              return true; // Payment successful!
            } else if (statusData.status === 'failed') {
              const reason = statusData.resultDesc || 'Payment was cancelled';
              throw new Error(`Payment failed: ${reason}`);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }

        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
        return checkPaymentStatus();
      };

      // Wait for payment confirmation
      await checkPaymentStatus();
      
      // Payment successful!
      setMpesaStatus('success');
      
      // Clear cart immediately after successful payment
      clearCart();
      
      // Redirect to success page after modal closes
      setTimeout(() => {
        router.push('/order-success');
      }, 3000);

    } catch (error) {
      console.error('M-Pesa payment error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setMpesaStatus('failed');
      setMpesaErrorMessage(errorMessage);
      
      // Don't clear cart on error - user can try again
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setIsLoading(true);
    const toastId = toast.loading('🔄 Preparing Stripe checkout...');

    try {
      // Load Stripe
      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          shippingInfo,
          subtotal,
          tax,
          shipping: finalShipping,
          discount,
          total: finalTotal,
          couponCode: appliedCoupon?.code || null,
          couponId: appliedCoupon?.id || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      toast.success('✅ Redirecting to Stripe checkout...', { id: toastId });

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to process payment',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'mpesa') {
      await handleMpesaPayment();
      return;
    }
    
    if (paymentMethod === 'card') {
      await handleStripePayment();
      return;
    }
    
    // For PayPal - show coming soon
    toast.error('💰 PayPal payment coming soon! Please use M-Pesa or Card.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {step === 1 && (
              <>
                {/* Address Selector */}
                <AddressSelector
                  onSelectAddress={handleAddressSelect}
                  selectedAddress={shippingInfo.fullName ? shippingInfo : undefined}
                />

                {/* Manual Entry Form (shown when no address selected or user wants to enter manually) */}
                {(showManualEntry || !shippingInfo.fullName) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Shipping Information
                    </h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={shippingInfo.fullName}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={shippingInfo.email}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={shippingInfo.phone}
                          onChange={handleShippingChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Address *
                        </label>
                        <input
                          type="text"
                          name="address"
                          required
                          value={shippingInfo.address}
                          onChange={handleShippingChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={shippingInfo.city}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            name="state"
                            required
                            value={shippingInfo.state}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            required
                            value={shippingInfo.zipCode}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="10001"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Country *
                        </label>
                        <select
                          name="country"
                          value={shippingInfo.country}
                          onChange={handleShippingChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option>Kenya</option>
                          <option>Uganda</option>
                          <option>Tanzania</option>
                          <option>Rwanda</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  onClick={() => setStep(2)}
                  disabled={!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Payment
                </button>
              </>
            )}

            {/* Step 2: Payment Information */}
            {step === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Payment Information
                </h2>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Select Payment Method
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* M-Pesa - Active */}
                    <button
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'mpesa'
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">📱</div>
                      <p className={`text-sm font-medium ${
                        paymentMethod === 'mpesa' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>M-Pesa</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Available</p>
                    </button>

                    {/* Card - Stripe */}
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      <svg className={`w-8 h-8 mx-auto ${
                        paymentMethod === 'card' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <p className={`mt-2 text-sm font-medium ${
                        paymentMethod === 'card' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>Card</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">✓ Available</p>
                    </button>

                    {/* PayPal - Coming Soon */}
                    <button
                      onClick={() => {
                        setPaymentMethod('paypal');
                        toast.error('💰 PayPal payment coming soon! Please use M-Pesa.');
                      }}
                      className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 opacity-60 cursor-not-allowed relative"
                    >
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">Soon</div>
                      <svg className="w-8 h-8 mx-auto text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">PayPal</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Pending</p>
                    </button>
                  </div>
                </div>

                {/* M-Pesa Payment Form */}
                {paymentMethod === 'mpesa' && (
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
                      <div className="flex items-start">
                        <div className="text-2xl mr-3">📱</div>
                  <div>
                          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                            Lipa Na M-Pesa Online
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Enter your M-Pesa phone number. You&apos;ll receive a payment prompt on your phone.
                          </p>
                        </div>
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        M-Pesa Phone Number *
                    </label>
                    <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="254712345678 or 0712345678"
                      />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        💡 Enter your Safaricom number to receive payment prompt
                      </p>
                  </div>

                    {/* Amount to Pay in KSH */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                    <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount to Pay</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            KSh {(finalTotal * USD_TO_KSH).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            (${finalTotal.toFixed(2)} USD)
                          </p>
                    </div>
                        <div className="text-4xl">💰</div>
                    </div>
                  </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        How it works:
                      </h4>
                      <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-7 list-decimal">
                        <li>Click &quot;Pay with M-Pesa&quot; button below</li>
                        <li>Check your phone for STK Push prompt</li>
                        <li>Enter your M-Pesa PIN (KSh {(finalTotal * USD_TO_KSH).toLocaleString('en-KE', { minimumFractionDigits: 0 })})</li>
                        <li>Wait for confirmation SMS</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Card Payment Info */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Secure Stripe Payment</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete your payment with any major credit or debit card.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">SSL Encrypted</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PayPal Payment Form - Disabled */}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-4 opacity-50 pointer-events-none">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-4">
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        💰 PayPal payment is coming soon! Please use M-Pesa for now.
                      </p>
                    </div>
                </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (paymentMethod === 'mpesa') {
                        setStep(3);
                      } else if (paymentMethod === 'card') {
                        setStep(3);
                      } else {
                        toast.error('PayPal payment coming soon! Please use M-Pesa or Card.');
                      }
                    }}
                    disabled={paymentMethod === 'mpesa' && !mpesaPhone}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      paymentMethod === 'mpesa'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg'
                        : paymentMethod === 'card'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                  >
                    {paymentMethod === 'mpesa' && '📱 Review M-Pesa Order'}
                    {paymentMethod === 'card' && '💳 Review Card Payment'}
                    {paymentMethod === 'paypal' && '💰 PayPal (Coming Soon)'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Review Your Order
                </h2>

                {/* Shipping Details */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Shipping To:</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {shippingInfo.fullName}<br />
                    {shippingInfo.address}<br />
                    {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                    {shippingInfo.country}
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Edit
                  </button>
                </div>

                {/* Payment Details */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Method:</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {paymentMethod === 'mpesa' && `📱 M-Pesa: ${mpesaPhone}`}
                    {paymentMethod === 'card' && '💳 Credit/Debit Card'}
                    {paymentMethod === 'paypal' && '💰 PayPal'}
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Edit
                  </button>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items:</h3>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {paymentMethod === 'mpesa' 
                            ? `KSh ${(item.price * USD_TO_KSH).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
                            : `$${item.price.toFixed(2)}`
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading || (paymentMethod === 'mpesa' && !mpesaPhone)}
                    className={`flex-1 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                      paymentMethod === 'mpesa'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {paymentMethod === 'mpesa' ? 'Processing M-Pesa...' : 'Processing Order...'}
                      </span>
                    ) : (
                      <>
                        {paymentMethod === 'mpesa' && `📱 Pay with M-Pesa - ${formatCurrency(finalTotal)}`}
                        {paymentMethod === 'card' && `💳 Pay with Stripe - $${finalTotal.toFixed(2)}`}
                        {paymentMethod === 'paypal' && `💰 Place Order - $${finalTotal.toFixed(2)}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>
                {paymentMethod === 'mpesa' && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                    KSh 🇰🇪
                  </span>
                )}
              </div>

              {/* Currency Info Banner */}
              {paymentMethod === 'mpesa' && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    💱 Prices converted to Kenyan Shillings (1 USD = KSh {USD_TO_KSH})
                  </p>
                </div>
              )}

              {/* Coupon Code Input */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                {appliedCoupon ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    {appliedCoupon.description && (
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {appliedCoupon.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className={freeShipping ? 'line-through' : ''}>
                    {formatCurrency(shipping)}
                  </span>
                  {freeShipping && (
                    <span className="text-green-600 dark:text-green-400 font-semibold ml-2">
                      FREE
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span className={paymentMethod === 'mpesa' ? 'text-green-600 dark:text-green-400' : ''}>
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure checkout
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Free returns within 30 days
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  2-3 business days delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa Payment Modal */}
      <MpesaPaymentModal
        isOpen={showMpesaModal}
        onClose={() => {
          setShowMpesaModal(false);
          if (mpesaStatus === 'success') {
            router.push('/order-success');
          }
        }}
        status={mpesaStatus}
        amount={finalTotal * USD_TO_KSH}
        phoneNumber={mpesaPhone}
        transactionId={mpesaTransactionId}
        errorMessage={mpesaErrorMessage}
      />
    </div>
  );
}