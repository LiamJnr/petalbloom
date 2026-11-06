/**
 * Receipt Generator — Petal & Bloom
 * Downloads a beautifully branded, print-ready receipt HTML file.
 * All customer-facing prices and payment amounts are in USD.
 */

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 400 1000 480" width="100%" height="100%">
  <title>Petal &amp; Bloom Logo</title>
  <defs>
    <linearGradient id="rcp" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7E4AA5"/>
      <stop offset="45%" stop-color="#5B2B82"/>
      <stop offset="100%" stop-color="#3F195F"/>
    </linearGradient>
  </defs>
  <g fill="url(#rcp)" fill-rule="evenodd">
    <path d="M585 494C585 552 564 599 523 634C480 671 417 689 336 689H33V658H127V31H33V0H311V31H218V299H302C384 299 450 314 500 345C557 380 585 430 585 494ZM482 491C483 434 465 392 426 363C394 338 353 326 304 326H218V658H324C431 658 478 607 482 491Z" transform="translate(162.120,575.000) scale(0.208000,-0.208000)"/>
    <path d="M611 239C608 172 586 120 547 83C534 70 515 59 488 49C462 39 440 34 421 34L234 31V334H356C405 334 443 290 443 209H474V486H443C443 445 435 414 420 393C406 376 385 368 356 368H234V658L405 656C532 653 578 599 587 486H618L616 689H51V658H145V31H51V0H632L643 239Z" transform="translate(287.960,575.000) scale(0.208000,-0.208000)"/>
    <path d="M642 689H40L38 486H67C73 545 89 588 114 613C139 638 185 653 250 656L295 658V31H202V0H480V31H386V658L432 656C497 653 543 638 569 611C595 584 610 543 614 486H644Z" transform="translate(433.144,575.000) scale(0.208000,-0.208000)"/>
    <path d="M725 31H651L415 708H375L158 138C139 85 120 53 103 42C90 34 66 30 31 31V0H249V31C211 31 190 34 186 40C182 46 180 54 180 63C180 82 186 107 198 138L236 228H477L545 31H465V0H725ZM250 266 364 559 463 266Z" transform="translate(572.088,575.000) scale(0.208000,-0.208000)"/>
    <path d="M570 239C567 172 545 120 506 83C493 70 473 59 446 49C420 39 398 34 380 34L227 31V658H321V689H44V658H138V31H44V0H589L602 239Z" transform="translate(727.672,575.000) scale(0.208000,-0.208000)"/>
    <path d="M723 72C696 59 676 52 661 52C622 52 567 73 498 114C550 171 576 225 576 278C576 298 574 313 571 324C632 321 678 316 707 311C707 332 711 356 718 381L531 374C521 374 489 375 435 376L404 333C455 329 484 326 492 323C507 317 515 290 515 242C515 211 499 176 467 137C387 219 322 301 271 384C364 448 410 513 410 578C410 637 379 667 318 667C290 667 268 659 252 644L186 587C171 574 163 544 163 499C163 464 173 422 192 374C92 321 42 252 42 168C42 114 60 69 97 34C134 -1 183 -19 244 -19C311 -19 375 6 435 55C454 38 483 22 520 5C557 -11 586 -19 605 -19C626 -19 639 -17 644 -14L728 48ZM345 547C345 526 335 502 316 476C297 450 276 430 255 417C238 462 230 500 230 531C230 588 251 616 293 616C326 616 345 582 345 547ZM406 80C367 50 327 35 287 35C244 35 206 52 173 85C141 118 125 157 125 201C125 255 152 301 206 340C230 297 261 252 299 204C320 177 356 136 406 80Z" transform="translate(935.048,575.000) scale(0.208000,-0.208000)"/>
    <path d="M637 173C638 232 615 279 570 312C534 338 494 352 449 353C538 368 606 429 606 518C606 622 530 689 402 689H52V658H146V31H52V0H400C557 0 636 58 637 173ZM507 519C507 466 490 425 456 397C430 376 401 365 368 365H237V658H384C466 658 507 612 507 519ZM528 176C528 121 510 81 474 57C448 40 416 31 377 31H237V335H369C409 335 443 325 471 304C508 276 527 233 528 176Z" transform="translate(135.727,824.000) scale(0.255000,-0.255000)"/>
    <path d="M570 239C567 172 545 120 506 83C493 70 473 59 446 49C420 39 398 34 380 34L227 31V658H321V689H44V658H138V31H44V0H589L602 239Z" transform="translate(317.798,824.000) scale(0.255000,-0.255000)"/>
    <path d="M663 341C663 452 636 541 581 607C527 674 453 707 360 707C273 707 201 675 144 610C85 542 55 454 54 347C53 247 82 162 142 91C203 21 275 -14 360 -14C447 -14 519 20 576 89C634 158 663 242 663 341ZM552 343C552 247 537 171 506 114C473 52 425 21 363 21C231 21 165 130 165 347C165 451 178 530 205 583C237 645 289 676 360 676C427 676 477 643 510 578C538 522 552 444 552 343Z" transform="translate(745.303,824.000) scale(0.255000,-0.255000)"/>
    <path d="M848 31H755V658H848V689H657L447 169L263 689H66V658H122C140 658 150 650 152 635V117C152 82 143 56 124 40C117 34 95 31 58 31V0H278V31C239 31 217 34 210 41C193 58 185 83 185 117V617L406 10L421 11L663 620V31H570V0H848Z" transform="translate(928.393,824.000) scale(0.255000,-0.255000)"/>
  </g>
  <g fill="url(#rcp)" fill-rule="evenodd">
    <path d="M 452.00,759.00 L 448.00,768.00 L 441.00,777.00 L 432.00,783.00 L 420.00,786.00 L 420.00,794.00 L 445.00,794.00 L 454.00,759.00 Z"/><path d="M 658.00,729.00 L 652.00,734.00 L 641.00,740.00 L 614.00,747.00 L 589.00,748.00 L 547.00,742.00 L 527.00,744.00 L 519.00,748.00 L 512.00,755.00 L 508.00,765.00 L 509.00,779.00 L 515.00,790.00 L 522.00,797.00 L 542.00,809.00 L 554.00,813.00 L 570.00,815.00 L 590.00,812.00 L 599.00,809.00 L 614.00,801.00 L 624.00,793.00 L 635.00,781.00 L 649.00,757.00 L 659.00,729.00 Z"/><path d="M 459.00,692.00 L 454.00,709.00 L 453.00,727.00 L 455.00,741.00 L 460.00,756.00 L 467.00,768.00 L 483.00,784.00 L 495.00,791.00 L 511.00,796.00 L 507.00,794.00 L 493.00,780.00 L 480.00,760.00 L 470.00,739.00 L 465.00,724.00 L 459.00,695.00 Z"/><path d="M 567.00,660.00 L 566.00,668.00 L 568.00,676.00 L 573.00,686.00 L 582.00,694.00 L 595.00,700.00 L 604.00,701.00 L 613.00,696.00 L 617.00,692.00 L 617.00,690.00 L 608.00,690.00 L 593.00,685.00 L 581.00,677.00 L 574.00,670.00 L 569.00,662.00 Z"/><path d="M 809.00,647.00 L 800.00,653.00 L 790.00,663.00 L 778.00,683.00 L 778.00,691.00 L 780.00,699.00 L 780.00,722.00 L 777.00,740.00 L 778.00,747.00 L 785.00,761.00 L 798.00,776.00 L 809.00,784.00 L 809.00,760.00 L 800.00,742.00 L 796.00,724.00 L 797.00,692.00 L 802.00,676.00 L 809.00,664.00 Z"/><path d="M 530.00,647.00 L 506.00,682.00 L 500.00,695.00 L 495.00,711.00 L 492.00,729.00 L 492.00,747.00 L 497.00,766.00 L 498.00,766.00 L 499.00,750.00 L 505.00,737.00 L 511.00,729.00 L 522.00,719.00 L 532.00,713.00 L 546.00,708.00 L 563.00,705.00 L 579.00,704.00 L 569.00,700.00 L 556.00,692.00 L 541.00,677.00 L 534.00,664.00 L 531.00,647.00 Z"/><path d="M 625.00,641.00 L 632.00,656.00 L 634.00,664.00 L 634.00,674.00 L 631.00,685.00 L 627.00,693.00 L 620.00,700.00 L 616.00,702.00 L 629.00,699.00 L 638.00,694.00 L 645.00,686.00 L 649.00,677.00 L 649.00,667.00 L 646.00,659.00 L 634.00,646.00 L 626.00,642.00 Z"/><path d="M 597.00,632.00 L 583.00,636.00 L 579.00,639.00 L 577.00,645.00 L 578.00,660.00 L 582.00,666.00 L 594.00,676.00 L 620.00,685.00 L 622.00,680.00 L 621.00,658.00 L 614.00,644.00 L 604.00,632.00 Z"/><path d="M 634.00,623.00 L 642.00,629.00 L 654.00,642.00 L 662.00,658.00 L 663.00,677.00 L 660.00,686.00 L 654.00,696.00 L 643.00,705.00 L 629.00,711.00 L 608.00,715.00 L 580.00,714.00 L 555.00,717.00 L 545.00,720.00 L 535.00,725.00 L 524.00,733.00 L 536.00,731.00 L 547.00,731.00 L 566.00,735.00 L 585.00,737.00 L 613.00,736.00 L 631.00,731.00 L 643.00,725.00 L 656.00,716.00 L 669.00,702.00 L 677.00,688.00 L 681.00,675.00 L 682.00,662.00 L 680.00,652.00 L 676.00,643.00 L 667.00,633.00 L 654.00,626.00 L 641.00,623.00 Z"/><path d="M 514.00,619.00 L 495.00,624.00 L 483.00,630.00 L 470.00,639.00 L 459.00,652.00 L 459.00,654.00 L 465.00,661.00 L 470.00,673.00 L 476.00,712.00 L 483.00,732.00 L 485.00,712.00 L 489.00,697.00 L 495.00,682.00 L 507.00,661.00 L 524.00,640.00 L 529.00,631.00 L 529.00,624.00 L 526.00,620.00 L 523.00,619.00 Z"/><path d="M 575.00,605.00 L 568.00,607.00 L 558.00,613.00 L 550.00,622.00 L 544.00,637.00 L 545.00,655.00 L 550.00,667.00 L 556.00,674.00 L 557.00,674.00 L 555.00,669.00 L 554.00,658.00 L 557.00,645.00 L 564.00,633.00 L 574.00,625.00 L 584.00,621.00 L 600.00,620.00 L 617.00,624.00 L 626.00,628.00 L 621.00,621.00 L 614.00,615.00 L 604.00,609.00 L 592.00,605.00 Z"/><path d="M 771.00,570.00 L 770.00,573.00 L 809.00,573.00 L 809.00,570.00 Z"/><path d="M 706.00,570.00 L 705.00,573.00 L 758.00,573.00 L 759.00,572.00 L 758.00,570.00 Z"/><path d="M 631.00,570.00 L 631.00,571.00 L 639.00,571.00 L 657.00,575.00 L 684.00,586.00 L 707.00,602.00 L 728.00,625.00 L 736.00,637.00 L 744.00,653.00 L 752.00,678.00 L 755.00,698.00 L 755.00,720.00 L 753.00,735.00 L 745.00,762.00 L 734.00,783.00 L 720.00,802.00 L 700.00,820.00 L 688.00,828.00 L 665.00,839.00 L 648.00,844.00 L 633.00,846.00 L 608.00,845.00 L 594.00,842.00 L 591.00,840.00 L 593.00,837.00 L 605.00,835.00 L 626.00,828.00 L 673.00,801.00 L 693.00,795.00 L 703.00,773.00 L 707.00,754.00 L 707.00,740.00 L 703.00,725.00 L 696.00,717.00 L 691.00,715.00 L 682.00,719.00 L 675.00,726.00 L 668.00,738.00 L 660.00,761.00 L 650.00,781.00 L 636.00,799.00 L 624.00,809.00 L 604.00,819.00 L 585.00,824.00 L 556.00,824.00 L 544.00,822.00 L 529.00,817.00 L 553.00,835.00 L 573.00,844.00 L 575.00,846.00 L 574.00,848.00 L 579.00,851.00 L 578.00,854.00 L 581.00,859.00 L 582.00,858.00 L 591.00,859.00 L 593.00,856.00 L 596.00,858.00 L 615.00,858.00 L 655.00,852.00 L 676.00,846.00 L 698.00,836.00 L 723.00,818.00 L 742.00,797.00 L 750.00,785.00 L 759.00,767.00 L 765.00,750.00 L 770.00,724.00 L 769.00,687.00 L 764.00,666.00 L 752.00,639.00 L 735.00,615.00 L 719.00,599.00 L 698.00,584.00 L 684.00,577.00 L 668.00,572.00 L 667.00,570.00 Z"/><path d="M 588.00,570.00 L 587.00,572.00 L 575.00,576.00 L 590.00,572.00 L 601.00,571.00 L 601.00,570.00 Z"/><path d="M 503.00,570.00 L 502.00,573.00 L 555.00,573.00 L 554.00,570.00 Z"/><path d="M 420.00,570.00 L 420.00,573.00 L 444.00,573.00 L 445.00,570.00 Z"/>
  </g>
