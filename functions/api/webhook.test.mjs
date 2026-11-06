import assert from 'node:assert/strict'
import test from 'node:test'
import { hasValidSignature } from './webhook.js'

const secret = 'webhook-test-secret'
const payload = '{"id":"evt_123","type":"payment_intent.succeeded"}'

async function signatureFor(value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
  return `sha256=${[...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

test('accepts a valid HandyPay HMAC-SHA256 signature', async () => {
  assert.equal(await hasValidSignature(payload, await signatureFor(payload), secret), true)
})

test('rejects a malformed, changed, or differently signed payload', async () => {
  assert.equal(await hasValidSignature(payload, 'sha256=abcd', secret), false)
  assert.equal(await hasValidSignature(`${payload}x`, await signatureFor(payload), secret), false)
  assert.equal(await hasValidSignature(payload, await signatureFor(payload), 'other-secret'), false)
})
