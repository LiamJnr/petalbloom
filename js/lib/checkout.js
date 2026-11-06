const STRIPE_JS_URL = 'https://js.stripe.com/v3/'
let stripeJsPromise

// Start this as soon as a buyer reaches Review & Pay. The payment fields still
// wait for a server-created PaymentIntent before they mount.
export function preloadStripeJs() {
  return loadStripe()
}

export async function startCheckout({ items, buyer, delivery, card_note, promo_code, paymentMount }) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, buyer, delivery, card_note, promo_code: promo_code || undefined }),
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: 'Checkout could not be started.' }))
    throw new Error(error || 'Checkout could not be started.')
  }

  const payment = await response.json()
  const { orderId, receipt_token: receiptToken, client_secret: clientSecret, publishable_key: publishableKey, stripe_account: stripeAccount } = payment
  if (!orderId || !receiptToken || !clientSecret || !publishableKey || !stripeAccount) {
    throw new Error('Checkout could not be prepared. Please try again.')
  }
  if (!orderId || !receiptToken) throw new Error('Checkout could not be started.')

  try {
    sessionStorage.setItem(`petal_bloom_receipt_${orderId}`, receiptToken)
  } catch {
    throw new Error('Your browser could not securely save receipt access. Please allow session storage and try again.')
  }

  await mountPaymentSurface({ orderId, clientSecret, publishableKey, stripeAccount, paymentMount })
}

async function mountPaymentSurface({ orderId, clientSecret, publishableKey, stripeAccount, paymentMount }) {
  if (!(paymentMount instanceof HTMLElement) || !paymentMount.isConnected) {
    throw new Error('The secure payment area is unavailable. Please refresh and try again.')
  }

  paymentMount.innerHTML = `<section class="handypay-payment-surface" aria-labelledby="handypay-payment-title"><div class="handypay-payment-kicker"><span></span> Secure payment</div><h3 id="handypay-payment-title">Payment details</h3><p class="handypay-payment-intro">Choose a payment method to place your Petal &amp; Bloom order.</p><div class="handypay-payment-form"><div id="handypay-payment-element" aria-label="Payment details"></div><p class="handypay-payment-error" role="alert" aria-live="polite"></p><button class="handypay-payment-submit" type="button"><span>Place secure order</span><span aria-hidden="true">→</span></button></div><p class="handypay-payment-footnote"><span aria-hidden="true">⌁</span> Card details are encrypted and never stored by Petal &amp; Bloom.</p></section>`

  let Stripe
  try {
    Stripe = await loadStripe()
  } catch (loadError) {
    paymentMount.replaceChildren()
    throw loadError
  }
  const stripe = Stripe(publishableKey, { stripeAccount })
  const elements = stripe.elements({ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#9d007e', colorBackground: '#ffffff', colorText: '#1e1e24', colorDanger: '#b42318', fontFamily: 'Geist, system-ui, sans-serif', borderRadius: '10px', spacingUnit: '4px' } } })
  elements.create('payment', { layout: { type: 'tabs', defaultCollapsed: false } }).mount('#handypay-payment-element')

  const error = paymentMount.querySelector('.handypay-payment-error')
  const submit = paymentMount.querySelector('.handypay-payment-submit')
  submit.addEventListener('click', async () => {
    error.textContent = ''
    submit.disabled = true
    submit.firstElementChild.textContent = 'Confirming payment…'
    const returnUrl = `${window.location.origin}/?view=order-confirmed&order=${encodeURIComponent(orderId)}`
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl }, redirect: 'if_required' })
    if (result.error) {
      error.textContent = result.error.message || 'Your payment could not be confirmed. Please try another method.'
      submit.disabled = false
      submit.firstElementChild.textContent = 'Place secure order'
      return
    }
    window.location.assign(returnUrl)
  })
  submit.focus()
}

function loadStripe() {
  if (typeof window.Stripe === 'function') return Promise.resolve(window.Stripe)
  if (stripeJsPromise) return stripeJsPromise

  stripeJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = STRIPE_JS_URL
    script.async = true
    script.onload = () => typeof window.Stripe === 'function' ? resolve(window.Stripe) : reject(new Error('Secure payment form could not load.'))
    script.onerror = () => reject(new Error('Secure payment form could not load.'))
    document.head.append(script)
  })
  stripeJsPromise.catch(() => { stripeJsPromise = undefined })
  return stripeJsPromise
}
