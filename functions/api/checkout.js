import { validateDelivery } from '../lib/delivery.js'
import { consumeRateLimit } from '../lib/rate-limit.js'
import { createReceiptToken, hashReceiptToken } from '../lib/receipt-access.js'
import { calculatePromotion } from '../lib/promotions.js'
import { expandCuratedCombo, getCheckoutProduct } from '../lib/combo-order.js'
import { getKingsbiteFreeDeliveryOffer, hasFreeDelivery } from '../../js/lib/kingsbite-delivery.js'
import { calculateProcessingFee } from '../../js/lib/processing-fee.js'

const MAX_LINE_ITEMS = 25
const MAX_QUANTITY_PER_LINE = 20
const MAX_CHECKOUT_BODY_BYTES = 32 * 1024

export async function onRequestPost(context) {
  try {
    return await createCheckout(context)
  } catch (error) {
    console.error('Checkout creation failed', error)
    const message = error instanceof Error
      ? `Checkout setup error: ${error.message}`
      : 'Checkout could not be prepared. Please try again.'
    return json({ error: message }, 500)
  }
}

async function createCheckout({ request, env }) {
  const missing = ['DB', 'HANDYPAY_API_KEY', 'RATE_LIMIT_SALT'].filter((key) => !env[key])
  if (missing.length) return json({ error: `Checkout is not configured: ${missing.join(', ')}` }, 500)

  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_CHECKOUT_BODY_BYTES) {
    return json({ error: 'Checkout request is too large.' }, 413)
  }

  const rateLimit = await consumeRateLimit({
    request,
    db: env.DB,
    salt: env.RATE_LIMIT_SALT,
    namespace: 'checkout',
    limit: 5,
  })
  if (!rateLimit.allowed) {
    return json({ error: 'Too many checkout attempts. Please try again in a minute.' }, 429, {
      'Retry-After': String(rateLimit.retryAfterSeconds),
    })
  }

  const currency = 'USD'

  let body
  try {
    body = await parseCheckoutBody(request)
  } catch (error) {
    if (error?.code === 'checkout-body-too-large') {
      return json({ error: 'Checkout request is too large.' }, 413)
    }
    return json({ error: 'Invalid checkout request.' }, 400)
  }

  let items
  let buyer
  let delivery
  try {
    items = validateItems(body.items)
    buyer = validateBuyer(body.buyer)
    delivery = validateDelivery(body.delivery, body.card_note)
  } catch (error) {
    return json({ error: error.message }, 400)
  }

  const subtotalUsdCents = items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0)
  const subtotalUsd = subtotalUsdCents / 100
  const kingsbiteDeliveryOffer = getKingsbiteFreeDeliveryOffer(items, subtotalUsd)
  const deliveryFeeUsdCents = hasFreeDelivery(items, subtotalUsd) ? 0 : 1_400
  let promotion
  try {
    promotion = calculatePromotion(body.promo_code, subtotalUsdCents)
  } catch (error) {
    return json({ error: error.message }, 400)
  }
  if (kingsbiteDeliveryOffer.isEligible && promotion) {
    return json({ error: 'The Kingsbite free-delivery offer cannot be combined with a promo code.' }, 400)
  }
  if (promotion?.firstPaidOrderOnly) {
    const previousPaidOrder = await env.DB.prepare(
      `SELECT 1 FROM orders WHERE purchaser_email = ? AND status = 'paid' LIMIT 1`,
    ).bind(buyer.email).first()
    if (previousPaidOrder) {
      return json({ error: 'BLOOM10 is available on a customer’s first paid order only.' }, 400)
    }
  }

  const discountUsdCents = promotion?.discountUsdCents || 0
  const baseOrderUsdCents = subtotalUsdCents + deliveryFeeUsdCents - discountUsdCents
  const { finalTotalCents: totalUsdCents, feeCents: processingFeeUsdCents, feeUsd: processingFeeUsd, finalTotalUsd: totalUsd } = calculateProcessingFee(baseOrderUsdCents)
  const deliveryFeeUsd = deliveryFeeUsdCents / 100
  const discountUsd = discountUsdCents / 100
  const orderId = crypto.randomUUID()
  const receiptToken = createReceiptToken()
  const receiptAccessHash = await hashReceiptToken(receiptToken)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const deliveryWithFee = {
    ...delivery,
    delivery_fee_usd: deliveryFeeUsd,
    delivery_fee_usd_cents: deliveryFeeUsdCents,
    discount_usd_cents: discountUsdCents,
    processing_fee_usd: processingFeeUsd,
    processing_fee_usd_cents: processingFeeUsdCents,
    promo_code: promotion?.code || null,
    delivery_offer: kingsbiteDeliveryOffer.isEligible ? 'KINGSBITE_FREE_DELIVERY' : null,
  }

  await env.DB.prepare(
    `INSERT INTO orders (id, status, purchaser_email, cart_json, buyer_json, delivery_json, total_cents,
                        subtotal_usd_cents, delivery_fee_usd_cents, discount_usd_cents, promo_code,
                        payment_currency, payment_provider, receipt_access_hash)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    orderId,
    buyer.email,
    JSON.stringify(items),
    JSON.stringify(buyer),
    JSON.stringify(deliveryWithFee),
    totalUsdCents,
    subtotalUsdCents,
    deliveryFeeUsdCents,
    discountUsdCents,
    promotion?.code || null,
    currency,
    'handypay',
    receiptAccessHash,
  ).run()

  const handypayResponse = await fetch('https://api.handypay.me/api/v1/payment-intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.HANDYPAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: totalUsdCents,
      currency: currency.toLowerCase(),
      description: checkoutDescription(items),
      customer_email: buyer.email,
      pass_fees_to_customer: false,
      // Our Live account uses HandyPay's eligible platform/destination-payment
      // scope rather than direct connected-account card charges.
      charge_scope: 'platform',
      metadata: {
        order_id: orderId,
        buyer_name: buyer.name,
        item_count: String(itemCount),
        total_usd: `$${totalUsd.toFixed(2)}`,
        delivery_date: delivery.delivery_date || '',
      },
    }),
  })

  const handypayData = await handypayResponse.json().catch(() => null)
  const intent = handypayData?.data
  // HandyPay returns the Stripe identifier as `payment_intent_id` for its
  // embedded-payment response, rather than the generic `id` used elsewhere.
  const paymentIntentId = String(intent?.payment_intent_id || '').trim()
  const clientSecret = String(intent?.client_secret || '').trim()
  const publishableKey = String(intent?.publishable_key || '').trim()
  const chargeScope = String(intent?.charge_scope || '').trim()
  const stripeAccount = String(intent?.stripe_account || '').trim()
  const needsStripeAccount = chargeScope !== 'platform'
  if (!handypayResponse.ok || !paymentIntentId || !clientSecret || !publishableKey || (needsStripeAccount && !stripeAccount)) {
    const providerError = handypayData?.error
    const requestId = String(handypayData?.request_id || '').trim()
    const providerCode = String(providerError?.code || '').trim()
    const providerMessage = String(providerError?.message || '').trim()
    console.error('HandyPay PaymentIntent creation was rejected or incomplete.', {
      status: handypayResponse.status,
      providerCode: providerCode || null,
      requestId: requestId || null,
      responseHasIntent: Boolean(paymentIntentId),
      responseHasClientSecret: Boolean(clientSecret),
      responseHasPublishableKey: Boolean(publishableKey),
      responseHasStripeAccount: Boolean(stripeAccount),
      chargeScope: chargeScope || null,
    })
    await env.DB.prepare(
      `UPDATE orders SET status = 'checkout_failed' WHERE id = ? AND status = 'pending'`,
    ).bind(orderId).run()
    const detail = providerMessage
      || (handypayResponse.ok
        ? 'HandyPay returned an incomplete payment configuration.'
        : `HandyPay rejected the payment setup (HTTP ${handypayResponse.status}).`)
    return json({
      error: detail,
      provider_error_code: providerCode || undefined,
      provider_request_id: requestId || undefined,
    }, 502)
  }

  await env.DB.prepare(
    `UPDATE orders SET payment_intent_id = ? WHERE id = ? AND status = 'pending'`
  ).bind(paymentIntentId, orderId).run()

  return json({
    client_secret: clientSecret,
    publishable_key: publishableKey,
    stripe_account: stripeAccount,
    charge_scope: chargeScope,
    payment_intent_id: paymentIntentId,
    orderId,
    receipt_token: receiptToken,
  })
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your flower bag is empty.')
  if (items.length > MAX_LINE_ITEMS) throw new Error('Your flower bag has too many different items.')

  const validatedItems = items.flatMap((item) => {
    const product = getCheckoutProduct(String(item?.slug || ''))
    const sizeId = String(item?.size_id || '').trim()
    const vaseId = String(item?.vase_id || '').trim()
    const quantity = Number(item?.quantity)
    const giftMessage = String(item?.giftMessage || item?.gift_message || '').trim().slice(0, 250)

    if (!product) throw new Error('One of the arrangements in your bag is no longer available.')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new Error('Please choose a valid quantity for every arrangement.')
    }

    if (product.isCombo) {
      const defaultSize = product.sizes.find((option) => option.default) || product.sizes[0]
      const presentation = product.vases[0]
      if (sizeId !== defaultSize?.id || vaseId !== presentation?.id) {
        throw new Error(`${product.name} is sold in its curated gift presentation.`)
      }
      return expandCuratedCombo({ combo: product, quantity, giftMessage })
    }

    const size = product.sizes.find((option) => option.id === sizeId)
    const vase = product.vases.find((option) => option.id === vaseId)
    if (!size) throw new Error(`Please choose a valid size for ${product.name}.`)
    if (!vase) throw new Error(`Please choose a valid vase or wrap for ${product.name}.`)

    return {
      slug: product.slug,
      name: product.name,
      size: { id: size.id, name: size.name },
      vase: { id: vase.id, name: vase.name },
      quantity,
      gift_message: giftMessage,
      unit_price_usd: size.price + vase.price,
      unit_price_cents: Math.round((size.price + vase.price) * 100),
    }
  })

  if (validatedItems.length > MAX_LINE_ITEMS) {
    throw new Error('Your flower bag has too many items in its gift sets.')
  }
  return validatedItems
}

function validateBuyer(value) {
  const clean = (field, max) => String(value?.[field] || '').trim().slice(0, max)
  const buyer = {
    name: clean('name', 100),
    email: clean('email', 254).toLowerCase(),
    phone: clean('phone', 30),
  }
  if (!buyer.name || !buyer.email) throw new Error('Please enter your name and email address.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) throw new Error('Please enter a valid email address.')
  return buyer
}

function checkoutDescription(items) {
  const itemText = items
    .map((item) => `${item.name} — ${item.size.name}, ${item.vase.name} × ${item.quantity}`)
    .join('; ')
  return `Order: ${itemText}`.slice(0, 1000)
}

async function parseCheckoutBody(request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Request body is missing.')

  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_CHECKOUT_BODY_BYTES) {
      await reader.cancel()
      const error = new Error('Checkout request is too large.')
      error.code = 'checkout-body-too-large'
      throw error
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(bytes))
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  })
}
