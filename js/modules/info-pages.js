/**
 * Petal & Bloom — Dedicated Information & Policy Pages Module
 * Handles Customer Care & FAQs, Flower Care Guide, Freshness Guarantee, Contact Us, Privacy Policy, Terms of Service, and Shipping Policies.
 */

import { navigateToHome, navigateToShop, navigateToFAQ, navigateToContact, navigateToPrivacy, navigateToTerms, navigateToShipping, scrollToTop } from "./router.js";
import { showToast } from "./toast.js";
import { ICONS } from "../lib/icons.js";

/**
 * Render Customer Care & FAQs Hub (with Care Guide, Freshness Guarantee, Delivery FAQs tabs)
 */
export function renderFAQPage(tab = "care") {
  const container = document.getElementById("info-view");
  if (!container) return;

  document.title = "Customer Care & FAQs — Petal & Bloom";
  scrollToTop();

  const activeTab = ["care", "guarantee", "delivery"].includes(tab) ? tab : "care";

  container.innerHTML = `
    <!-- Page Header -->
    <header class="info-page-header">
      <div class="container">
        <h1>Customer Care & FAQs</h1>
        <p>Everything you need to know about caring for your blooms, our freshness promise, and delivery logistics.</p>
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <a href="#" class="btn-info-home">Home</a>
          <span>/</span>
          <span class="info-breadcrumb-current">Customer Care</span>
        </nav>
      </div>
    </header>

    <div class="container" style="padding-top: 10px; padding-bottom: 80px;">
      <!-- Tab Navigation -->
      <div class="info-tabs-wrapper">
        <button type="button" class="info-tab-btn ${activeTab === "care" ? "active" : ""}" data-tab="care">
          ${ICONS.leaf} Flower Care Guide
        </button>
        <button type="button" class="info-tab-btn ${activeTab === "guarantee" ? "active" : ""}" data-tab="guarantee">
          ${ICONS.sparkles} 7-Day Guarantee
        </button>
        <button type="button" class="info-tab-btn ${activeTab === "delivery" ? "active" : ""}" data-tab="delivery">
          ${ICONS.truck} Delivery FAQs
        </button>
      </div>

      <!-- Tab Content 1: Care Guide -->
      <div class="info-tab-content" id="tab-content-care" style="display: ${activeTab === "care" ? "block" : "none"};">
        <div class="care-grid">
          <div class="care-card">
            <div class="care-card-icon">${ICONS.scissors}</div>
            <h3>1. Trim at 45° Angle</h3>
            <p>Cut 1 to 2 inches off each stem at a 45-degree angle under cool running water. This prevents air bubbles from blocking water uptake.</p>
          </div>

          <div class="care-card">
            <div class="care-card-icon">${ICONS.leaf}</div>
            <h3>2. Remove Submerged Leaves</h3>
            <p>Strip any foliage that falls below the vase waterline to prevent bacterial growth and keep vase water crystal clear.</p>
          </div>

          <div class="care-card">
            <div class="care-card-icon">${ICONS.sparkles}</div>
            <h3>3. Refresh Water Daily</h3>
            <p>Fresh-cut flowers drink heavily! Top up or completely refresh with cold, clean water and included flower food every 24 to 48 hours.</p>
          </div>

          <div class="care-card">
            <div class="care-card-icon">${ICONS.flower}</div>
            <h3>4. Keep in Cool Ambient Light</h3>
            <p>Place blooms in a cool room away from direct afternoon sun, heating vents, drafts, and fruit bowls (ethylene gas causes early aging).</p>
          </div>
        </div>

        <!-- Bloom-Specific Care Pro-Tips -->
        <div class="guarantee-banner" style="margin-top: 20px;">
          <div class="guarantee-content">
            <span class="guarantee-badge">Florist Pro Tips</span>
            <h2>Care For Delicate Blooms</h2>
            <ul class="care-pro-tips-list">
              <li>
                <span class="care-tip-icon">${ICONS.flower}</span>
                <div class="care-tip-text">
                  <strong>Hydrangeas:</strong> If a head wilts, submerge the entire bloom head in cool water for 20 minutes to rehydrate immediately.
                </div>
              </li>
              <li>
                <span class="care-tip-icon">${ICONS.flower}</span>
                <div class="care-tip-text">
                  <strong>Tulips:</strong> Keep water shallow (2–3 inches). Tulips continue growing 1–2 inches in the vase—trim every couple of days.
                </div>
              </li>
              <li>
                <span class="care-tip-icon">${ICONS.flower}</span>
                <div class="care-tip-text">
                  <strong>Lilies:</strong> Gently pinch off golden pollen anthers as petals open to prevent fabric stains and prolong bloom lifespan.
                </div>
              </li>
              <li>
                <span class="care-tip-icon">${ICONS.flower}</span>
                <div class="care-tip-text">
                  <strong>Orchids:</strong> Water potted orchids with 3 ice cubes once weekly; avoid standing water in decorative outer pots.
                </div>
              </li>
            </ul>
          </div>
          <div style="text-align: center;">
            <img src="images/hero.webp" alt="Floral Care" style="width: 100%; max-width: 380px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);" />
          </div>
        </div>
      </div>

      <!-- Tab Content 2: Freshness Guarantee -->
      <div class="info-tab-content" id="tab-content-guarantee" style="display: ${activeTab === "guarantee" ? "block" : "none"};">
        <div class="guarantee-banner">
          <div class="guarantee-content">
            <span class="guarantee-badge">100% Satisfaction Promise</span>
            <h2>Our 7-Day Bloom Guarantee</h2>
            <p>Every arrangement from Petal & Bloom is hand-selected at peak bud directly from verified sustainable botanical growers. We guarantee your flowers will remain fresh and vibrant for at least 7 days from arrival.</p>
            <ul class="guarantee-list">
              <li>
                <span class="guarantee-list-icon">${ICONS.check}</span>
                <div class="care-tip-text">Direct cold-chain grower sourcing ensuring zero warehouse delay</div>
              </li>
              <li>
                <span class="guarantee-list-icon">${ICONS.check}</span>
                <div class="care-tip-text">Protective stem hydration reservoir during transit</div>
              </li>
              <li>
                <span class="guarantee-list-icon">${ICONS.check}</span>
                <div class="care-tip-text">Instant complimentary replacement if blooms fail before day 7</div>
              </li>
            </ul>
          </div>
          <div style="text-align: center;">
            <img src="images/flower-shop.webp" alt="Botanical Freshness Guarantee" style="width: 100%; max-width: 400px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);" />
          </div>
        </div>

        <div class="care-grid" style="margin-top: 30px;">
          <div class="care-card">
            <div class="care-card-icon">${ICONS.heart}</div>
            <h3>How to Claim Replacement</h3>
            <p>If your flowers do not arrive in peak condition or wilt prematurely within 7 days, simply snap a photo and email our floral studio team for a free replacement or instant full refund.</p>
          </div>
          <div class="care-card">
            <div class="care-card-icon">${ICONS.truck}</div>
            <h3>White-Glove Temperature Control</h3>
            <p>Our couriers utilize insulated climate-controlled packaging designed specifically for seasonal climate extremes so petals never freeze or overheat.</p>
          </div>
        </div>
      </div>

      <!-- Tab Content 3: Delivery FAQs -->
      <div class="info-tab-content" id="tab-content-delivery" style="display: ${activeTab === "delivery" ? "block" : "none"};">
        <div class="faq-accordion">
          <div class="faq-item open">
            <button type="button" class="faq-question-btn">
              <span>What are your same-day delivery cut-off times?</span>
              <span class="faq-icon-arrow">▼</span>
            </button>
            <div class="faq-answer">
              Orders placed before <strong>1:00 PM (local recipient time)</strong> Monday through Saturday qualify for guaranteed same-day delivery. Orders placed after 1:00 PM are hand-delivered the following morning.
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question-btn">
              <span>How are bouquets kept hydrated during transit?</span>
              <span class="faq-icon-arrow">▼</span>
            </button>
            <div class="faq-answer">
              Every hand-tied bouquet is secured inside our specialized compostable hydration pouch containing nutrient-rich water. This keeps stems continuously drinking and cool for up to 36 hours.
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question-btn">
              <span>What happens if the recipient is not home?</span>
              <span class="faq-icon-arrow">▼</span>
            </button>
            <div class="faq-answer">
              Our white-glove driver will look for a safe, shaded location (porch, concierge, or neighbor) and leave a physical delivery notice alongside an instant SMS delivery notification with a photo. If no safe location exists, we will re-attempt delivery at no extra charge.
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question-btn">
              <span>Can I choose a specific morning or afternoon delivery window?</span>
              <span class="faq-icon-arrow">▼</span>
            </button>
            <div class="faq-answer">
              Yes! During checkout, you can select between <strong>Morning (9:00 AM – 1:00 PM)</strong> or <strong>Afternoon (1:00 PM – 6:00 PM)</strong> delivery windows.
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question-btn">
              <span>Do you deliver to hospitals, corporate offices, and funeral homes?</span>
              <span class="faq-icon-arrow">▼</span>
            </button>
            <div class="faq-answer">
              Yes, we deliver to all residential and commercial addresses. For hospital or office deliveries, please ensure room numbers or department names are specified in the recipient notes during checkout.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindFAQEvents();
}

/**
 * Bind tab switching and accordion events in FAQ
 */
function bindFAQEvents() {
  const container = document.getElementById("info-view");
  if (!container) return;

  container.querySelectorAll(".btn-info-home").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToHome();
    });
  });

  // Tab switching
  container.querySelectorAll(".info-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      navigateToFAQ(tabName);
    });
  });

  // Accordion toggles
  container.querySelectorAll(".faq-question-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      if (item) {
        item.classList.toggle("open");
      }
    });
  });
}

/**
 * Render Contact Us & Studio Consultation Page
 */
export function renderContactPage() {
  const container = document.getElementById("info-view");
  if (!container) return;

  document.title = "Contact Our Florists — Petal & Bloom";
  scrollToTop();

  container.innerHTML = `
    <!-- Page Header -->
    <header class="info-page-header">
      <div class="container">
        <h1>Contact Our Studio</h1>
        <p>Have questions about a bespoke arrangement, corporate order, or wedding consultation? Our florists are here to help.</p>
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <a href="#" class="btn-info-home">Home</a>
          <span>/</span>
          <span class="info-breadcrumb-current">Contact Us</span>
        </nav>
      </div>
    </header>

    <div class="container">
      <div class="contact-grid">
        <!-- Left: Studio Details & Cards -->
        <div class="contact-info-panel">
          <div class="contact-card">
            <div class="contact-card-icon">${ICONS.flower}</div>
            <div>
              <h4>Atelier Studio & Pickup</h4>
              <p>10404 124 Street NW, Suite 201<br>Edmonton, AB T5N 1R5, Canada</p>
            </div>
          </div>

          <div class="contact-card">
            <div class="contact-card-icon">${ICONS.envelope}</div>
            <div>
              <h4>Direct Inquiries</h4>
              <p>General: <a href="mailto:hello@petalandbloom.com">hello@petalandbloom.com</a><br>Custom Orders: <a href="mailto:concierge@petalandbloom.com">concierge@petalandbloom.com</a></p>
            </div>
          </div>

          <div class="contact-card">
            <div class="contact-card-icon">${ICONS.sparkles}</div>
            <div>
              <h4>Studio Hours</h4>
              <p>Monday – Friday: 8:00 AM – 7:00 PM MST<br>Saturday & Sunday: 9:00 AM – 5:00 PM MST</p>
            </div>
          </div>

          <div class="contact-card">
            <div class="contact-card-icon">${ICONS.truck}</div>
            <div>
              <h4>Greater Edmonton Delivery Concierge</h4>
              <p>Studio Desk: <a href="tel:+17805557382">+1 (780) 555-PETAL</a></p>
            </div>
          </div>

          <div class="contact-card">
            <div class="contact-card-icon">${ICONS.sparkles}</div>
            <div>
              <h4>International Sister Boutiques</h4>
              <p>• <strong>London Studio (UK):</strong> <a href="mailto:london@petalandbloom.com">london@petalandbloom.com</a><br>• <strong>Accra Atelier (Ghana):</strong> <a href="mailto:accra@petalandbloom.com">accra@petalandbloom.com</a></p>
            </div>
          </div>
        </div>

        <!-- Right: Interactive Contact Form -->
        <div class="contact-form-panel">
          <h3>Send Us a Message</h3>
          <p>Fill out the form below and our master florists will respond within 2 business hours.</p>

          <form id="contact-form">
            <div class="form-group">
              <label for="contact-name">Your Full Name *</label>
              <input type="text" id="contact-name" class="form-input" placeholder="e.g. Eleanor Vance" required />
            </div>

            <div class="form-group">
              <label for="contact-email">Email Address *</label>
              <input type="email" id="contact-email" class="form-input" placeholder="e.g. eleanor@example.com" required />
            </div>

            <div class="form-group">
              <label for="contact-subject">Inquiry Type</label>
              <select id="contact-subject" class="form-select">
                <option value="general">General Question</option>
                <option value="custom">Bespoke Custom Arrangement</option>
                <option value="wedding">Weddings & Private Celebrations</option>
                <option value="corporate">Corporate & Weekly Office Subscriptions</option>
                <option value="order">Existing Order Assistance</option>
              </select>
            </div>

            <div class="form-group">
              <label for="contact-message">How can we assist you? *</label>
              <textarea id="contact-message" class="form-textarea" placeholder="Tell us about your flower needs, preferred palette, or event date..." required></textarea>
            </div>

            <button type="submit" class="button button-dark" style="width: 100%; padding: 14px; font-weight: 700;">
              Send Message &rarr;
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  bindContactEvents();
}

