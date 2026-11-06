import { consumeRateLimit } from '../../../lib/rate-limit.js'
import { isReceiptToken, receiptTokenMatches } from '../../../lib/receipt-access.js'

const RECEIPT_RATE_LIMIT = 10

export async function onRequestPost({ params, env, request }) {
  const id = String(params.id || '')
  const token = request.headers.get('X-Receipt-Token') || ''
  if (!isOrderId(id) || !isReceiptToken(token)) return unavailable()

  try {
    const rateLimit = await consumeRateLimit({
      request,
      db: env.DB,
      salt: env.RATE_LIMIT_SALT,
      namespace: 'receipt-download',
      discriminator: id,
      limit: RECEIPT_RATE_LIMIT,
    })
    if (!rateLimit.allowed) {
      return json({ error: 'Too many receipt requests. Please try again in a minute.' }, 429, {
        'Retry-After': String(rateLimit.retryAfterSeconds),
      })
    }
  } catch (error) {
    console.error('Receipt rate limiter unavailable.', error)
    return json({ error: 'Receipt is temporarily unavailable.' }, 503)
  }

  const order = await env.DB.prepare(
    `SELECT id, status, purchaser_email, cart_json, buyer_json, delivery_json,
            total_cents, subtotal_usd_cents, delivery_fee_usd_cents, discount_usd_cents, promo_code,
            payment_currency, payment_provider, payment_intent_id, created_at, paid_at, receipt_access_hash
     FROM orders WHERE id = ?`,
  ).bind(id).first()

  if (order?.status !== 'paid' || !await receiptTokenMatches(token, order.receipt_access_hash)) {
    return unavailable()
  }

  const { receipt_access_hash: _receiptAccessHash, ...receiptOrder } = order
  return json({ order: receiptOrder })
}

function isOrderId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function unavailable() {
  return json({ error: 'Receipt is unavailable.' }, 404)
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  })
}
