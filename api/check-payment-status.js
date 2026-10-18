export default async function handler(req, res) {
  const { id } = req.query; // This is the CheckoutRequestID

  if (!id) return res.status(400).json({ error: 'Missing ID' });

  try {
    // Ask Pay Hero for the status of this specific transaction
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transactions/${id}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`
      }
    });

    const data = await response.json();

    // Pay Hero returns a status. Map it to what your frontend expects.
    // Look for 'SUCCESS' and the receipt number (usually in a field like 'mpesa_receipt_number' or 'transaction_code')
    if (data.status === 'SUCCESS') {
        return res.status(200).json({ 
            status: 'SUCCESS', 
            mpesaReceiptNumber: data.mpesa_receipt_number || data.transaction_code || data.receipt 
        });
    } else if (data.status === 'FAILED') {
        return res.status(200).json({ status: 'FAILED' });
    } else {
        return res.status(200).json({ status: 'PENDING' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}