/**
 * Bind contact form submission
 */
function bindContactEvents() {
  const container = document.getElementById("info-view");
  if (!container) return;

  container.querySelectorAll(".btn-info-home").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToHome();
    });
  });

  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("contact-name")?.value || "Friend";

      showToast({
        title: "Message Sent!",
        message: `Thank you, ${name}. Our florists will reply to your email shortly.`,
        icon: ICONS.check,
        duration: 5000
      });

      form.reset();
    });
  }
}

/**
 * Render Legal & Policy Pages (Privacy Policy, Terms of Service, Shipping Policy)
 */
export function renderPolicyPage(type = "privacy") {
  const container = document.getElementById("info-view");
  if (!container) return;

  scrollToTop();

  if (type === "privacy") {
    document.title = "Privacy Policy — Petal & Bloom";
    renderPrivacyContent(container);
  } else if (type === "terms") {
    document.title = "Terms of Service — Petal & Bloom";
    renderTermsContent(container);
  } else if (type === "shipping") {
    document.title = "Shipping & Returns Policy — Petal & Bloom";
    renderShippingContent(container);
  }

  container.querySelectorAll(".btn-info-home").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToHome();
    });
  });
}

function renderPrivacyContent(container) {
  container.innerHTML = `
    <header class="info-page-header">
      <div class="container">
        <h1>Privacy Policy</h1>
        <p>Your privacy and the security of your botanical orders are paramount to Petal & Bloom.</p>
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <a href="#" class="btn-info-home">Home</a>
          <span>/</span>
          <span class="info-breadcrumb-current">Privacy Policy</span>
        </nav>
      </div>
    </header>

    <div class="container">
      <article class="legal-layout">
        <div class="legal-last-updated">Last Updated: September 2026</div>

        <section class="legal-section">
          <h2>1. Information We Collect</h2>
          <p>When you purchase botanical arrangements or interact with Petal & Bloom Studio, we collect essential information required to fulfill your delivery, including:</p>
          <ul>
            <li><strong>Sender Contact Details:</strong> Name, email address, phone number, and billing details.</li>
            <li><strong>Recipient Logistics:</strong> Recipient full name, physical delivery address, gate codes, delivery time preference, and personalized gift card messages.</li>
            <li><strong>Browsing & Preferences:</strong> Anonymized shopping bag state and wishlist items stored securely in your browser's local storage.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>2. Secure Payment Processing</h2>
          <p>We do not store or process complete payment card details directly on our servers. All financial transactions are securely tokenized through HandyPay and Stripe's payment infrastructure.</p>
        </section>

        <section class="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use customer data strictly for legitimate floral retail operations:</p>
          <ul>
            <li>Preparing, packaging, and dispatching your flower arrangements.</li>
            <li>Sending SMS and email order confirmation receipts and live delivery tracking.</li>
            <li>Providing responsive florist concierge support and honor our 7-Day Bloom Guarantee.</li>
          </ul>
          <div class="legal-callout">
            <strong>We Never Sell Data:</strong> Petal & Bloom will never sell, rent, or trade your personal information or recipient contact information to third-party marketers.
          </div>
        </section>

        <section class="legal-section">
          <h2>4. Cookies & Local Storage</h2>
          <p>Our website utilizes local storage tokens to preserve your active shopping bag, saved wishlist items, and session preferences across page reloads.</p>
        </section>

        <section class="legal-section">
          <h2>5. Contacting Our Privacy Officer</h2>
          <p>If you have questions regarding data privacy or wish to request erasure of your customer profile, please contact us at <a href="mailto:privacy@petalandbloom.com" style="color: var(--primary); font-weight: 600;">privacy@petalandbloom.com</a>.</p>
        </section>
      </article>
    </div>
  `;
}

