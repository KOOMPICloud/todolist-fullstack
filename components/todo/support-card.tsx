'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';
import * as api from '@/lib/api';
import { Button } from '@/components/ui/button';

function price(amount: string, currency: 'USD' | 'KHR') {
  return currency === 'KHR' ? `${Number(amount).toLocaleString()} ៛` : `$${Number(amount).toFixed(2)}`;
}

/**
 * A one-time payment through KOOMPI Cloud (lib/payments.ts). Hidden until
 * payments are turned on for the app. After paying, the customer comes back
 * with ?payment_id=…, and the server checks that payment before showing it paid.
 */
export function SupportCard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.listOrders>> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (paymentId?: string | null) => {
    try {
      const next = await api.listOrders(paymentId);
      setData(next);
      return next;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    if (!paymentId) {
      // Load once on mount, as use-todos does (the state is set after the fetch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
      return;
    }
    // Back from paying: check it (a few times: the bank can take a moment), then tidy the address.
    params.delete('payment_id');
    const rest = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const next = await load(paymentId);
      const order = next?.orders.find((o) => o.payment_id === paymentId);
      if (order?.status === 'paid') {
        toast.success('Payment received. Thank you!');
      } else if (++tries < 5) {
        timer = setTimeout(check, 3000);
      } else {
        toast.message('Your payment is being confirmed. It shows here once it is.');
      }
    };
    void check();
    return () => clearTimeout(timer);
  }, [load]);

  if (!data?.enabled || data.products.length === 0) return null;
  const product = data.products[0]!;
  const paid = data.orders.some((o) => o.product_id === product.id && o.status === 'paid');

  const buy = async () => {
    setBusy(true);
    try {
      const { checkoutUrl } = await api.checkout(product.id);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error((error as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div className="min-w-0">
        <p className="font-medium">{paid ? `You're a ${product.name.toLowerCase()}. Thank you!` : product.description}</p>
        <p className="text-sm text-muted-foreground">
          {paid
            ? 'Your payment went through.'
            : `${price(product.amount, product.currency)} · pay with ABA, ACLEDA, Wing or any KHQR app`}
        </p>
      </div>
      {!paid && (
        <Button onClick={buy} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
          Pay {price(product.amount, product.currency)}
        </Button>
      )}
    </div>
  );
}
