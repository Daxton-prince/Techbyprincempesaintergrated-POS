// api/initiate-payment.js
export default async function handler(req, res) {
  // 1. Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://techbyprinceposintergratedsystem.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle Preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, amount, reference } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount are required' });
  }

  // 4. Format phone number (Pay Hero expects 2547XXXXXXXX)
  let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.slice(1);
  } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
    formattedPhone = '254' + formattedPhone;
  }

  try {
    // 5. Call Pay Hero API
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      // Change it to this:
'Authorization': process.env.PAYHERO_BASIC_TOKEN
      },
      body: JSON.stringify({
        amount: Number(amount),
        phone_number: formattedPhone,
        channel_id: process.env.PAYHERO_CHANNEL_ID,
        provider: 'm-pesa',
        external_reference: reference || `POS-${Date.now()}`,
        // Note: Vercel automatically sets req.headers.host to your backend URL
        callback_url: `https://${req.headers.host}/api/payhero-callback`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Pay Hero Error:', data);
      return res.status(400).json({ error: data.message || 'Payment initiation failed' });
    }
    // Return BOTH the ID and the reference
    return res.status(200).json({
      success: true,
      checkoutRequestId: data.checkout_request_id || data.CheckoutRequestID,
      reference: data.external_reference || reference, // <-- Add this
      message: 'STK Push sent'
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
