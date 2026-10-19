// api/check-payment-status.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // We now expect the reference (e.g., "POS-123456") in the body
  const { reference } = req.body;

  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  const token = process.env.PAYHERO_BASIC_TOKEN || 
    `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`;

  try {
    // CORRECT ENDPOINT: /api/v2/transaction-status
    const response = await fetch('https://backend.payhero.co.ke/api/v2/transaction-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ reference: reference })
    });

    const data = await response.json();
    console.log('PAYHERO STATUS CHECK:', JSON.stringify(data, null, 2));

    // Pay Hero returns { success: true, status: "SUCCESS", ... }
    if (data.status === 'SUCCESS' || data.status === 'Success' || data.status === 'success' || data.success === true) {
      return res.status(200).json({ 
        status: 'SUCCESS', 
        mpesaReceiptNumber: data.mpesa_receipt_number || data.receipt || data.MpesaReceiptNumber || 'PAID'
      });
    } 
    
    if (data.status === 'FAILED' || data.status === 'Failed' || data.status === 'failed') {
      return res.status(200).json({ status: 'FAILED' });
    }

    return res.status(200).json({ status: 'PENDING' });

  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(200).json({ status: 'PENDING', error: 'Network error' });
  }
}
