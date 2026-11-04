import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyEvent } from '@/lib/payments';

export const runtime = 'nodejs';

// POST /api/payments/webhook - KOOMPI Cloud says a payment went through.
// Answer 2xx once handled: KOOMPI Cloud sends it again until it gets one.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let event;
  try {
    event = verifyEvent(rawBody, request.headers.get('x-koompi-pay-signature'));
  } catch (error) {
    console.warn('Payment event refused:', (error as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment.paid' && event.data.reference) {
    const db = await getDb();
    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    // The order this payment was started for; a second event changes nothing.
    await db.execute({
      sql: "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_id = ? AND status != 'paid'",
      args: [event.data.reference, event.data.id],
    });
  }
  return NextResponse.json({ received: true });
}
