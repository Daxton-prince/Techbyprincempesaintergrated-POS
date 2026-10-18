// api/initiate-payment.js
export default async function handler(req, res) {
  // Allow your POS frontend to talk to this backend
  res.setHeader('Access-Control-Allow-Origin', 'https://techbyprinceposintergratedsystem.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the browser's "preflight" check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ... the rest of your initiate-payment code ...
  // ... rest of your code ...
export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, amount, reference } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount are required' });
  }

  // 2. Format phone number (Pay Hero expects 2547XXXXXXXX)
  let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.slice(1);
  } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
    formattedPhone = '254' + formattedPhone;
  }

  try {
    // 3. Call Pay Hero API
    // Secrets come from Vercel Environment Variables (process.env)
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`
      },
      body: JSON.stringify({
        amount: Number(amount),
        phone_number: formattedPhone,
        channel_id: process.env.PAYHERO_CHANNEL_ID,
        provider: 'm-pesa',
        external_reference: reference || `POS-${Date.now()}`,
        callback_url: `https://${req.headers.host}/api/payhero-callback`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Pay Hero Error:', data);
      return res.status(400).json({ error: data.message || 'Payment initiation failed' });
    }

    // 4. Return the Checkout ID to the frontend so it can poll for status
    return res.status(200).json({
      success: true,
      checkoutRequestId: data.checkout_request_id,
      message: 'STK Push sent to customer phone'
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
