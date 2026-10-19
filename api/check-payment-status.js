// api/check-payment-status.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const token = process.env.PAYHERO_BASIC_TOKEN || 
    `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`;

  try {
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transactions/${id}`, {
      headers: { 'Authorization': token }
    });

    const data = await response.json();
    
    // CRITICAL: Log the FULL response so you can see exactly what Pay Hero returns
    console.log('PAYHERO RAW STATUS RESPONSE:', JSON.stringify(data, null, 2));

    // Pay Hero typically returns: { success: true/false, status: "QUEUED"|"SUCCESS"|"FAILED", ... }
    // Match MULTIPLE possible success indicators
    const isSuccess = 
      data.status === 'SUCCESS' || 
      data.status === 'COMPLETED' ||
      data.status === 'success' ||
      (data.success === true && data.status !== 'QUEUED' && data.status !== 'PENDING');

    const isFailed = 
      data.status === 'FAILED' || 
      data.status === 'CANCELLED' ||
      data.status === 'failed' ||
      (data.success === false && data.status !== 'QUEUED' && data.status !== 'PENDING');

    if (isSuccess) {
      // Try multiple possible receipt field names
      const receipt = 
        data.mpesa_receipt_number || 
        data.receipt || 
        data.transaction_code || 
        data.MPESA_Reference ||
        data.external_reference ||
        'UNKNOWN';
      
      return res.status(200).json({ status: 'SUCCESS', mpesaReceiptNumber: receipt });
    } 
    
    if (isFailed) {
      return res.status(200).json({ status: 'FAILED' });
    }

    // Still in progress
    return res.status(200).json({ status: 'PENDING' });

  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