function renderTermsContent(container) {
  container.innerHTML = `
    <header class="info-page-header">
      <div class="container">
        <h1>Terms of Service</h1>
        <p>Please review the standard terms governing floral purchases, delivery obligations, and perishable goods.</p>
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <a href="#" class="btn-info-home">Home</a>
          <span>/</span>
          <span class="info-breadcrumb-current">Terms of Service</span>
        </nav>
      </div>
    </header>

    <div class="container">
      <article class="legal-layout">
        <div class="legal-last-updated">Last Updated: September 2026</div>

        <section class="legal-section">
          <h2>1. Agreement to Terms</h2>
          <p>By browsing, placing an order, or utilizing services provided by Petal & Bloom Studio ("we", "us", "our"), you agree to be bound by these Terms of Service.</p>
        </section>

        <section class="legal-section">
          <h2>2. Perishable Floral Goods & Seasonal Variations</h2>
          <p>Flowers are natural living creations subject to seasonal climate availability. While our artisan florists adhere closely to arrangement photos, stem color gradients, foliage shapes, and bloom sizes may vary slightly depending on peak crop harvests. In all cases, substitutions are made with stems of equal or greater value and luxury grade.</p>
        </section>

        <section class="legal-section">
          <h2>3. Order Acceptance & Cancellations</h2>
          <p>Because flowers are custom cut and arranged per order:</p>
          <ul>
            <li><strong>Cancellations / Modifications:</strong> Permitted up to 24 hours prior to the scheduled delivery date.</li>
            <li><strong>Same-Day Orders:</strong> Once an artisan has commenced cutting and arranging stems, orders cannot be cancelled.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. 7-Day Bloom Guarantee & Replacement Policy</h2>
          <p>We stand behind the freshness of every bloom. If an arrangement wilts before 7 days despite following the care guide, notify our studio with a photograph within 7 days of delivery for a free immediate replacement or full studio credit.</p>
        </section>

        <section class="legal-section">
          <h2>5. Limitation of Liability</h2>
          <p>Petal & Bloom is not liable for indirect or consequential damages resulting from delayed delivery due to inaccurate address submissions, severe weather acts, or recipient unavailability.</p>
        </section>
      </article>
    </div>
  `;
}

