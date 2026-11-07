/**
 * Payment Processing Fee Utility — Petal & Bloom
 * Calculates the exact gross-up processing fee (4.9% + $0.40) on top of the order.
 * Ensures the business nets 100% of order subtotal and delivery revenue.
 */

export const PROCESSING_FEE_RATE = 0.049;
export const PROCESSING_FEE_FIXED_CENTS = 40; // $0.40

/**
 * Calculates the exact gross-up fee and final total in USD cents.
 * Formula:
 *   finalTotalCents = Math.round((baseAmountCents + 40) / 0.951)
 *   feeCents = finalTotalCents - baseAmountCents
 *
 * @param {number} baseAmountCents - (Subtotal + Delivery - Discount) in cents
 * @returns {{ finalTotalCents: number, feeCents: number, feeUsd: number, finalTotalUsd: number }}
 */
export function calculateProcessingFee(baseAmountCents) {
  if (!baseAmountCents || baseAmountCents <= 0) {
    return {
      finalTotalCents: 0,
      feeCents: 0,
      feeUsd: 0,
      finalTotalUsd: 0,
    };
  }

  const finalTotalCents = Math.round((baseAmountCents + PROCESSING_FEE_FIXED_CENTS) / (1 - PROCESSING_FEE_RATE));
  const feeCents = finalTotalCents - baseAmountCents;

  return {
    finalTotalCents,
    feeCents,
    feeUsd: feeCents / 100,
    finalTotalUsd: finalTotalCents / 100,
  };
}

