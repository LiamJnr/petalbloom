import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { applySecurityHeaders, SECURITY_HEADERS } from './security-headers.js'

test('security headers protect browser responses without removing existing headers', () => {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'X-Frame-Options': 'SAMEORIGIN',
  })

  applySecurityHeaders(headers)

  assert.equal(headers.get('Content-Type'), 'application/json; charset=utf-8')
  assert.equal(headers.get('X-Frame-Options'), 'DENY')
  assert.equal(headers.get('Cross-Origin-Opener-Policy'), 'same-origin')
  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff')
  assert.match(headers.get('Content-Security-Policy'), /https:\/\/js\.stripe\.com/)
  assert.match(headers.get('Content-Security-Policy'), /https:\/\/fonts\.googleapis\.com/)
  assert.match(headers.get('Content-Security-Policy'), /frame-ancestors 'none'/)
})

test('static Pages policy matches the Function security policy', async () => {
  const policy = await readFile(new URL('../../_headers', import.meta.url), 'utf8')

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    assert.match(policy, new RegExp(`${name}: ${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
  }
})

test('static HTML does not need inline event handlers that the policy would block', async () => {
  const files = ['../../index.html', '../../invoice-xf32nml4ig.html']

  for (const file of files) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i)
  }
})

test('Apple Pay domain association file has its required content type', async () => {
  const policy = await readFile(new URL('../../_headers', import.meta.url), 'utf8')
  assert.match(policy, /\/\.well-known\/apple-developer-merchantid-domain-association\s+Content-Type: application\/text/)
})
