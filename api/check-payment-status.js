// api/check-payment-status.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query; // This is the checkoutRequestId
  
  // We use your working Basic Auth Token
  const token = process.env.PAYHERO_BASIC_TOKEN || `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`;

  try {
    // Ask Pay Hero directly for the status of this specific request
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transactions/${id}`, {
      headers: {
        'Authorization': token
      }
    });

    const data = await response.json();
    console.log('PayHero Status Data:', data); // Check Vercel logs to see what this returns!

    // If Pay Hero says SUCCESS
    if (data.status === 'SUCCESS' || data.success === true) {
      return res.status(200).json({ 
        status: 'SUCCESS', 
        // Grab the receipt code (Pay Hero might call it different things)
        mpesaReceiptNumber: data.mpesa_receipt_number || data.receipt || data.transaction_code || data.external_reference
      });
    } 
    // If Pay Hero says FAILED or CANCELLED
    else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
      return res.status(200).json({ status: 'FAILED' });
    } 
    // If it's still pending, or we don't understand the response
    else {
      return res.status(200).json({ status: 'PENDING' });
    }

  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
