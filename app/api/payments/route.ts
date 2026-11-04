import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, userId } from '@/lib/auth-server';
import { getPayment, paymentsEnabled } from '@/lib/payments';
import { PRODUCTS } from '@/lib/products';

export const runtime = 'nodejs';

// GET /api/payments[?payment_id=…] - the products, and the signed-in person's orders.
// With payment_id (the customer just came back from paying): asks KOOMPI Cloud
// whether it is paid, in case the payment event has not arrived yet.
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!paymentsEnabled()) return NextResponse.json({ enabled: false, products: [], orders: [] });

  const db = await getDb();
  if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
  const uid = userId(user);

  const paymentId = request.nextUrl.searchParams.get('payment_id');
  if (paymentId) {
    const order = await db.execute({ sql: 'SELECT id, status FROM orders WHERE payment_id = ? AND user_id = ?', args: [paymentId, uid] });
    const row = order.rows[0];
    if (row && row.status !== 'paid') {
      try {
        const payment = await getPayment(paymentId);
        if (payment.status === 'paid' && payment.reference === row.id) {
          await db.execute({
            sql: "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'paid'",
            args: [row.id],
          });
        }
      } catch (error) {
        console.error('Payment check error:', error);
      }
    }
  }

  const orders = await db.execute({
    sql: 'SELECT id, product_id, amount, currency, status, payment_id, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    args: [uid],
  });
  return NextResponse.json({ enabled: true, products: Object.values(PRODUCTS), orders: orders.rows });
}
