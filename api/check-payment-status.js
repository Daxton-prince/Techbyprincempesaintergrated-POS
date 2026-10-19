// api/check-payment-status.js
import { callbacks } from './payhero-callback.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  // 1. Check the callback store first (this is the key fix)
  if (callbacks[reference]) {
    const cb = callbacks[reference];
    console.log(`✅ Found callback for ${reference}:`, cb);
    
    if (cb.status === 'Success' || cb.status === 'SUCCESS') {
      return res.status(200).json({ 
        status: 'SUCCESS', 
        mpesaReceiptNumber: cb.mpesaReceiptNumber 
      });
    }
    if (cb.status === 'Failed' || cb.status === 'FAILED') {
      return res.status(200).json({ status: 'FAILED' });
    }
  }

  // 2. If no callback yet, fall back to Pay Hero API
  const token = process.env.PAYHERO_BASIC_TOKEN || 
    `Basic ${Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64')}`;

  try {
    const response = await fetch(`https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`, {
      headers: { 'Authorization': token }
    });

    const data = await response.json();
    console.log('PAYHERO STATUS FALLBACK:', JSON.stringify(data, null, 2));

    if (data.status === 'SUCCESS' || data.status === 'Success' || data.success === true) {
      return res.status(200).json({ 
        status: 'SUCCESS', 
        mpesaReceiptNumber: data.mpesa_receipt_number || data.receipt || data.MpesaReceiptNumber || 'PAID'
      });
    } 
    
    if (data.status === 'FAILED' || data.status === 'Failed') {
      return res.status(200).json({ status: 'FAILED' });
    }

    return res.status(200).json({ status: 'PENDING' });

  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(200).json({ status: 'PENDING', error: 'Network error' });
  }
}
