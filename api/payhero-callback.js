import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const payload = req.body;
  const response = payload.response || payload;
  const externalRef = response.ExternalReference;
  const status = response.Status;

  if (externalRef) {
    await kv.set(`payment:${externalRef}`, {
      status: status,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      amount: response.Amount,
      phone: response.Phone,
    }, { ex: 3600 });  // expires in 1 hour
  }
  return res.status(200).json({ received: true });
}
