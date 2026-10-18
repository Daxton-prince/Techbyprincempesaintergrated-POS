// api/payhero-callback.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;
  console.log('Pay Hero Callback Received:', payload);

  // Pay Hero sends status updates here.
  // status can be 'SUCCESS', 'FAILED', etc.
  // In a real app, you would update your database here.

  // Always respond with 200 so Pay Hero knows you received it
  return res.status(200).json({ received: true });
}