</svg>`

/**
 * Safely escape a string for HTML output.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Format a D1 UTC datetime string ("YYYY-MM-DD HH:MM:SS") to a readable date.
 * @param {string} dt
 * @returns {string}
 */
function formatDate(dt) {
  if (!dt) return '—'
  try {
    const d = new Date(dt.replace(' ', 'T') + 'Z')
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return String(dt)
  }
}

/**
 * Format a D1 UTC datetime string to date + time.
 * e.g. "September 18, 2026 at 5:12 PM UTC"
 * @param {string} dt
 * @returns {string}
 */
function formatDateTime(dt) {
  if (!dt) return '—'
  try {
    const d = new Date(dt.replace(' ', 'T') + 'Z')
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    return `${date} at ${time}`
  } catch {
    return String(dt)
  }
}

/**
 * Convert USD cents to a dollar string, e.g. "$68.00"
 * @param {number} cents
 * @returns {string}
 */
function usd(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Map time window slug to readable label.
 * @param {string} window
 * @returns {string}
 */
function formatTimeWindow(window) {
  const map = {
    morning: 'Morning (9 AM – 12 PM)',
    afternoon: 'Afternoon (12 PM – 4 PM)',
    evening: 'Evening (4 PM – 8 PM)',
  }
  return map[window] || window || 'Standard'
}

/**
 * Build the complete print-ready receipt HTML for a paid order.
 * @param {object} order - Full order object from /api/orders/:id
 * @returns {string}
 */
export function buildReceiptHtml(order) {
  const buyer = (() => { try { return JSON.parse(order.buyer_json || '{}') } catch { return {} } })()
  const delivery = (() => { try { return JSON.parse(order.delivery_json || '{}') } catch { return {} } })()
  const items = (() => { try { return JSON.parse(order.cart_json || '[]') } catch { return [] } })()

  // Historical orders predate price audit fields, so retain the safe reconstruction fallback.
  const reconstructedSubtotalUsd = items.reduce((sum, item) => {
    return sum + (Number(item.unit_price_usd) || 0) * (Number(item.quantity) || 1)
  }, 0)
  const reconstructedSubtotalCents = Math.round(reconstructedSubtotalUsd * 100)
  const hasPricingAudit = Number.isSafeInteger(Number(order.subtotal_usd_cents)) && Number(order.subtotal_usd_cents) > 0
  const subtotalCents = hasPricingAudit ? Number(order.subtotal_usd_cents) : reconstructedSubtotalCents

  const deliveryFeeCents = hasPricingAudit
    ? Number(order.delivery_fee_usd_cents || 0)
    : Math.round((typeof delivery.delivery_fee_usd === 'number')
      ? delivery.delivery_fee_usd
      : (reconstructedSubtotalUsd >= 100 ? 0 : 14)) * 100
  const discountCents = hasPricingAudit ? Number(order.discount_usd_cents || 0) : 0
  const totalUsdCents = subtotalCents + deliveryFeeCents - discountCents

  const paymentSettled = usd(Number(order.total_cents || 0))

  // Recipient & delivery details
  const recipientName = delivery.recipient_name || buyer.name || ''
  const deliveryAddress = [
    delivery.street || delivery.address_line1,
    delivery.address_line2,
    delivery.city,
    delivery.state || delivery.region,
    delivery.zip,
    delivery.country,
  ].filter(Boolean).join(', ')
  const deliveryDate = delivery.delivery_date ? formatDate(delivery.delivery_date) : ''
  const timeWindow = delivery.time_window ? formatTimeWindow(delivery.time_window) : ''
  const giftNote = delivery.card_note || ''

  // Short order reference (first 8 chars uppercased)
  const shortRef = (order.id || '').slice(0, 8).toUpperCase()

  // Build item rows
  const itemRows = items.map(item => {
    const lineUsd = ((Number(item.unit_price_usd) || 0) * (Number(item.quantity) || 1)).toFixed(2)
    const options = [
      item.size?.name ? `Size: ${item.size.name}` : '',
      item.vase?.name ? `Wrap / Vase: ${item.vase.name}` : '',
    ].filter(Boolean).join(' &nbsp;|&nbsp; ')
    const giftMsg = item.gift_message || item.giftMessage || ''
    return `
      <tr>
        <td>
          <div class="item-name">${esc(item.name || 'Floral Arrangement')}</div>
          ${options ? `<div class="item-options">${options}</div>` : ''}
          ${giftMsg ? `<div class="item-gift-note">💬 "${esc(giftMsg)}"</div>` : ''}
        </td>
        <td class="text-right">${esc(String(item.quantity || 1))}</td>
        <td class="text-right"><strong>$${lineUsd}</strong></td>
      </tr>`
  }).join('')

  // Delivery section rows
  const deliveryRows = [
    recipientName ? `<p><strong>Recipient:</strong> ${esc(recipientName)}</p>` : '',
    deliveryAddress ? `<p><strong>Delivery Address:</strong> ${esc(deliveryAddress)}</p>` : '',
    deliveryDate ? `<p><strong>Scheduled Date:</strong> ${esc(deliveryDate)}</p>` : '',
    timeWindow ? `<p><strong>Time Window:</strong> ${esc(timeWindow)}</p>` : '',
  ].filter(Boolean).join('')

  const hasDeliveryInfo = deliveryRows.length > 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt — Petal &amp; Bloom #${shortRef}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc; color: #1e293b; padding: 40px 20px; line-height: 1.5;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .receipt {
      max-width: 680px; margin: 0 auto; background: #fff;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 10px 40px -5px rgba(0,0,0,0.06); border: 1px solid #e8e1f5;
    }
    .receipt-header {
      background: linear-gradient(135deg, #f5f0fb 0%, #fdf8ff 100%);
      padding: 28px 40px 24px; border-bottom: 1px solid #e8e1f5;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
    }
    .brand-logo {
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
    }
    .brand-logo svg {
      height: 64px;
      width: auto;
      max-height: 64px;
      display: block;
    }
    .receipt-meta { text-align: right; }
    .badge-paid {
      display: inline-block; background: #ecfdf5; color: #065f46;
      font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 9999px;
      border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .receipt-ref { font-size: 12px; color: #64748b; margin-top: 6px; font-family: monospace; }
    .receipt-date { font-size: 11px; color: #94a3b8; margin-top: 3px; }
    .receipt-body { padding: 32px 40px; }
    .section { margin-bottom: 26px; }
    .section-label {
      font-size: 10px; font-weight: 700; color: #a78bfa;
      text-transform: uppercase; letter-spacing: 1.5px;
      margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;
    }
    .section p { font-size: 13.5px; color: #334155; margin-bottom: 4px; }
    .section p strong { color: #0f172a; }
    .name-large { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    th {
      font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;
      letter-spacing: 0.5px; padding: 10px 14px; background: #f8fafc;
      border-bottom: 1px solid #e2e8f0; text-align: left;
    }
    td { padding: 14px 14px; font-size: 13.5px; color: #334155; border-bottom: 1px solid #f8fafc; vertical-align: top; }
    .text-right { text-align: right; }
    .item-name { font-weight: 600; color: #0f172a; font-size: 14px; }
    .item-options { font-size: 12px; color: #64748b; margin-top: 3px; }
    .item-gift-note { font-size: 12px; color: #7c3aed; font-style: italic; margin-top: 5px; }
    .totals { display: flex; justify-content: flex-end; margin-top: 8px; margin-bottom: 24px; }
    .totals-inner { width: 260px; }
    .totals-inner .row { display: flex; justify-content: space-between; font-size: 13.5px; color: #64748b; padding: 5px 0; }
    .totals-inner .row.total {
      border-top: 1.5px solid #e2e8f0; margin-top: 6px; padding-top: 10px;
      font-size: 16px; font-weight: 700; color: #0f172a;
    }
    .totals-inner .row.total .amount { color: #5b2b82; }
    .totals-inner .settled { font-size: 10.5px; color: #94a3b8; text-align: right; margin-top: 4px; }
    .free-tag { color: #10b981; font-weight: 600; }
    .gift-note-box {
      background: #fdf8ff; border: 1px solid #e8e1f5; border-left: 3px solid #a78bfa;
      border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;
    }
    .gift-note-label { font-size: 10px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .gift-note-text { font-size: 13.5px; color: #3f195f; font-style: italic; line-height: 1.6; }
    .receipt-footer {
      background: #faf7ff; border-top: 1px solid #e8e1f5;
      padding: 20px 40px; text-align: center; font-size: 11.5px; color: #94a3b8; line-height: 1.7;
    }
    .receipt-footer strong { color: #5b2b82; }
    .print-bar { max-width: 680px; margin: 0 auto 18px; display: flex; justify-content: flex-end; }
    .btn-print {
      background: #5b2b82; color: #fff; border: none; padding: 10px 20px;
      font-family: inherit; font-size: 13.5px; font-weight: 600; border-radius: 8px;
      cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 12px -2px rgba(91,43,130,0.3); transition: background 0.2s;
    }
    .btn-print:hover { background: #3f195f; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border: none; border-radius: 0; }
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-bar"><span>Use your browser's Print command to save this receipt as a PDF.</span></div>
  <div class="receipt">
    <div class="receipt-header">
      <div class="brand-logo">${LOGO_SVG}</div>
      <div class="receipt-meta">
        <span class="badge-paid">✓ Payment Confirmed</span>
        <div class="receipt-ref">Order #${shortRef}</div>
        <div class="receipt-date">${esc(formatDateTime(order.paid_at || order.created_at))}</div>
      </div>
    </div>
    <div class="receipt-body">
      <div class="section">
        <div class="section-label">Billed To</div>
        <div class="name-large">${esc(buyer.name || 'Customer')}</div>
        ${buyer.email ? `<p>${esc(buyer.email)}</p>` : ''}
        ${buyer.phone ? `<p>${esc(buyer.phone)}</p>` : ''}
      </div>
      <div class="section">
        <div class="section-label">Order Details</div>
        <p><strong>Order Reference:</strong> ${esc(order.id || '')}</p>
        <p><strong>Payment Method:</strong> HandyPay Secure Checkout</p>
        ${order.payment_intent_id ? `<p><strong>Payment Reference:</strong> ${esc(order.payment_intent_id)}</p>` : ''}
      </div>
      <div class="section">
        <div class="section-label">Items Ordered</div>
        <table>
          <thead>
            <tr>
              <th>Arrangement &amp; Specifications</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || '<tr><td colspan="3">No items found.</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="totals">
        <div class="totals-inner">
          <div class="row"><span>Subtotal</span><span>${usd(subtotalCents)}</span></div>
          <div class="row"><span>Delivery &amp; Handling</span>${deliveryFeeCents === 0 ? '<span class="free-tag">Free</span>' : `<span>${usd(deliveryFeeCents)}</span>`}</div>
          ${discountCents > 0 ? `<div class="row"><span>Discount${order.promo_code ? ` (${esc(order.promo_code)})` : ''}</span><span>−${usd(discountCents)}</span></div>` : ''}
          <div class="row total"><span>Total Paid</span><span class="amount">${usd(totalUsdCents)}</span></div>
          <div class="settled">Settled via HandyPay: ${paymentSettled} USD</div>
        </div>
      </div>
      ${giftNote ? `
      <div class="gift-note-box">
        <div class="gift-note-label">🌸 Gift Card Note</div>
        <div class="gift-note-text">"${esc(giftNote)}"</div>
      </div>` : ''}
      ${hasDeliveryInfo ? `
      <div class="section">
        <div class="section-label">Delivery Information</div>
        ${deliveryRows}
      </div>` : ''}
    </div>
    <div class="receipt-footer">
      <p><strong>Petal &amp; Bloom</strong> &nbsp;•&nbsp; Artisan Floral Boutique</p>
      <p>Thank you for your order! Please keep this receipt as your proof of purchase.</p>
      <p style="margin-top:4px;">For enquiries, please contact our studio team.</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Download a self-contained receipt. Customers can open it and save it as a PDF
 * using their browser's print command.
 * @param {object} order - Full order object from /api/orders/:id
 */
export function downloadReceipt(order) {
  const html = buildReceiptHtml(order)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `petal-bloom-receipt-${String(order.id || 'order').slice(0, 8)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Clean up the object URL after 30s to free memory
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
