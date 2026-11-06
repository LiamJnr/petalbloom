const ISO_CURRENCY_CODE = /^[A-Z]{3}$/

export function normaliseCurrency(value) {
  return String(value ?? '').trim().toUpperCase()
}

export function isValidCurrency(value) {
  return ISO_CURRENCY_CODE.test(normaliseCurrency(value))
}

// A fulfilled PaymentIntent must agree with every immutable value we recorded
// before its client secret was ever exposed to the browser.
export function paymentIntentMatchesOrder(intent, order) {
  return (
    intent?.status === 'succeeded' &&
    String(intent?.id || '') === String(order?.payment_intent_id || '') &&
    String(intent?.metadata?.order_id || '') === String(order?.id || '') &&
    Number.isSafeInteger(Number(order?.total_cents)) &&
    Number(intent?.amount) === Number(order?.total_cents) &&
    isValidCurrency(order?.payment_currency) &&
    normaliseCurrency(intent?.currency) === normaliseCurrency(order?.payment_currency)
  )
}
