# Petal & Bloom — HandyPay Checkout

This Cloudflare Pages storefront uses D1 and HandyPay PaymentIntents to provide a Petal & Bloom-branded embedded checkout. Stripe's Payment Element securely collects payment details in the browser; the application never receives raw card data.

## Payment flow

1. The browser sends cart, customer, and delivery details to `/api/checkout`.
2. A Pages Function validates trusted catalogue pricing, creates a pending D1 order, then creates a HandyPay PaymentIntent.
3. The browser receives only the PaymentIntent client secret, publishable key, and connected-account ID. It mounts Stripe's Payment Element inside the Petal & Bloom payment dialog.
4. HandyPay sends signed webhooks to `/api/webhook`. The endpoint verifies the HMAC-SHA256 `X-HandyPay-Signature`, records the event ID, and marks only a matching order paid.
5. The confirmation page polls order status. Its rate-limited HandyPay lookup is a fallback only; webhooks remain the payment source of truth.

## Cloudflare setup

The project is configured for the separate D1 database `petal-bloom-handypay-db` with binding `DB`. In the separate HandyPay Pages project, bind that database as `DB`.

Apply the fresh schema once:

```bash
node "./node_modules/wrangler/bin/wrangler.js" d1 execute petal-bloom-handypay-db --remote --file=./schema.sql
```

Set encrypted Pages secrets with Wrangler; do not commit real values:

```bash
node "./node_modules/wrangler/bin/wrangler.js" pages secret put HANDYPAY_API_KEY --project-name petalnbloom
node "./node_modules/wrangler/bin/wrangler.js" pages secret put HANDYPAY_WEBHOOK_SECRET --project-name petalnbloom
node "./node_modules/wrangler/bin/wrangler.js" pages secret put RATE_LIMIT_SALT --project-name petalnbloom
```

The store charges in USD. No currency or exchange-rate environment variable is required: the checkout creates each HandyPay PaymentIntent with `currency: "usd"` and the server-owned USD amount in cents.

## HandyPay webhook

After deployment, register `https://petalnbloom.pages.dev/api/webhook` in HandyPay's merchant portal or API using the same test/live mode as the API key. Subscribe to `payment_intent.succeeded` at minimum. Store the one-time signing secret as `HANDYPAY_WEBHOOK_SECRET`.

## Local testing

Copy `.env.example` to `.dev.vars`, fill it with test-mode HandyPay values, then run:

```bash
node "./node_modules/wrangler/bin/wrangler.js" d1 execute petal-bloom-handypay-db --local --file=./schema.sql
node "./node_modules/wrangler/bin/wrangler.js" pages dev . --port=8788
```

Run unit tests with:

```bash
node --test "functions/**/*.test.mjs"
```
