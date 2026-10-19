// api/check-payment-status.js
export default async function handler(req, res) {
  const { id } = req.query; // This is your CheckoutRequestID from the prompt

  if (!id) return res.status(400).json({ error: 'Missing ID' });

  try {
    // Query Pay Hero using the CheckoutRequestID
    // Note: Verify the exact endpoint in Pay Hero docs. 
    // It is often /api/v2/transactions/status or similar.
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transactions/${id}`, {
      headers: {
        'Authorization': process.env.PAYHERO_BASIC_TOKEN // Use your working token
      }
    });

    const data = await response.json();
    console.log('PayHero Status Check:', data); // <-- Look at this in Vercel Logs!

    // Map Pay Hero's response to what your frontend expects
    // Check if the status field says SUCCESS or COMPLETED
    if (data.status === 'SUCCESS' || data.status === 'COMPLETED' || data.success === true) {
        return res.status(200).json({ 
            status: 'SUCCESS', 
            mpesaReceiptNumber: data.mpesa_receipt_number || data.receipt || data.transaction_code
        });
    } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
        return res.status(200).json({ status: 'FAILED' });
    } else {
        // Still pending
        return res.status(200).json({ status: 'PENDING' });
    }

  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
