import { PAYSTACK_PUBLIC_KEY } from '../utils/constants';
import {
  Currency,
  Channel,
  channelsFor,
  convertFromUsd,
  toPaystackAmount,
} from '../utils/plans';

export interface PaystackTxArgs {
  email: string;
  amountUsd: number;
  currency: Currency;          // The currency Paystack will actually charge in
  reference: string;
  planId: string;
  channels?: Channel[];        // Overrides the default for the currency
  metadata?: Record<string, unknown>;
}

export interface PaystackResult {
  status: 'success' | 'cancelled' | 'failed';
  reference?: string;
  error?: string;
}

/**
 * Build a self-contained HTML document that loads Paystack Inline and starts
 * a checkout immediately. The WebView screen renders this HTML, listens for
 * `paystack:*` postMessage events, and resolves accordingly.
 *
 * Why HTML-in-a-WebView instead of an external URL? Two reasons:
 *   1. No backend dependency — works with just the public key.
 *   2. We don't need a hosted page; the SDK runs inside the WebView itself.
 *
 * For production, replace this with a backend `POST /payments/initialize`
 * that returns an authorization_url and load THAT in the WebView. The
 * webhook side becomes the source of truth for subscription state.
 */
export function buildCheckoutHtml(args: PaystackTxArgs): string {
  const {
    email, amountUsd, currency, reference, planId, metadata = {},
    channels = channelsFor(currency),
  } = args;

  // Convert USD price to the chosen currency, then to Paystack subunits.
  const amountInCurrency = currency === 'USD' ? amountUsd : convertFromUsd(amountUsd, currency);
  const amount = toPaystackAmount(amountInCurrency);
  const metaJson = JSON.stringify({
    plan_id: planId,
    usd_amount: amountUsd,
    ...metadata,
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
<title>Mframapa Checkout</title>
<style>
  html, body {
    margin: 0; padding: 0; height: 100%; width: 100%;
    background: #06080d; color: #e0e0e0;
    font-family: -apple-system, system-ui, sans-serif;
    display: flex; align-items: center; justify-content: center;
  }
  .wrap { text-align: center; padding: 24px; }
  .spin { width: 28px; height: 28px; border: 3px solid #1f2937;
    border-top-color: #4ADE80; border-radius: 50%; margin: 0 auto 12px;
    animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="wrap">
  <div class="spin"></div>
  <div>Opening secure checkout…</div>
</div>
<script src="https://js.paystack.co/v2/inline.js"></script>
<script>
  function send(payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    } catch (e) {}
  }
  try {
    var popup = new PaystackPop();
    popup.newTransaction({
      key: ${JSON.stringify(PAYSTACK_PUBLIC_KEY)},
      email: ${JSON.stringify(email)},
      amount: ${amount},
      currency: ${JSON.stringify(currency)},
      reference: ${JSON.stringify(reference)},
      channels: ${JSON.stringify(channels)},
      metadata: ${metaJson},
      onSuccess: function (tx) {
        send({ event: 'paystack:success', reference: tx.reference });
      },
      onCancel: function () {
        send({ event: 'paystack:cancelled' });
      },
      onError: function (err) {
        send({ event: 'paystack:failed', error: (err && err.message) || 'Unknown error' });
      },
    });
  } catch (err) {
    send({ event: 'paystack:failed', error: (err && err.message) || 'Init failed' });
  }
</script>
</body>
</html>`;
}

export function generateReference(planId: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `mframapa-${planId}-${stamp}-${rand}`;
}

export function isPaystackConfigured(): boolean {
  return PAYSTACK_PUBLIC_KEY.length > 0;
}
