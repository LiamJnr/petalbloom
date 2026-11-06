import assert from 'node:assert/strict'
import test from 'node:test'
import { paymentIntentMatchesOrder } from './handypay-payment.js'

const order = {
  id: 'f0f113d6-7d5b-47a4-9e9b-2b130ffc5ef5',
  payment_intent_id: 'pi_handypay_123',
  total_cents: 125430,
  payment_currency: 'GHS',
}

const intent = {
  id: order.payment_intent_id,
  status: 'succeeded',
  amount: order.total_cents,
  currency: 'ghs',
  metadata: { order_id: order.id },
}

test('accepts an exactly matching succeeded HandyPay PaymentIntent', () => {
  assert.equal(paymentIntentMatchesOrder(intent, order), true)
})

for (const [name, mutation] of [
  ['an unsuccessful intent', { status: 'requires_payment_method' }],
  ['a different intent ID', { id: 'pi_other' }],
  ['a different amount', { amount: 125431 }],
  ['a different currency', { currency: 'USD' }],
  ['a different order ID in metadata', { metadata: { order_id: 'different-order' } }],
]) {
  test(`rejects ${name}`, () => {
    assert.equal(paymentIntentMatchesOrder({ ...intent, ...mutation }, order), false)
  })
}
