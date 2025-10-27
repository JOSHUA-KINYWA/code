// M-Pesa Integration Utilities

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  callbackUrl: string;
}

// Get M-Pesa configuration from environment variables
function getMpesaConfig(): MpesaConfig {
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
    callbackUrl: process.env.NEXT_PUBLIC_MPESA_CALLBACK_URL || 'http://localhost:3000/api/mpesa/callback',
  };
}

// Validate M-Pesa configuration
export function validateMpesaConfig(): boolean {
  const config = getMpesaConfig();
  return !!(
    config.consumerKey &&
    config.consumerSecret &&
    config.passkey &&
    config.shortcode
  );
}

// Get M-Pesa OAuth Access Token
export async function getAccessToken(): Promise<string> {
  const config = getMpesaConfig();
  
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  
  const response = await fetch(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get M-Pesa access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Format phone number to required format (254XXXXXXXXX)
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// Generate timestamp for M-Pesa (YYYYMMDDHHmmss)
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate password for M-Pesa STK Push
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = shortcode + passkey + timestamp;
  return Buffer.from(str).toString('base64');
}

// Initiate M-Pesa STK Push
export async function initiateStkPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<any> {
  const config = getMpesaConfig();
  const accessToken = await getAccessToken();
  
  const timestamp = generateTimestamp();
  const password = generatePassword(config.shortcode, config.passkey, timestamp);
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // For sandbox testing with localhost, use a placeholder callback URL
  // In production (Vercel/deployed), this should be your actual callback URL
  const callbackUrl = config.environment === 'sandbox' 
    ? 'https://webhook.site/unique-id' // Placeholder for sandbox
    : config.callbackUrl;

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: config.shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const response = await fetch(
    `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.errorMessage || 'Failed to initiate STK Push');
  }

  return await response.json();
}

// Query STK Push transaction status
export async function queryStkPushStatus(checkoutRequestID: string): Promise<any> {
  const config = getMpesaConfig();
  const accessToken = await getAccessToken();
  
  const timestamp = generateTimestamp();
  const password = generatePassword(config.shortcode, config.passkey, timestamp);

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID,
  };

  const response = await fetch(
    `${config.baseUrl}/mpesa/stkpushquery/v1/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.errorMessage || 'Failed to query transaction status');
  }

  return await response.json();
}

