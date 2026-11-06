/**
 * Order Details & Recipient Information Checkout Module
 * Gathers recipient delivery logistics, address, date/time window, and gift note.
 * Styled to conform with the Product Detail Page (PDP) design system.
 */
import { getCartItems, getCartSubtotal, getTotalItemCount, openCart } from "./cart.js";
import { navigateToHome, scrollToTop } from "./router.js";
import { showToast } from "./toast.js";
import { getProductBySlug } from "../data/products.js";
import { preloadStripeJs, startCheckout } from "../lib/checkout.js";
import { ICONS } from "../lib/icons.js";
import { getInternationalEstimates } from "../lib/currency.js";
import { getDeliveryCountdownState } from "../lib/delivery-timer.js";
import { getPromotionCode, getPromotionPreview, setPromotionCode } from "../lib/promotion.js";
import { getKingsbiteFreeDeliveryOffer, hasFreeDelivery, STANDARD_FREE_DELIVERY_THRESHOLD_USD } from "../lib/kingsbite-delivery.js";
import { escapeHtml } from "../lib/html-escape.js";

let selectedTimeWindow = "morning";
let selectedLocationType = "residential";
let currentStep = 1;
let currentCheckoutPayloadKey = null;

// SVG Assets for Location Types
const homeSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
`;

const businessSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01"/>
    <path d="M16 6h.01"/>
    <path d="M12 6h.01"/>
    <path d="M12 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M16 10h.01"/>
    <path d="M16 14h.01"/>
    <path d="M8 10h.01"/>
    <path d="M8 14h.01"/>
  </svg>
`;

const hospitalSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 6v12"/>
    <path d="M6 12h12"/>
    <rect width="18" height="18" x="3" y="3" rx="2"/>
  </svg>
`;

const venueSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5.8 11.3 2 22l10.7-3.79"/>
    <path d="M4 3h.01"/>
    <path d="M22 8h.01"/>
    <path d="M15 2h.01"/>
    <path d="M22 20h.01"/>
    <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38e-1a3 3 0 0 1-3.07-2.93 2.9 2.9 0 0 0-3.18-2.84L7.8 2"/>
  </svg>
`;

// SVG Assets for Delivery Time Windows
const sunSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </svg>
`;

const afternoonSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/>
    <path d="M9 21h6"/>
  </svg>
`;

const moonSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
`;

// Trust Strip SVGs
const leafSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 0h16v16H0z" fill="none" />
    <path fill="currentColor" d="M1.4 1.7c.217.289.65.84 1.725 1.274c1.093.44 2.885.774 5.834.528c2.02-.168 3.431.51 4.326 1.556C14.161 6.082 14.5 7.41 14.5 8.5q0 .344-.027.734C13.387 8.252 11.877 7.76 10.39 7.5c-2.016-.288-4.188-.445-5.59-2.045c-.142-.162-.402-.102-.379.112c.108.985 1.104 1.82 1.844 2.308c2.37 1.566 5.772-.118 7.6 3.071c.505.8 1.374 2.7 1.75 4.292c.07.298-.066.611-.354.715a.7.7 0 0 1-.161.042a1 1 0 0 1-1.08-.794c-.13-.97-.396-1.913-.868-2.77C12.173 13.386 10.565 14 8 14c-1.854 0-3.32-.544-4.45-1.435c-1.124-.887-1.889-2.095-2.39-3.383c-1-2.562-1-5.536-.65-7.28L.73.806z" />
  </svg>
`;

const ribbonSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 64 64" fill="currentColor">
    <path d="M0 0h64v64H0z" fill="none" />
    <path fill="currentColor" d="m50.245 25.553l1.208.167c6.916.959 11.574-1.293 10.352-5.004c-1.223-3.709-1.223-9.782 0-13.491c1.223-3.711-3.436-5.963-10.352-5.004l-5.537.769c-3.914.542-7.414 2.363-9.723 4.759c-.59-1.621-1.827-.518-4.192-.518s-3.603-1.104-4.193.518C25.5 5.353 21.999 3.532 18.086 2.99l-5.537-.769C5.632 1.262.973 3.514 2.195 7.225c1.225 3.709 1.225 9.782 0 13.491c-1.223 3.711 3.437 5.963 10.354 5.004l1.207-.167C12.105 32.051 8.766 39.892 2 46h13v16s11.145-15.834 13.212-40.953c.69.596 1.867-.132 3.789-.132c1.921 0 3.098.727 3.788.132C37.856 46.166 49 62 49 62V46h13c-6.766-6.108-10.105-13.949-11.755-20.447m-32.432-2.406l-5.537.769c-.968.134-1.904.202-2.785.202c-3.064 0-4.764-.794-5.332-1.536c-.189-.245-.814-.797-.271-1.316c6.43-6.149 23.231-3.101 23.231-3.101c-1.949 2.466-5.431 4.445-9.306 4.982m28.376 0c-3.875-.537-7.357-2.517-9.307-4.982c0 0 16.803-3.049 23.23 3.101c.545.52-.082 1.071-.27 1.316c-.568.742-2.268 1.536-5.332 1.536c-.881 0-1.818-.068-2.785-.202z" />
  </svg>
`;

const cardSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor">
    <path d="M0 0h20v20H0z" fill="none" />
    <path fill="currentColor" d="m1.574 5.286l7.5 4.029c.252.135.578.199.906.199s.654-.064.906-.199l7.5-4.029c.489-.263.951-1.286.054-1.286H1.521c-.897 0-.435 1.023.053 1.286m17.039 2.203l-7.727 4.027c-.34.178-.578.199-.906.199s-.566-.021-.906-.199s-7.133-3.739-7.688-4.028C.996 7.284 1 7.523 1 7.707V15c0 .42.566 1 1 1h16c.434 0 1-.58 1-1V7.708c0-.184.004-.423-.387-.219" />
  </svg>
`;

const lockSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
`;

// ─── Stepper ─────────────────────────────────────────────────────────────────
function buildStepperHtml() {
  const steps = [
    { num: 1, title: "Personal details", subtitle: "Just a bit about you" },
    { num: 2, title: "Delivery & gift", subtitle: "Recipient, address & note" },
    { num: 3, title: "Review & payment", subtitle: "Confirm and submit" },
  ];
  const checkSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const activeSvg = '<svg class="co-step-active-svg" xmlns="http://www.w3.org/2000/svg" width="1.15em" height="1.15em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="18" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="18;0" /><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path><path stroke-dasharray="60" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z" opacity=".3"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="60;0" /></path></g></svg>';

  return '<div class="co-stepper" id="co-stepper" role="navigation" aria-label="Checkout steps">' +
    steps.map(s => {
      const cls = s.num < currentStep ? 'done' : s.num === currentStep ? 'active' : '';
      const bubble = s.num < currentStep ? checkSvg : s.num === currentStep ? activeSvg : `<span class="co-step-num">${s.num}</span>`;
      const track = s.num < steps.length ? `<div class="co-step-track ${s.num < currentStep ? 'done' : ''}"></div>` : '';
      return `<div class="co-step ${cls}" data-step="${s.num}" role="button" tabindex="${s.num < currentStep ? '0' : '-1'}" aria-current="${s.num === currentStep ? 'step' : 'false'}">` +
        `<div class="co-step-bubble">${bubble}</div>` +
        `<div class="co-step-text">` +
          `<span class="co-step-title">${s.title}</span>` +
          `<span class="co-step-subtitle">${s.subtitle}</span>` +
        `</div>` +
      `</div>${track}`;
    }).join('') + '</div>';
}

// ─── Step 1: Customer Information ────────────────────────────────────────────
function buildStep1Html() {
  return `
    <div class="co-step-panel" id="co-panel-1">
      <div class="checkout-header-intro">
        <h2>Your Details</h2>
        <p class="checkout-subtitle">We&rsquo;ll use this to send you order updates and receipts.</p>
      </div>
      <fieldset class="checkout-fieldset">
        <legend class="checkout-legend"><span class="legend-num">1</span><span>Customer Information</span></legend>
        <div class="form-row">
          <div class="form-group">
            <label for="cust-name">Your Full Name *</label>
            <input type="text" id="cust-name" class="form-control" placeholder="e.g. Eleanor Vance" autocomplete="name" required />
          </div>
          <div class="form-group">
            <label for="cust-email">Email Address (For order updates) *</label>
            <input type="email" id="cust-email" class="form-control" placeholder="e.g. eleanor@example.com" autocomplete="email" required />
          </div>
        </div>
        <div class="form-group">
          <label for="cust-phone">Your Phone Number (Optional)</label>
          <input type="tel" id="cust-phone" class="form-control" placeholder="e.g. +1 555-0199" autocomplete="tel" />
        </div>
      </fieldset>
      <div class="co-step-nav">
        <span></span>
        <button type="button" class="btn-co-next" id="btn-step1-next">Continue: Delivery Details</button>
      </div>
    </div>`;
}

// ─── Step 2: Recipient, Delivery & Gift ──────────────────────────────────────
function buildStep2Html(deliveryState) {
  const minDateStr = deliveryState.earliestDateStr;
  const bg = deliveryState.isSameDayAvailable ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
  const col = deliveryState.isSameDayAvailable ? '#047857' : '#b45309';
  return `
    <div class="co-step-panel" id="co-panel-2">
      <div class="checkout-header-intro">
        <h2>Delivery &amp; Gift Details</h2>
        <p class="checkout-subtitle">Where should we deliver, and when? Add your personal gift note below.</p>
      </div>

      <fieldset class="checkout-fieldset">
        <legend class="checkout-legend"><span class="legend-num">2</span><span>Recipient Information</span></legend>
        <div class="checkout-same-as-buyer-wrap">
          <label class="checkout-checkbox-label" for="same-as-buyer">
            <input type="checkbox" id="same-as-buyer" class="checkout-checkbox" />
            <span>I am the recipient (Deliver to myself)</span>
          </label>
        </div>
        <div class="form-group">
          <label for="rec-name">Recipient Full Name *</label>
          <input type="text" id="rec-name" class="form-control" placeholder="e.g. Clara Harrington" required />
        </div>
        <div class="form-group">
          <label for="rec-address">Street Address *</label>
          <input type="text" id="rec-address" class="form-control" placeholder="e.g. 742 Evergreen Terrace" autocomplete="shipping street-address" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="rec-suite">Apt / Suite / Floor (Optional)</label>
            <input type="text" id="rec-suite" class="form-control" placeholder="e.g. Apt 4B" />
          </div>
          <div class="form-group">
            <label for="rec-city">City *</label>
            <input type="text" id="rec-city" class="form-control" placeholder="e.g. Edmonton" autocomplete="shipping locality" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="rec-state">State / Province *</label>
            <input type="text" id="rec-state" class="form-control" placeholder="e.g. AB" autocomplete="shipping region" required />
          </div>
          <div class="form-group">
            <label for="rec-zip">Postal / ZIP Code *</label>
            <input type="text" id="rec-zip" class="form-control" placeholder="e.g. T5N 1R5" autocomplete="shipping postal-code" required />
          </div>
        </div>
        <div class="form-group">
          <label for="rec-notes">Courier Notes / Gate Code (Optional)</label>
          <input type="text" id="rec-notes" class="form-control" placeholder="e.g. Leave with concierge on 1st floor, ring buzzer #4" />
        </div>
      </fieldset>

      <fieldset class="checkout-fieldset">
        <legend class="checkout-legend"><span class="legend-num">3</span><span>Delivery Schedule &amp; Timing</span></legend>
        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px 12px;margin-bottom:6px;">
            <label for="rec-delivery-date" style="margin-bottom:0;">Requested Delivery Date *</label>
            <span style="font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:9999px;background:${bg};color:${col};">${deliveryState.badgeText}</span>
          </div>
          <input type="date" id="rec-delivery-date" class="form-control" value="${minDateStr}" min="${minDateStr}" required />
        </div>
        <div class="form-group">
          <label>Preferred Delivery Time Window:</label>
          <div class="time-window-grid">
            <div class="time-window-pill active" data-window="morning">
              <div class="time-window-icon">${sunSvg}</div>
              <span class="time-window-title">Morning</span>
              <span class="time-window-hours">9:00 AM &ndash; 1:00 PM</span>
            </div>
            <div class="time-window-pill" data-window="afternoon">
              <div class="time-window-icon">${afternoonSvg}</div>
              <span class="time-window-title">Afternoon</span>
              <span class="time-window-hours">1:00 PM &ndash; 5:00 PM</span>
            </div>
            <div class="time-window-pill" data-window="evening">
              <div class="time-window-icon">${moonSvg}</div>
              <span class="time-window-title">Evening</span>
              <span class="time-window-hours">5:00 PM &ndash; 8:00 PM</span>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset class="checkout-fieldset">
        <legend class="checkout-legend"><span class="legend-num">4</span><span>Letterpress Card Note</span></legend>
        <div class="form-group">
          <label for="rec-card-msg">Personal Gift Note (Printed on luxury cardstock)</label>
          <textarea id="rec-card-msg" class="form-control" rows="3" maxlength="250" placeholder="Write your heartfelt note for the recipient..."></textarea>
          <div class="checkout-gift-note-footer">
            <span>Handwritten by our studio team</span>
            <span id="checkout-char-count">0 / 250</span>
          </div>
        </div>
      </fieldset>

      <div class="co-step-nav">
        <button type="button" class="btn-co-back" id="btn-step2-back">Back</button>
        <button type="button" class="btn-co-next" id="btn-step2-next">Review &amp; Pay</button>
      </div>
    </div>`;
}

// ─── Step 3: Review & Pay ─────────────────────────────────────────────────────
function buildStep3Html({ usdFormatted }) {
  return `
    <div class="co-step-panel" id="co-panel-3">
      <div class="checkout-header-intro">
        <h2>Review &amp; Pay</h2>
        <p class="checkout-subtitle">Almost there &mdash; review your order details and enter your payment information below.</p>
      </div>

      <div class="co-review-card" id="co-review-card"></div>

      <!-- Direct Payment Fields Mount Surface -->
      <div id="handypay-payment-surface" class="handypay-payment-surface-mount" aria-live="polite"></div>

      <div class="co-step-nav co-step-nav-single">
        <button type="button" class="btn-co-back" id="btn-step3-back">Back</button>
      </div>
    </div>`;
}

// ─── Review Card (Step 3 summary, built dynamically) ─────────────────────────
function buildReviewCard() {
  const g = id => document.getElementById(id)?.value.trim() || '';
  const custName = escapeHtml(g('cust-name') || '—');
  const custEmail = escapeHtml(g('cust-email') || '—');
  const custPhone = escapeHtml(g('cust-phone'));
  const recName = escapeHtml(g('rec-name') || '—');
  const address = g('rec-address') || '—';
  const suite = g('rec-suite');
  const city = g('rec-city');
  const state = g('rec-state');
  const zip = g('rec-zip');
  const courierNotes = escapeHtml(g('rec-notes'));
  const deliveryDate = escapeHtml(g('rec-delivery-date') || '—');
  const cardNote = escapeHtml(g('rec-card-msg'));
  const timeLabel = escapeHtml({ morning: 'Morning (9 AM–1 PM)', afternoon: 'Afternoon (1–5 PM)', evening: 'Evening (5–8 PM)' }[selectedTimeWindow] || selectedTimeWindow);
  const formattedAddress = escapeHtml(suite ? `${address}, ${suite}` : address);
  const formattedCity = escapeHtml([city, state, zip].filter(Boolean).join(', '));

  const card = document.getElementById('co-review-card');
  if (!card) return;
  card.innerHTML = `
    <div class="co-review-section">
      <div class="co-review-section-header"><span class="co-review-section-title">Your Details</span><button type="button" class="co-review-edit-btn" data-target-step="1">Edit</button></div>
      <div class="co-review-row"><span>Name</span><strong>${custName}</strong></div>
      <div class="co-review-row"><span>Email</span><strong>${custEmail}</strong></div>
      ${custPhone ? `<div class="co-review-row"><span>Phone</span><strong>${custPhone}</strong></div>` : ''}
    </div>
    <div class="co-review-section">
      <div class="co-review-section-header"><span class="co-review-section-title">Delivery Details</span><button type="button" class="co-review-edit-btn" data-target-step="2">Edit</button></div>
      <div class="co-review-row"><span>Recipient</span><strong>${recName}</strong></div>
      <div class="co-review-row"><span>Address</span><strong>${formattedAddress}</strong></div>
      <div class="co-review-row"><span>City</span><strong>${formattedCity}</strong></div>
      ${courierNotes ? `<div class="co-review-row"><span>Courier Notes</span><strong>${courierNotes}</strong></div>` : ''}
      <div class="co-review-row"><span>Date</span><strong>${deliveryDate}</strong></div>
      <div class="co-review-row"><span>Time</span><strong>${timeLabel}</strong></div>
    </div>
    ${cardNote ? `<div class="co-review-section"><div class="co-review-section-header"><span class="co-review-section-title">Gift Note</span><button type="button" class="co-review-edit-btn" data-target-step="2">Edit</button></div><div class="co-review-note">&ldquo;${cardNote}&rdquo;</div></div>` : ''}
  `;
  card.querySelectorAll('.co-review-edit-btn').forEach(btn =>
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.targetStep, 10)))
  );
}

// ─── Intentional payment start ───────────────────────────────────────────────
// A Live PaymentIntent reserves HandyPay processing capacity, so do not create
// one merely because a buyer is reviewing their delivery details.
function showPaymentStartPrompt() {
  const paymentMount = document.getElementById('handypay-payment-surface');
  if (!paymentMount || paymentMount.querySelector('#handypay-payment-element')) return;

  paymentMount.innerHTML = `
    <section class="handypay-payment-start">
      <button type="button" class="handypay-payment-start-button" id="btn-start-handypay-payment">Confirm &amp; Continue to Payment</button>
    </section>
  `;
  document.getElementById('btn-start-handypay-payment')?.addEventListener('click', (event) => {
    event.currentTarget.disabled = true;
    initPaymentSurface();
  });
}

// ─── Payment surface initializer ─────────────────────────────────────────────
async function initPaymentSurface() {
  const paymentMount = document.getElementById('handypay-payment-surface');
  if (!paymentMount) return;

  const custName = document.getElementById("cust-name")?.value.trim() || "";
  const custEmail = document.getElementById("cust-email")?.value.trim() || "";
  const custPhone = document.getElementById("cust-phone")?.value.trim() || "";

  const recName = document.getElementById("rec-name")?.value.trim() || "";
  const address = document.getElementById("rec-address")?.value.trim() || "";
  const suite = document.getElementById("rec-suite")?.value.trim() || "";
  const city = document.getElementById("rec-city")?.value.trim() || "";
  const state = document.getElementById("rec-state")?.value.trim() || "";
  const zip = document.getElementById("rec-zip")?.value.trim() || "";
  const courierNotes = document.getElementById("rec-notes")?.value.trim() || "";
  const deliveryDate = document.getElementById("rec-delivery-date")?.value.trim() || "";
  const cardNote = document.getElementById("rec-card-msg")?.value.trim() || "";

  const buyer = { name: custName, email: custEmail, phone: custPhone };
  const delivery = {
    recipient_name: recName,
    street: suite ? `${address}, ${suite}` : address,
    city,
    state,
    zip,
    location_type: selectedLocationType,
    delivery_date: deliveryDate,
    time_window: selectedTimeWindow,
    courier_notes: courierNotes
  };

  const checkoutItems = getCartItems();
  const kingsbiteOffer = getKingsbiteFreeDeliveryOffer(checkoutItems, getCartSubtotal());
  const promoCode = kingsbiteOffer.isEligible ? "" : getPromotionCode();

  const payloadKey = JSON.stringify({
    buyer,
    delivery,
    cardNote,
    promoCode,
    items: checkoutItems.map(i => [i.slug, i.quantity, i.size.id, i.vase.id])
  });

  // If already mounted with the exact same payload, preserve current fields
  if (currentCheckoutPayloadKey === payloadKey && paymentMount.querySelector('#handypay-payment-element')) {
    return;
  }

  currentCheckoutPayloadKey = payloadKey;

  // Render skeleton loader immediately in place of payment fields
  paymentMount.innerHTML = `
    <div class="handypay-skeleton-card" aria-busy="true" aria-label="Loading secure payment fields">

      <div class="handypay-skeleton-line handypay-skeleton-title"></div>
      <div class="handypay-skeleton-line handypay-skeleton-intro"></div>
      <div class="handypay-skeleton-line handypay-skeleton-tabs"></div>
      <div class="handypay-skeleton-line handypay-skeleton-input"></div>
      <div class="handypay-skeleton-row">
        <div class="handypay-skeleton-line handypay-skeleton-input"></div>
        <div class="handypay-skeleton-line handypay-skeleton-input"></div>
      </div>
      <div class="handypay-skeleton-line handypay-skeleton-btn"></div>
    </div>
  `;

  try {
    await startCheckout({
      items: checkoutItems.map(item => ({
        slug: item.slug,
        size_id: item.size.id,
        vase_id: item.vase.id,
        quantity: item.quantity,
        giftMessage: item.giftMessage || ""
      })),
      buyer,
      delivery,
      card_note: cardNote,
      promo_code: promoCode,
      paymentMount
    });
  } catch (error) {
    currentCheckoutPayloadKey = null;
    paymentMount.innerHTML = `
      <div class="handypay-payment-error-box" style="margin-top: 18px; padding: 24px; text-align: center; background: #fff5f5; border: 1px solid #fecaca; border-radius: 16px;">
        <p style="font-weight: 600; color: #b42318; font-size: 0.95rem;">Unable to load payment fields</p>
        <p style="margin-top: 6px; font-size: 0.85rem; color: #7f1d1d;">${escapeHtml(error.message || "Please check your connection and try again.")}</p>
        <button type="button" class="btn-retry-payment button button-dark" style="margin-top: 16px; padding: 10px 20px; font-size: 0.88rem;" id="btn-retry-handypay-payment">Retry Loading Payment</button>
      </div>
    `;
    document.getElementById('btn-retry-handypay-payment')?.addEventListener('click', () => {
      initPaymentSurface();
    });
  }
}

// ─── Step navigation ──────────────────────────────────────────────────────────
function goToStep(step) {
  const previousStep = currentStep;
  currentStep = step;
  if (previousStep === 3 && step !== 3) {
    // Returning to edit details invalidates the displayed payment amount and
    // must never leave stale payment fields visible on a later return.
    currentCheckoutPayloadKey = null;
    document.getElementById('handypay-payment-surface')?.replaceChildren();
  }
  if (step === 3) {
    void preloadStripeJs().catch(() => {});
  }
  const checkSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const activeSvg = '<svg class="co-step-active-svg" xmlns="http://www.w3.org/2000/svg" width="1.15em" height="1.15em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="18" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="18;0" /><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path><path stroke-dasharray="60" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z" opacity=".3"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="60;0" /></path></g></svg>';

  document.querySelectorAll('.co-step').forEach(el => {
    const n = parseInt(el.dataset.step, 10);
    el.className = 'co-step ' + (n < step ? 'done' : n === step ? 'active' : '');
    el.setAttribute('aria-current', n === step ? 'step' : 'false');
    el.setAttribute('tabindex', n < step ? '0' : '-1');
    const b = el.querySelector('.co-step-bubble');
    if (b) {
      b.innerHTML = n < step ? checkSvg : n === step ? activeSvg : `<span class="co-step-num">${n}</span>`;
    }
  });
  document.querySelectorAll('.co-step-track').forEach((el, i) => el.classList.toggle('done', i + 1 < step));
  document.querySelectorAll('.co-step-panel').forEach(panel => {
    const n = parseInt(panel.id.replace('co-panel-', ''), 10);
    if (n === step) { panel.classList.add('active'); panel.setAttribute('aria-hidden', 'false'); }
    else { panel.classList.remove('active'); panel.setAttribute('aria-hidden', 'true'); }
  });
  if (step === 3) {
    buildReviewCard();
    showPaymentStartPrompt();
  }
  scrollToTop();
}

// ─── Per-step validation ──────────────────────────────────────────────────────
function validateStep1() {
  const name = document.getElementById('cust-name')?.value.trim();
  const email = document.getElementById('cust-email')?.value.trim();
  if (!name) { showToast({ title: 'Name required', message: 'Please enter your full name.', icon: ICONS.warning, duration: 3500 }); document.getElementById('cust-name')?.focus(); return false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast({ title: 'Valid email required', message: 'Please enter a valid email address.', icon: ICONS.warning, duration: 3500 }); document.getElementById('cust-email')?.focus(); return false; }
  return true;
}
function validateStep2() {
  const req = [
    { id: 'rec-name', label: 'Recipient name' },
    { id: 'rec-address', label: 'Street address' },
    { id: 'rec-city', label: 'City' },
    { id: 'rec-state', label: 'State / Province' },
    { id: 'rec-zip', label: 'Postal / ZIP code' },
    { id: 'rec-delivery-date', label: 'Delivery date' },
  ];
  for (const { id, label } of req) {
    if (!document.getElementById(id)?.value.trim()) {
      showToast({ title: label + ' required', message: 'Please fill in the ' + label.toLowerCase() + '.', icon: ICONS.warning, duration: 3500 });
      document.getElementById(id)?.focus();
      return false;
    }
  }
  return true;
}

/**
 * Render the multi-step Order Details & Recipient Information Page
 */
export function renderCheckoutPage() {
  const checkoutView = document.getElementById("checkout-view");
  const homeView = document.getElementById("home-view");
  const pdpView = document.getElementById("pdp-view");
  const confirmationView = document.getElementById("order-confirmation-view");

  if (!checkoutView) return;

  // View visibility
  if (homeView) homeView.style.display = "none";
  if (pdpView) pdpView.style.display = "none";
  if (confirmationView) confirmationView.style.display = "none";
  checkoutView.style.display = "block";
  document.title = "Order Details & Recipient Information — Petal & Bloom";
  scrollToTop();

  // Reset wizard state on every fresh render
  currentStep = 1;
  selectedTimeWindow = 'morning';
  selectedLocationType = 'residential';
  currentCheckoutPayloadKey = null;

  // Load items from local storage
  let cart = [];
  try {
    const raw = localStorage.getItem("petal_bloom_cart");
    cart = raw ? JSON.parse(raw) : [];
  } catch {
    cart = [];
  }

  if (cart.length === 0) {
    checkoutView.innerHTML = `
      <header class="pdp-page-header">
        <div class="container">
          <h1>Order Details</h1>
          <nav class="pdp-breadcrumb" aria-label="Breadcrumb">
            <a href="#" class="btn-checkout-home">Home</a>
            <span>/</span>
            <a href="#" class="btn-checkout-home">Shop</a>
            <span>/</span>
            <span class="pdp-breadcrumb-current">Order Details</span>
          </nav>
        </div>
      </header>

      <div class="container text-center" style="padding: 60px 0 100px;">
        <div class="cart-empty" style="max-width: 480px; margin: 0 auto;">
          <div class="cart-empty-icon" style="font-size: 3rem; margin-bottom: 16px;">${ICONS.flower}</div>
          <h2 style="font-size: 1.8rem; margin-bottom: 10px;">Your Flower Bag is Empty</h2>
          <p style="color: var(--muted); margin-bottom: 24px;">Please select a floral bouquet or botanical gift before proceeding to recipient details.</p>
          <button class="button button-dark" id="btn-empty-checkout-home">Explore Flower Collection</button>
        </div>
      </div>
    `;

    document.getElementById("btn-empty-checkout-home")?.addEventListener("click", () => {
      navigateToHome();
    });
    return;
  }

  const subtotal = getCartSubtotal();
  const kingsbiteOffer = getKingsbiteFreeDeliveryOffer(cart, subtotal);
  const deliveryState = getDeliveryCountdownState();
  const minDateStr = deliveryState.earliestDateStr;
  const isFreeDelivery = hasFreeDelivery(cart, subtotal);
  const deliveryFee = isFreeDelivery ? 0 : 14;
  const promotion = kingsbiteOffer.isEligible
    ? { code: getPromotionCode(), state: "unavailable", discountUsd: 0, message: "Kingsbite free delivery is applied; promo codes are not combined with this offer." }
    : getPromotionPreview(subtotal);
  const discount = promotion.state === "applied" ? promotion.discountUsd : 0;
  const totalDue = subtotal + deliveryFee - discount;
  const usdFormatted = `$${totalDue.toFixed(2)}`;

  // Free shipping progress meter calculations
  const shippingThreshold = kingsbiteOffer.hasKingsbite ? 40 : STANDARD_FREE_DELIVERY_THRESHOLD_USD;
  const shippingRemaining = shippingThreshold - subtotal;
  const shippingProgressPct = Math.min(100, Math.round((subtotal / shippingThreshold) * 100));

  const summaryData = { cart, subtotal, isFreeDelivery, kingsbiteOffer, deliveryFee, discount, promotion, totalDue, shippingRemaining, shippingProgressPct };

  checkoutView.innerHTML =
    `<header class="pdp-page-header"><div class="container"><h1>Order Details</h1><nav class="pdp-breadcrumb" aria-label="Breadcrumb"><a href="#" class="btn-checkout-home">Home</a><span>/</span><a href="#" class="btn-checkout-cart">Shopping Bag</a><span>/</span><span class="pdp-breadcrumb-current">Recipient &amp; Delivery</span></nav></div></header>` +
    `<div class="checkout-page-section"><div class="container">` +
      buildStepperHtml() +
      `<div class="checkout-layout">` +
        `<div class="checkout-form-card">` +
          `<form id="recipient-order-form" novalidate>` +
            buildStep1Html() +
            buildStep2Html(deliveryState) +
            buildStep3Html({ usdFormatted }) +
          `</form>` +
        `</div>` +
        `<aside class="checkout-summary-card" id="checkout-sidebar">` +
          buildSidebarHtml(summaryData) +
        `</aside>` +
      `</div>` +
    `</div></div>`;

  // Activate panel 1
  document.querySelectorAll('.co-step-panel').forEach((panel, i) => {
    if (i === 0) { panel.classList.add('active'); panel.setAttribute('aria-hidden', 'false'); }
    else { panel.setAttribute('aria-hidden', 'true'); }
  });

  bindCheckoutEvents();
}

// ─── Sidebar Order Summary (called from buildSidebarHtml template) ─────────────
function buildSidebarHtml({ cart, subtotal, isFreeDelivery, kingsbiteOffer, deliveryFee, discount, promotion, totalDue, shippingRemaining, shippingProgressPct }) {
  return `
    <div class="checkout-summary-header">
      <h3>Order Summary</h3>
      <button type="button" class="btn-edit-bag" id="btn-edit-cart-bag">Edit Bag</button>
    </div>
    <div class="checkout-shipping-meter ${isFreeDelivery ? 'unlocked' : ''}">
      <p class="checkout-shipping-meter-text">
        ${isFreeDelivery
          ? `<span class="checkout-meter-icon">${ICONS.sparkles || '✨'}</span> <span><strong>Congratulations!</strong> You unlocked <strong>${kingsbiteOffer.isEligible ? 'Kingsbite free delivery' : 'FREE Local Delivery'}</strong>!</span>`
          : `<span class="checkout-meter-icon">🚚</span> <span>Add <strong>$${Math.max(0, shippingRemaining).toFixed(2)}</strong> more for <strong>${kingsbiteOffer.hasKingsbite ? 'Kingsbite free delivery' : 'FREE Local Delivery'}</strong></span>`
        }
      </p>
      <div class="checkout-shipping-meter-track">
        <div class="checkout-shipping-meter-fill ${isFreeDelivery ? 'unlocked' : ''}" style="width: ${shippingProgressPct}%"></div>
      </div>
    </div>
    <div class="checkout-items-list">
      ${cart.map(item => {
        const liveProduct = getProductBySlug(item.slug);
        const itemImg = liveProduct?.images.primary || item.image;
        return `<div class="checkout-item-row"><div class="checkout-item-thumb"><img src="${itemImg}" alt="${item.name}" loading="lazy" /></div><div class="checkout-item-info"><h4>${item.name}</h4><div class="checkout-item-meta"><span><strong>${item.size.name}</strong> &bull; ${item.vase.name} &bull; Qty: ${item.quantity}</span></div></div><div class="checkout-item-price">$${(item.unitPrice * item.quantity).toFixed(2)}</div></div>`;
      }).join('')}
    </div>
    <form class="checkout-promo-form" id="checkout-promo-form" novalidate>
      <label for="checkout-promo-code">Promo code</label>
      <div class="checkout-promo-controls">
        <input id="checkout-promo-code" type="text" autocomplete="off" autocapitalize="characters" maxlength="32" value="${getPromotionCode()}" placeholder="BLOOM10" aria-describedby="checkout-promo-status" />
        <button type="submit">Apply</button>
      </div>
      <p class="checkout-promo-status ${promotion.state}" id="checkout-promo-status" role="status">${promotion.message || 'Enter a code to see your eligible discount.'}</p>
    </form>
    <div class="checkout-calc-rows">
      <div class="checkout-breakdown-row" style="display:flex;justify-content:space-between;font-size:0.88rem;color:var(--muted);margin-bottom:6px;"><span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="checkout-breakdown-row" style="display:flex;justify-content:space-between;font-size:0.88rem;color:var(--muted);margin-bottom:10px;"><span>Delivery:</span><span>${isFreeDelivery ? `<strong style="color:#059669;">FREE${kingsbiteOffer.isEligible ? ' &middot; Kingsbite' : ''}</strong>` : '<strong>$14.00</strong>'}</span></div>
      <div class="checkout-breakdown-row checkout-discount-row" id="checkout-discount-row" ${discount > 0 ? '' : 'hidden'}><span>Discount <strong id="checkout-promo-label">${discount > 0 ? '(' + promotion.code + ')' : ''}</strong></span><strong id="checkout-discount-value">${discount > 0 ? '&minus;$' + discount.toFixed(2) : ''}</strong></div>
      <div class="checkout-total-row">
        <div class="checkout-total-label-wrap">
          <span>Total Due:</span>
          <small class="checkout-delivery-note">${isFreeDelivery ? (kingsbiteOffer.isEligible ? 'Kingsbite free delivery applied ($40+ with Kingsbite)' : 'Complimentary delivery applied (orders over $100)') : 'Standard delivery ($14.00) applied'}</small>
        </div>
        <strong id="checkout-total-due">$${totalDue.toFixed(2)}</strong>
      </div>
      <div class="checkout-intl-prices" id="checkout-intl-prices">
        <div class="checkout-intl-header">International Store Estimates</div>
        <div class="checkout-intl-strip-items">
          ${getInternationalEstimates(totalDue).map(est => `<span class="checkout-intl-item"><span class="checkout-intl-code">${est.code}</span><span class="checkout-intl-val">${est.formatted}</span></span>`).join('<span class="checkout-intl-sep">&bull;</span>')}
        </div>
      </div>
    </div>
    <div class="checkout-trust-badges">
      <div class="trust-badge-item"><div class="trust-badge-icon">${lockSvg}</div><span><strong>256-Bit SSL Encrypted Checkout</strong></span></div>
    </div>
  `;
}

function updateCheckoutPromotionSummary() {
  const subtotal = getCartSubtotal();
  const cart = getCartItems();
  const kingsbiteOffer = getKingsbiteFreeDeliveryOffer(cart, subtotal);
  const promotion = kingsbiteOffer.isEligible
    ? { code: getPromotionCode(), state: "unavailable", discountUsd: 0, message: "Kingsbite free delivery is applied; promo codes are not combined with this offer." }
    : getPromotionPreview(subtotal);
  const discount = promotion.state === "applied" ? promotion.discountUsd : 0;
  const deliveryFee = hasFreeDelivery(cart, subtotal) ? 0 : 14;
  const total = subtotal + deliveryFee - discount;
  const input = document.getElementById("checkout-promo-code");
  const status = document.getElementById("checkout-promo-status");
  const discountRow = document.getElementById("checkout-discount-row");
  const discountLabel = document.getElementById("checkout-promo-label");
  const discountValue = document.getElementById("checkout-discount-value");
  const totalDue = document.getElementById("checkout-total-due");
  const estimates = document.getElementById("checkout-intl-prices");

  if (input) input.value = getPromotionCode();
  if (status) {
    status.textContent = promotion.message || "Enter a code to see your eligible discount.";
    status.className = `checkout-promo-status ${promotion.state}`;
  }
  if (discountRow) discountRow.hidden = discount <= 0;
  if (discountLabel) discountLabel.textContent = discount > 0 ? `(${promotion.code})` : "";
  if (discountValue) discountValue.textContent = discount > 0 ? `−$${discount.toFixed(2)}` : "";
  if (totalDue) totalDue.textContent = `$${total.toFixed(2)}`;
  if (estimates) {
    estimates.innerHTML = `
      <div class="checkout-intl-header">International Store Estimates</div>
      <div class="checkout-intl-strip-items">
        ${getInternationalEstimates(total).map(est => `
          <span class="checkout-intl-item">
            <span class="checkout-intl-code">${est.code}</span>
            <span class="checkout-intl-val">${est.formatted}</span>
          </span>
        `).join('<span class="checkout-intl-sep">•</span>')}
      </div>
    `;
  }

  // If currently on step 3, re-sync payment intent to reflect the discount
  if (currentStep === 3) {
    currentCheckoutPayloadKey = null;
    initPaymentSurface();
  }
}

/**
 * Bind form interactions, time pills, location types, and submit flow
 */
function bindCheckoutEvents() {
  // Breadcrumb home
  document.querySelectorAll(".btn-checkout-home").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToHome();
    });
  });

  // Breadcrumb / edit cart
  document.querySelectorAll(".btn-checkout-cart, #btn-edit-cart-bag").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openCart();
    });
  });

  const promoForm = document.getElementById("checkout-promo-form");
  promoForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    setPromotionCode(document.getElementById("checkout-promo-code")?.value);
    updateCheckoutPromotionSummary();
  });

  // Step navigation buttons
  document.getElementById('btn-step1-next')?.addEventListener('click', () => { if (validateStep1()) goToStep(2); });
  document.getElementById('btn-step2-back')?.addEventListener('click', () => goToStep(1));
  document.getElementById('btn-step2-next')?.addEventListener('click', () => { if (validateStep2()) goToStep(3); });
  document.getElementById('btn-step3-back')?.addEventListener('click', () => goToStep(2));

  // Direct stepper click navigation (to previously completed steps)
  document.getElementById('co-stepper')?.addEventListener('click', (e) => {
    const stepEl = e.target.closest('.co-step');
    if (!stepEl) return;
    const n = parseInt(stepEl.dataset.step, 10);
    if (n < currentStep) {
      goToStep(n);
    }
  });

  // On-demand payment troubleshooting modal trigger
  document.getElementById('recipient-order-form')?.addEventListener('click', (e) => {
    const helpBtn = e.target.closest('#btn-trigger-payment-help');
    if (helpBtn) {
      e.preventDefault();
      showPaymentTroubleshootingModal();
    }
  });

  // Let Enter continue a valid form step without submitting payment early.
  const checkoutForm = document.getElementById('recipient-order-form');
  checkoutForm?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing || currentStep === 3) return;
    if (event.target.closest('textarea, button')) return;

    event.preventDefault();
    if (currentStep === 1 && validateStep1()) goToStep(2);
    if (currentStep === 2 && validateStep2()) goToStep(3);
  });

  // Time window pills — delegated (step 2 panels start hidden)
  document.getElementById('recipient-order-form')?.addEventListener('click', e => {
    const pill = e.target.closest('.time-window-pill');
    if (!pill) return;
    document.querySelectorAll('.time-window-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedTimeWindow = pill.dataset.window || 'morning';
  });

  // "Same as customer" checkbox handler
  const sameAsBuyerCheckbox = document.getElementById("same-as-buyer");
  const custNameInput = document.getElementById("cust-name");
  const recNameInput = document.getElementById("rec-name");

  const syncRecipientWithBuyer = () => {
    if (sameAsBuyerCheckbox?.checked && recNameInput && custNameInput) {
      recNameInput.value = custNameInput.value;
    }
  };

  sameAsBuyerCheckbox?.addEventListener("change", () => {
    if (sameAsBuyerCheckbox.checked) {
      syncRecipientWithBuyer();
    }
  });

  custNameInput?.addEventListener("input", () => {
    if (sameAsBuyerCheckbox?.checked && recNameInput) {
      recNameInput.value = custNameInput.value;
    }
  });

  // Card note character counter & sync to storage
  const cardMsgTextarea = document.getElementById("rec-card-msg");
  const charCount = document.getElementById("checkout-char-count");
  cardMsgTextarea?.addEventListener("input", (e) => {
    const text = e.target.value;
    if (charCount) {
      charCount.textContent = `${text.length} / 250`;
    }
    // Sync back to cart in localStorage
    try {
      const raw = localStorage.getItem("petal_bloom_cart");
      if (raw) {
        const storedCart = JSON.parse(raw);
        if (storedCart.length > 0) {
          storedCart[0].giftMessage = text;
          localStorage.setItem("petal_bloom_cart", JSON.stringify(storedCart));
        }
      }
    } catch (err) {
      console.warn("Could not sync gift note to storage:", err);
    }
  });
}

/**
 * Show Card Payment Diagnostic / Troubleshooting Modal
 * Guides customers on the 3 true failure modes (online/intl enabled, 3D secure, issuer security filter)
 */
export function showPaymentTroubleshootingModal() {
  let modal = document.getElementById("payment-troubleshoot-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "payment-troubleshoot-modal";
    modal.className = "payment-troubleshoot-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "troubleshoot-modal-title");
    modal.innerHTML = `
      <div class="payment-troubleshoot-dialog">
        <button type="button" class="troubleshoot-close-btn" id="btn-close-troubleshoot" aria-label="Close guidance">&times;</button>
        
        <div class="troubleshoot-header">
          <div class="troubleshoot-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <h3 id="troubleshoot-modal-title">Payment Didn't Go Through?</h3>
          <p>These 3 quick checks usually fix it:</p>
        </div>

        <div class="troubleshoot-steps">
          <div class="troubleshoot-step-item">
            <span class="step-badge">1</span>
            <div class="step-text">
              <strong>Enable Online &amp; International</strong>
              <p>Turn on online and foreign transactions in your banking app.</p>
            </div>
          </div>

          <div class="troubleshoot-step-item">
            <span class="step-badge">2</span>
            <div class="step-text">
              <strong>Approve the OTP / 3D Secure</strong>
              <p>Keep your phone nearby to enter the SMS code or tap approve.</p>
            </div>
          </div>

          <div class="troubleshoot-step-item">
            <span class="step-badge">3</span>
            <div class="step-text">
              <strong>Check Bank Alerts</strong>
              <p>If flagged, try a different card approved for international ecommerce.</p>
            </div>
          </div>
        </div>

        <div class="troubleshoot-actions">
          <button type="button" class="btn-troubleshoot-retry" id="btn-troubleshoot-retry">
            Retry Checkout &rarr;
          </button>
          <button type="button" class="btn-troubleshoot-dismiss" id="btn-troubleshoot-dismiss">
            Review Order Details
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#btn-close-troubleshoot")?.addEventListener("click", () => {
      modal.classList.remove("active");
    });
    modal.querySelector("#btn-troubleshoot-dismiss")?.addEventListener("click", () => {
      modal.classList.remove("active");
    });
    modal.querySelector("#btn-troubleshoot-retry")?.addEventListener("click", () => {
      modal.classList.remove("active");
      const submitBtn = document.querySelector(".handypay-payment-submit");
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        submitBtn.focus();
      }
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }

  requestAnimationFrame(() => {
    modal.classList.add("active");
  });
}
