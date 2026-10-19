// api/check-payment-status.js
import { PayHeroClient } from 'payhero-devkit';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  const client = new PayHeroClient({
    username: process.env.PAYHERO_USERNAME,
    password: process.env.PAYHERO_PASSWORD
  });

  try {
    // The SDK handles the correct endpoint and auth internally
    const status = await client.transactionStatus(reference);
    console.log('SDK STATUS RESULT:', JSON.stringify(status, null, 2));

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
    return res.status(200).json({ status: 'PENDING', error: error.message });
  }
}
