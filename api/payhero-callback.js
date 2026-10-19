// api/payhero-callback.js
const callbacks = {};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;
  console.log('Pay Hero Callback Received:', JSON.stringify(payload, null, 2));

  const response = payload.response || payload;
  const externalRef = response.ExternalReference;
  const status = response.Status;

  if (externalRef) {
    callbacks[externalRef] = {
      status: status,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      amount: response.Amount,
      phone: response.Phone,
      timestamp: Date.now()
    };
    console.log(`✅ Stored callback for ${externalRef}:`, callbacks[externalRef]);
  }

  return res.status(200).json({ received: true });
}

// Export the callbacks object so check-payment-status can read it
export { callbacks };
