// api/check-payment-status.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query; // This is the CheckoutRequestID (ws_CO_...)

  if (!id) return res.status(400).json({ error: 'Missing CheckoutRequestID' });

  const token = process.env.PAYHERO_BASIC_TOKEN || 
    `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`;

  try {
    // 1. Ask Pay Hero directly for the status of this transaction
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transactions/${id}`, {
      headers: {
        'Authorization': token
      }
    });

    const data = await response.json();
    
    // 2. Log the FULL response so you can see exactly what Pay Hero returns
    console.log('PAYHERO RAW STATUS RESPONSE:', JSON.stringify(data, null, 2));

    // 3. Match Pay Hero's actual success format
    // Pay Hero often returns: { status: "SUCCESS", mpesa_receipt_number: "..." }
    // Or sometimes: { success: true, status: "SUCCESS" }
    const isSuccess = 
      data.status === 'SUCCESS' || 
      data.status === 'COMPLETED' ||
      data.status === 'Success' ||
      (data.success === true && data.status !== 'PENDING' && data.status !== 'QUEUED');

    if (isSuccess) {
      // Try all possible receipt field names
      const receipt = 
        data.mpesa_receipt_number || 
        data.receipt || 
        data.transaction_code || 
        data.MPESA_Reference ||
        'UNKNOWN';
      
      return res.status(200).json({ status: 'SUCCESS', mpesaReceiptNumber: receipt });
    }

    // 4. If Pay Hero says it failed
    if (data.status === 'FAILED' || data.status === 'CANCELLED' || data.status === 'Failed') {
      return res.status(200).json({ status: 'FAILED' });
    }

    // 5. Otherwise, it's still processing
    return res.status(200).json({ status: 'PENDING' });

  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
