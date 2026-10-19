// api/check-payment-status.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query; // The CheckoutRequestID
  
  // Get your token
  const token = process.env.PAYHERO_BASIC_TOKEN || 
    `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`;

  try {
    // The correct endpoint to check transaction status
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transactions/${id}`, {
      headers: {
        'Authorization': token
      }
    });

    const data = await response.json();
    
    // THIS LOG WILL SHOW US EXACTLY WHAT PAY HERO RETURNS
    console.log(`Checking status for ${id}:`, JSON.stringify(data, null, 2));

    if (data.status === 'SUCCESS' || data.status === 'Success' || data.success === true) {
      return res.status(200).json({ 
        status: 'SUCCESS', 
        mpesaReceiptNumber: data.mpesa_receipt_number || data.receipt || data.MpesaReceiptNumber || 'PAID'
      });
    } 
    
    if (data.status === 'FAILED' || data.status === 'Failed') {
      return res.status(200).json({ status: 'FAILED' });
    }

    // If it's still pending
    return res.status(200).json({ status: 'PENDING' });

  } catch (error) {
    console.error('Status Check Error:', error);
    // If we can't reach Pay Hero, return PENDING so the frontend doesn't crash
    return res.status(200).json({ status: 'PENDING', error: 'Network error' });
  }
}
