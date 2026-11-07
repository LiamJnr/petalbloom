const PROMOTION_STORAGE_KEY = 'petal_bloom_promo_code'
const BLOOM10_EXPIRES_AT = '2026-11-01T05:59:59.999Z'
const BLOOM10_MINIMUM_CENTS = 5_000
const BLOOM10_MAXIMUM_DISCOUNT_CENTS = 1_800

export function getPromotionCode() {
  try {
    const code = normalizePromotionCode(localStorage.getItem(PROMOTION_STORAGE_KEY))
    if (code === 'BLOOM10' && Date.now() > Date.parse(BLOOM10_EXPIRES_AT)) {
      localStorage.removeItem(PROMOTION_STORAGE_KEY)
      return ''
    }
    return code
  } catch {
    return ''
  }
}

export function setPromotionCode(value) {
  const code = normalizePromotionCode(value)
  try {
    if (code) localStorage.setItem(PROMOTION_STORAGE_KEY, code)
    else localStorage.removeItem(PROMOTION_STORAGE_KEY)
  } catch {
    // Storage is a convenience only; checkout still validates the entered code server-side.
  }
  return code
}

export function getPromotionPreview(subtotalUsd) {
  const code = getPromotionCode()
  if (!code) return { code: '', state: 'empty', discountUsd: 0 }
  if (code !== 'BLOOM10') {
    return { code, state: 'invalid', discountUsd: 0, message: 'That promo code is not valid.' }
  }
  if (Date.now() > Date.parse(BLOOM10_EXPIRES_AT)) {
    setPromotionCode('')
    return { code: '', state: 'invalid', discountUsd: 0, message: 'BLOOM10 has expired and was removed.' }
  }

  const subtotalCents = Math.round(Number(subtotalUsd) * 100)
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < BLOOM10_MINIMUM_CENTS) {
    return {
      code,
      state: 'invalid',
      discountUsd: 0,
      message: 'BLOOM10 requires at least $50.00 in merchandise.',
    }
  }

  return {
    code,
    state: 'applied',
    discountUsd: Math.min(Math.floor(subtotalCents * 0.1), BLOOM10_MAXIMUM_DISCOUNT_CENTS) / 100,
    message: 'BLOOM10 applied. First paid order eligibility is confirmed securely at checkout.',
  }
}

function normalizePromotionCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32)
}
