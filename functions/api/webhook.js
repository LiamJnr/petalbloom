import { paymentIntentMatchesOrder } from '../lib/handypay-payment.js'

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-handypay-signature') || ''
  const valid = await hasValidSignature(rawBody, signature, env.HANDYPAY_WEBHOOK_SECRET)
  if (!valid) return new Response('Invalid signature', { status: 401 })

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!event?.id || !event?.type) return new Response('Invalid event', { status: 400 })
  const eventInsert = await env.DB.prepare(
    'INSERT OR IGNORE INTO payment_webhook_events (id, provider, event_type) VALUES (?, ?, ?)',
  ).bind(String(event.id), 'handypay', String(event.type)).run()
  if (eventInsert.meta.changes !== 1) return new Response('OK', { status: 200 })

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data
    const orderId = String(intent?.metadata?.order_id || '')
    if (!orderId) return new Response('OK', { status: 200 })
    const order = await env.DB.prepare(
      `SELECT id, payment_intent_id, total_cents, payment_currency FROM orders WHERE id = ?`,
    ).bind(orderId).first()

    if (!order || !paymentIntentMatchesOrder(intent, order)) {
      console.error('Rejected HandyPay payment event because it did not match its order.', {
        orderId,
        intentId: intent?.id,
      })
      return new Response('OK', { status: 200 })
    }

    await env.DB.prepare(
      `UPDATE orders
       SET status = 'paid', paid_at = datetime('now')
       WHERE id = ? AND payment_intent_id = ? AND total_cents = ? AND payment_currency = ? AND status = 'pending'`,
    ).bind(order.id, order.payment_intent_id, order.total_cents, order.payment_currency).run()
  }

  return new Response('OK', { status: 200 })
}

export async function hasValidSignature(rawBody, signature, secret) {
  const prefix = 'sha256='
  if (!secret || !signature.startsWith(prefix)) return false
  const signatureHex = signature.slice(prefix.length)
  if (!/^[0-9a-f]{64}$/i.test(signatureHex)) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const expected = new Uint8Array(mac)
  const received = new Uint8Array(signatureHex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)))
  if (expected.length !== received.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected[index] ^ received[index]
  }
  return mismatch === 0
}