function renderShippingContent(container) {
  container.innerHTML = `
    <header class="info-page-header">
      <div class="container">
        <h1>Shipping & Returns Policy</h1>
        <p>Information on white-glove hand delivery, transit hydration, and replacement standards.</p>
        <nav class="info-breadcrumb" aria-label="Breadcrumb">
          <a href="#" class="btn-info-home">Home</a>
          <span>/</span>
          <span class="info-breadcrumb-current">Shipping & Returns</span>
        </nav>
      </div>
    </header>

    <div class="container">
      <article class="legal-layout">
        <div class="legal-last-updated">Last Updated: September 2026</div>

        <section class="legal-section">
          <h2>1. Delivery Methods & Times</h2>
          <p>All arrangements are transported via specialized climate-controlled couriers with hydration stem wraps to prevent petal stress:</p>
          <ul>
            <li><strong>Complimentary Local Delivery:</strong> Automatically applied on all orders of $100 or more.</li>
            <li><strong>Standard Delivery ($14):</strong> Applicable on orders under $100.</li>
            <li><strong>Morning Window:</strong> Delivered between 9:00 AM and 1:00 PM local time.</li>
            <li><strong>Afternoon Window:</strong> Delivered between 1:00 PM and 6:00 PM local time.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>2. Returns for Perishable Items</h2>
          <p>Due to the perishable nature of fresh-cut botanicals, physical returns of bouquets are not required. Instead, our <strong>7-Day Freshness Guarantee</strong> ensures full refunds or fresh replacements if your blooms fail to thrive within 7 days.</p>
          <div class="legal-callout">
            <strong>Need help with your delivery?</strong> Contact our client concierge immediately at <a href="mailto:concierge@petalandbloom.com" style="color: var(--primary); font-weight: 600;">concierge@petalandbloom.com</a>.
          </div>
        </section>
      </article>
    </div>
  `;
}
