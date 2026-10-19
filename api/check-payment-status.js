// api/check-payment-status.js
import { PayHeroClient } from 'payhero-devkit';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  // Use the SDK to handle authentication and URL routing
  const client = new PayHeroClient({
    username: process.env.PAYHERO_USERNAME,
    password: process.env.PAYHERO_PASSWORD
  });

  try {
    // Ask the SDK to check the status
    const status = await client.transactionStatus(reference);
    console.log('SDK STATUS RESULT:', status);

    // The SDK might return the status inside a `status` or `success` field.
    // We check for common success indicators.
    if (status.status === 'SUCCESS' || status.status === 'Success' || status.success === true) {
      return res.status(200).json({
        status: 'SUCCESS',
        mpesaReceiptNumber: status.mpesa_receipt_number || status.receipt || status.MpesaReceiptNumber || 'PAID'
      });
    }

    if (status.status === 'FAILED' || status.status === 'Failed') {
      return res.status(200).json({ status: 'FAILED' });
    }

    return res.status(200).json({ status: 'PENDING' });

  } catch (error) {
    console.error('SDK Status Check Error:', error);
    // If the SDK fails, we return PENDING so the frontend keeps trying,
    // but we log the real error for you to see.
    return res.status(200).json({ status: 'PENDING', error: error.message });
  }
}
