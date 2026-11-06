const STRIPE_JS_URL = 'https://js.stripe.com/v3/'

export async function startCheckout({ items, buyer, delivery, card_note, promo_code, onCancel }) {
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

  await openPaymentDialog({ orderId, clientSecret, publishableKey, stripeAccount, onCancel })
}

async function openPaymentDialog({ orderId, clientSecret, publishableKey, stripeAccount, onCancel }) {
  document.getElementById('handypay-payment-dialog')?.remove()
  const dialog = document.createElement('div')
  dialog.id = 'handypay-payment-dialog'
  dialog.className = 'handypay-payment-backdrop'
  dialog.innerHTML = `<section class="handypay-payment-dialog" role="dialog" aria-modal="true" aria-labelledby="handypay-payment-title"><button class="handypay-payment-close" type="button" aria-label="Close payment form">×</button><div class="handypay-payment-kicker"><span></span> Secure payment</div><h2 id="handypay-payment-title">One more beautiful step.</h2><p class="handypay-payment-intro">Your delivery details are saved. Choose a payment method to place your Petal &amp; Bloom order.</p><form class="handypay-payment-form" novalidate><div id="handypay-payment-element" aria-label="Payment details"></div><p class="handypay-payment-error" role="alert" aria-live="polite"></p><button class="handypay-payment-submit" type="submit"><span>Place secure order</span><span aria-hidden="true">→</span></button></form><p class="handypay-payment-footnote"><span aria-hidden="true">⌁</span> Card details are encrypted and never stored by Petal &amp; Bloom.</p></section>`
  document.body.append(dialog)
  document.body.classList.add('payment-dialog-open')

  const close = () => {
    dialog.remove()
    document.body.classList.remove('payment-dialog-open')
    if (typeof onCancel === 'function') onCancel()
  }
  dialog.querySelector('.handypay-payment-close')?.addEventListener('click', close)
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.isConnected) close() }, { once: true })

  let Stripe
  try {
    Stripe = await loadStripe()
  } catch (loadError) {
    dialog.remove()
    document.body.classList.remove('payment-dialog-open')
    throw loadError
  }
  const stripe = Stripe(publishableKey, { stripeAccount })
  const elements = stripe.elements({ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#9d007e', colorBackground: '#ffffff', colorText: '#1e1e24', colorDanger: '#b42318', fontFamily: 'Geist, system-ui, sans-serif', borderRadius: '10px', spacingUnit: '4px' } } })
  elements.create('payment', { layout: { type: 'tabs', defaultCollapsed: false } }).mount('#handypay-payment-element')

  const form = dialog.querySelector('.handypay-payment-form')
  const error = dialog.querySelector('.handypay-payment-error')
  const submit = dialog.querySelector('.handypay-payment-submit')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
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
  dialog.querySelector('.handypay-payment-close')?.focus()
}

function loadStripe() {
  if (typeof window.Stripe === 'function') return Promise.resolve(window.Stripe)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = STRIPE_JS_URL
    script.async = true
    script.onload = () => typeof window.Stripe === 'function' ? resolve(window.Stripe) : reject(new Error('Secure payment form could not load.'))
    script.onerror = () => reject(new Error('Secure payment form could not load.'))
    document.head.append(script)
  })
}
