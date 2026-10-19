import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  // Check KV store first
  const cached = await kv.get(`payment:${reference}`);
  if (cached) {
    return res.status(200).json({
      status: cached.status === 'Success' ? 'SUCCESS' : 'FAILED',
      mpesaReceiptNumber: cached.mpesaReceiptNumber
    });
  }

  // Fall back to Pay Hero API
  const token = process.env.PAYHERO_BASIC_TOKEN;
  try {
    const r = await fetch(`https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`, {
      headers: { 'Authorization': token }
    });
    const data = await r.json();
    if (data.status === 'SUCCESS' || data.status === 'Success') {
      return res.status(200).json({ status: 'SUCCESS', mpesaReceiptNumber: data.mpesa_receipt_number });
    }
    return res.status(200).json({ status: 'PENDING' });
  } catch (e) {
    return res.status(200).json({ status: 'PENDING' });
  }
}
