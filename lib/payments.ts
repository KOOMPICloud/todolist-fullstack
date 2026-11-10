import crypto from 'node:crypto';
import { isIP } from 'node:net';

/**
 * Payments through KOOMPI Cloud: customers pay with ABA, ACLEDA, Wing or any
 * KHQR banking app. Server side only: KOOMPI_PAY_KEY must never reach the
 * browser.
 *
 * KOOMPI Cloud sets these when payments are turned on for the app (Ask AI's
 * add_payments, or Payments in the dashboard):
 *   KOOMPI_PAY_URL             where to ask for a checkout
 *   KOOMPI_PAY_KEY             the app's key (a test key in previews: the bank is simulated)
 *   KOOMPI_PAY_WEBHOOK_SECRET  checks the "payment.paid" events KOOMPI Cloud sends
 *
 * The flow (app/api/payments/):
 *   1. Save the order as unpaid; startCheckout() gives a link; send the customer there.
 *   2. KOOMPI Cloud POSTs "payment.paid" to /api/payments/webhook: verifyEvent() it,
 *      mark the order paid.
 *   3. The customer comes back with ?payment_id=…: getPayment() says whether it is paid,
 *      in case the event has not come yet.
 * Mark an order paid only from the event or getPayment(), never from the address alone.
 */

export interface Payment {
  id: string;
  mode: 'live' | 'test';
  status: 'pending' | 'paid' | 'expired' | 'failed';
  amount: string;
  currency: 'USD' | 'KHR';
  reference?: string;
  description?: string;
  checkoutUrl?: string;
  paidAt?: string;
  bank?: string;
  createdAt: string;
}

export interface PaymentEvent {
  id: string;
  type: 'payment.paid';
  created: number;
  data: Payment;
}

/** Whether payments are turned on for this app. */
export function paymentsEnabled(): boolean {
  return !!(process.env.KOOMPI_PAY_URL && process.env.KOOMPI_PAY_KEY);
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const base = process.env.KOOMPI_PAY_URL;
  const key = process.env.KOOMPI_PAY_KEY;
  if (!base || !key) throw new Error('Payments are not turned on for this app');
  const res = await fetch(base + path, {
    method,
    headers: { authorization: `Bearer ${key}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    throw new Error(json?.message || `KOOMPI Cloud payments answered ${res.status}`);
  }
  return json.data as T;
}

/**
 * Start a payment. amount: dollars as text ("1.99") or whole riels ("8000").
 * successUrl: the page the customer comes back to, after paying or cancelling
 * (KOOMPI Cloud adds ?payment_id=…): `${appOrigin(request.headers)}/thanks`. reference: your order id. The link lasts 15 minutes.
 */
export function startCheckout(input: {
  amount: string;
  currency?: 'USD' | 'KHR';
  successUrl: string;
  reference: string;
  description?: string;
  items?: Array<{ name: string; price: number; quantity?: number }>;
  metadata?: Record<string, string>;
}): Promise<Payment> {
  return call<Payment>('POST', '/checkout', { currency: 'USD', ...input });
}

/** A payment, asking the bank if it is still pending. */
export function getPayment(id: string): Promise<Payment> {
  return call<Payment>('GET', `/payments/${encodeURIComponent(id)}`);
}

/**
 * Check an event KOOMPI Cloud sent and return it. rawBody: the request body as
 * text, exactly as received. Throws when it is not from KOOMPI Cloud.
 */
export function verifyEvent(rawBody: string, signature: string | null, toleranceSeconds = 300): PaymentEvent {
  const secret = process.env.KOOMPI_PAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('KOOMPI_PAY_WEBHOOK_SECRET is not set');
  const parts = Object.fromEntries((signature ?? '').split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || !parts.v1) throw new Error('No KOOMPI Cloud signature');
  if (Math.abs(Date.now() / 1000 - t) > toleranceSeconds) throw new Error('The event is too old');
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex'));
  const given = Buffer.from(String(parts.v1));
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    throw new Error('The signature does not match');
  }
  return JSON.parse(rawBody) as PaymentEvent;
}

/** A host only this server or its network can reach: 127.x, ::1, 0.0.0.0, a private or link-local IP, localhost, *.local, *.internal, one label. */
function isInternalHost(host: string): boolean {
  const name = host.toLowerCase().replace(/:\d+$/, '').replace(/^\[(.*)\]$/, '$1').replace(/\.$/, '');
  const ip = isIP(name);
  if (ip === 4) return /^(?:0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\.|^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(name);
  if (ip === 6) return name === '::' || name === '::1' || /^(?:f[cd]|fe[89ab]|::ffff:)/.test(name);
  return !name.includes('.') || /(?:^|\.)localhost$|\.(?:local|internal)$/.test(name);
}

/**
 * This app's public address, for the pages people come back to (payments,
 * sign-in): NEXT_PUBLIC_APP_URL, else the address KOOMPI Cloud's proxy says
 * (x-forwarded-host, in live previews too), else Host. '' when all there is
 * is an address only this server can reach (Next.js's own 127.0.0.1:3001):
 * `${appOrigin(h)}/thanks` is then the path "/thanks", which KOOMPI Cloud
 * puts on the app's public address. Never build one from request.url.
 */
export function appOrigin(headers: Headers): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  const host = (headers.get('x-forwarded-host') ?? headers.get('host') ?? '').split(',')[0]!.trim();
  if (!host || isInternalHost(host)) return '';
  return `${(headers.get('x-forwarded-proto') ?? 'https').split(',')[0]!.trim()}://${host}`;
}
