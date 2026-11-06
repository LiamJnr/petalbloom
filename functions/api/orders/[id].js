import { paymentIntentMatchesOrder } from '../../lib/handypay-payment.js'
import { toPublicOrderStatus } from '../../lib/public-order.js'
import { consumeRateLimit } from '../../lib/rate-limit.js'

const ORDER_STATUS_RATE_LIMIT = 30
const PAYMENT_VERIFY_COOLDOWN_SECONDS = 60

export async function onRequestGet({ params, env, request }) {
  const id = String(params.id || '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return json({ error: 'Invalid order reference.' }, 400)
  }

  try {
    const rateLimit = await consumeRateLimit({
      request,
      db: env.DB,
      salt: env.RATE_LIMIT_SALT,
      namespace: 'order-status',
      discriminator: id,
      limit: ORDER_STATUS_RATE_LIMIT,
    })
    if (!rateLimit.allowed) {
      return json({ error: 'Too many status requests. Please try again in a minute.' }, 429, {
        'Retry-After': String(rateLimit.retryAfterSeconds),
      })
    }
  } catch (error) {
    console.error('Order status rate limiter unavailable.', error)
    return json({ error: 'Order status is temporarily unavailable.' }, 503)
  }

  let order = await env.DB.prepare(
    'SELECT id, status, payment_intent_id, total_cents, payment_currency FROM orders WHERE id = ?',
  ).bind(id).first()

  if (!order) return json({ error: 'Order not found.' }, 404)

  // Webhooks are authoritative; this is a bounded fallback when one is delayed.
  if (order.status === 'pending' && env.HANDYPAY_API_KEY && order.payment_intent_id) {
    const claim = await env.DB.prepare(
      `UPDATE orders SET last_payment_check_at = datetime('now')
       WHERE id = ? AND status = 'pending'
         AND (last_payment_check_at IS NULL OR last_payment_check_at <= datetime('now', ?))`,
    ).bind(order.id, `-${PAYMENT_VERIFY_COOLDOWN_SECONDS} seconds`).run()
    if (claim.meta.changes !== 1) return json({ order: toPublicOrderStatus(order) })

    try {
      const verifyRes = await fetch(`https://api.handypay.me/api/v1/payment-intents/${encodeURIComponent(order.payment_intent_id)}`, {
        headers: {
          Authorization: `Bearer ${env.HANDYPAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json()
        if (paymentIntentMatchesOrder(verifyData?.data, order)) {
          await env.DB.prepare(
            `UPDATE orders
             SET status = 'paid', paid_at = datetime('now')
             WHERE id = ? AND payment_intent_id = ? AND total_cents = ? AND payment_currency = ? AND status = 'pending'`,
          ).bind(order.id, order.payment_intent_id, order.total_cents, order.payment_currency).run()
          order.status = 'paid'
        }
      }
    } catch (err) {
      console.warn('HandyPay active verification check error:', err)
    }
  }

  return json({ order: toPublicOrderStatus(order) })
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  })
}
