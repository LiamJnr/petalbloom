import assert from 'node:assert/strict'
import test from 'node:test'
import { toPublicOrderStatus } from './public-order.js'

test('public order status excludes all customer, delivery, cart, and payment data', () => {
  const publicOrder = toPublicOrderStatus({
    id: 'order-id',
    status: 'paid',
    purchaser_email: 'customer@example.com',
    payment_intent_id: 'pi_handypay_123',
    total_cents: 125430,
    payment_currency: 'USD',
    cart_json: '[{"name":"Bouquet"}]',
    buyer_json: '{"name":"Customer"}',
    delivery_json: '{"street":"Private address"}',
    created_at: '2026-09-27 12:00:00',
    paid_at: '2026-09-27 12:01:00',
    receipt_access_hash: 'private-receipt-access-hash',
  })

  assert.deepEqual(publicOrder, { status: 'paid' })
})
