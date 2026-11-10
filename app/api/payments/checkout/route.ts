import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, userId } from '@/lib/auth-server';
import { appOrigin, paymentsEnabled, startCheckout } from '@/lib/payments';
import { PRODUCTS } from '@/lib/products';

export const runtime = 'nodejs';

// POST /api/payments/checkout { productId } - an unpaid order and the link to pay it
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!paymentsEnabled()) return NextResponse.json({ error: 'Payments are not turned on for this app' }, { status: 503 });

  const { productId } = await request.json().catch(() => ({}));
  const product = PRODUCTS[productId as string];
  if (!product) return NextResponse.json({ error: 'No such product' }, { status: 400 });

  const db = await getDb();
  if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });

  // Saved (unpaid) before the payment starts, so its payment event always finds it.
  const orderId = crypto.randomUUID();
  await db.execute({
    sql: 'INSERT INTO orders (id, user_id, product_id, amount, currency) VALUES (?, ?, ?, ?, ?)',
    args: [orderId, userId(user), product.id, product.amount, product.currency],
  });

  try {
    const payment = await startCheckout({
      amount: product.amount,
      currency: product.currency,
      reference: orderId,
      description: product.name,
      items: [{ name: product.name, price: Number(product.amount), quantity: 1 }],
      successUrl: `${appOrigin(request.headers)}/`,
    });
    await db.execute({ sql: 'UPDATE orders SET payment_id = ? WHERE id = ?', args: [payment.id, orderId] });
    return NextResponse.json({ orderId, checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    await db.execute({ sql: "UPDATE orders SET status = 'failed' WHERE id = ?", args: [orderId] });
    return NextResponse.json({ error: 'The payment could not be started. Try again in a moment.' }, { status: 502 });
  }
}
