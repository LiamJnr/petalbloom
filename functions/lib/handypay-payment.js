const ISO_CURRENCY_CODE = /^[A-Z]{3}$/

export function normaliseCurrency(value) {
  return String(value ?? '').trim().toUpperCase()
}

export function isValidCurrency(value) {
  return ISO_CURRENCY_CODE.test(normaliseCurrency(value))
}

// A fulfilled PaymentIntent must agree with every immutable value we recorded
// before its client secret was ever exposed to the browser.
export function paymentIntentMatchesOrder(intent, order, { requireMetadata = true } = {}) {
  const intentId = String(intent?.id || intent?.payment_intent_id || '')
  const metadataMatches = !requireMetadata || String(intent?.metadata?.order_id || '') === String(order?.id || '')

  return (
    intent?.status === 'succeeded' &&
    intentId === String(order?.payment_intent_id || '') &&
    metadataMatches &&
    Number.isSafeInteger(Number(order?.total_cents)) &&
    Number(intent?.amount) === Number(order?.total_cents) &&
    isValidCurrency(order?.payment_currency) &&
    normaliseCurrency(intent?.currency) === normaliseCurrency(order?.payment_currency)
  )
}
