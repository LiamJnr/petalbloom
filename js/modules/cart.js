/**
 * Cart State Management & Slide-over Drawer Module
 * Includes persistent localStorage, free shipping meter, and auto-syncing catalog data.
 */
import { showToast } from "./toast.js";
import { getGiftComboUpgradesForCartItem, getProductBySlug, GIFT_ADDONS } from "../data/products.js";
import { ICONS } from "../lib/icons.js";
import { getInternationalEstimates } from "../lib/currency.js";
import { getPromotionCode, getPromotionPreview, setPromotionCode } from "../lib/promotion.js";
import { navigateToCheckout } from "./router.js";
import { getKingsbiteFreeDeliveryOffer, hasFreeDelivery, STANDARD_FREE_DELIVERY_THRESHOLD_USD } from "../lib/kingsbite-delivery.js";
import { calculateProcessingFee } from "../lib/processing-fee.js";

const CART_STORAGE_KEY = "petal_bloom_cart";
const FREE_SHIPPING_THRESHOLD = STANDARD_FREE_DELIVERY_THRESHOLD_USD;

let cartItems = [];

/**
 * Initialize Cart Module
 */
export function initCart() {
  loadCartFromStorage();
  renderCartDrawerMarkup();
  bindCartEvents();
  updateCartUI();
}

/**
 * Load cart from localStorage and sanitize product images with live catalog
 */
function loadCartFromStorage() {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    cartItems = data ? JSON.parse(data) : [];

    // Automatically heal/sync items and prices with the live catalog.
    let hasChanges = false;
    cartItems = cartItems.map(item => {
      const liveProduct = getProductBySlug(item.slug);
      if (liveProduct) {
        const size = liveProduct.sizes.find(option => option.id === item.size?.id);
        const vase = liveProduct.vases.find(option => option.id === item.vase?.id);
        if (!size || !vase) return item;

        const unitPrice = size.price + vase.price;
        if (
          item.image !== liveProduct.images.primary ||
          item.name !== liveProduct.name ||
          item.unitPrice !== unitPrice ||
          item.checkoutUrl
        ) {
          hasChanges = true;
          const { checkoutUrl, ...savedItem } = item;
          return {
            ...savedItem,
            name: liveProduct.name,
            image: liveProduct.images.primary,
            size: { ...size },
            vase: { ...vase },
            unitPrice
          };
        }
      }
      return item;
    });

    if (hasChanges) {
      saveCartToStorage();
    }
  } catch {
    cartItems = [];
  }
}

/**
 * Persist cart state to localStorage
 */
function saveCartToStorage() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (err) {
    console.error("Failed to save cart to storage", err);
  }
}

/**
 * Add an item or increment quantity
 */
export function addToCart(itemData) {
  const { product, size, vase, giftMessage = "", deliveryDate = "", quantity = 1 } = itemData;

  const itemId = `${product.slug}_${size.id}_${vase.id}_${encodeURIComponent(giftMessage.slice(0, 10))}`;

  const existing = cartItems.find(item => item.id === itemId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cartItems.push({
      id: itemId,
      slug: product.slug,
      name: product.name,
      image: product.images.primary,
      size: { ...size },
      vase: { ...vase },
      giftMessage,
      deliveryDate,
      unitPrice: size.price + vase.price,
      quantity
    });
  }

  saveCartToStorage();
  updateCartUI();

  showToast({
    title: "Added to Flower Bag!",
    message: `${product.name} (${size.name}) is ready in your bag.`,
    icon: ICONS.bag
  });
}

/**
 * Remove an item completely
 */
export function removeFromCart(itemId) {
  cartItems = cartItems.filter(i => i.id !== itemId);
  saveCartToStorage();
  updateCartUI();
}

/**
 * Update quantity (+1 or -1)
 */
export function updateQuantity(itemId, delta) {
  const item = cartItems.find(i => i.id === itemId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(itemId);
  } else {
    item.quantity = newQty;
    saveCartToStorage();
    updateCartUI();
  }
}

function getComboUpgradeOffer() {
  for (const item of cartItems) {
    const combo = getGiftComboUpgradesForCartItem(item, cartItems)[0];
    if (combo) return { item, combo };
  }
  return null;
}

function upgradeCartItemToCombo(itemId, comboSlug) {
  const item = cartItems.find(cartItem => cartItem.id === itemId);
  const combo = getProductBySlug(comboSlug);
  if (!item || !combo?.isCombo) return;

  const isEligible = getGiftComboUpgradesForCartItem(item, cartItems)
    .some(candidate => candidate.slug === combo.slug);
  if (!isEligible) return;

  const size = combo.sizes.find(option => option.default) || combo.sizes[0];
  const vase = combo.vases[0];
  const giftMessage = String(item.giftMessage || "");
  const comboItemId = `${combo.slug}_${size.id}_${vase.id}_${encodeURIComponent(giftMessage.slice(0, 10))}`;
  const existingCombo = cartItems.find(cartItem => cartItem.id === comboItemId);

  cartItems = cartItems.filter(cartItem => cartItem.id !== item.id);
  if (existingCombo) {
    existingCombo.quantity += item.quantity;
  } else {
    cartItems.push({
      id: comboItemId,
      slug: combo.slug,
      name: combo.name,
      image: combo.images.primary,
      size: { ...size },
      vase: { ...vase },
      giftMessage,
      deliveryDate: item.deliveryDate,
      unitPrice: size.price + vase.price,
      quantity: item.quantity,
    });
  }

  saveCartToStorage();
  updateCartUI();
  showToast({
    title: "Gift Set Added",
    message: `${combo.name} now includes your ${item.name} and its curated pairings.`,
    icon: ICONS.sparkles,
  });
}

/**
 * Open the Cart Drawer
 */
export function openCart() {
  const backdrop = document.getElementById("cart-backdrop");
  const drawer = document.getElementById("cart-drawer-aside");
  if (backdrop) {
    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  if (drawer) {
    drawer.classList.add("open");
  }
}

/**
 * Close the Cart Drawer
 */
export function closeCart() {
  const backdrop = document.getElementById("cart-backdrop");
  const drawer = document.getElementById("cart-drawer-aside");
  if (document.activeElement && backdrop && backdrop.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  if (backdrop) {
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  if (drawer) {
    drawer.classList.remove("open");
  }
}

/**
 * Calculate Subtotal & Total
 */
export function getCartSubtotal() {
  return cartItems.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);
}

export function getTotalItemCount() {
  return cartItems.reduce((acc, item) => acc + item.quantity, 0);
}

export function getCartItems() {
  return cartItems.map(item => ({ ...item, size: { ...item.size }, vase: { ...item.vase } }));
}

export function clearCart() {
  cartItems = [];
  saveCartToStorage();
  updateCartUI();
  closeCart();
}

function getItemUnitPrice(item) {
  return Number(item.size?.price || 0) + Number(item.vase?.price || 0);
}

/**
 * Render the Cart Drawer HTML structure
 */
function renderCartDrawerMarkup() {
  const backdrop = document.getElementById("cart-backdrop");
  if (!backdrop) return;
  if (document.getElementById("cart-drawer-aside")) return; // already rendered

  backdrop.innerHTML = `
    <aside id="cart-drawer-aside" class="cart-drawer" role="dialog" aria-labelledby="cart-drawer-title" aria-modal="true">
      
      <!-- Header -->
      <div class="cart-header">
        <div class="cart-header-title">
          <h3 id="cart-drawer-title">Shopping Bag</h3>
          <span class="cart-drawer-badge" id="cart-drawer-badge">0 items</span>
        </div>
        <button type="button" class="cart-close-btn" id="btn-close-cart" aria-label="Close bag">&times;</button>
      </div>

      <!-- Free Delivery Progress Meter -->
      <div class="cart-shipping-meter">
        <p class="shipping-meter-text" id="shipping-meter-text">
          <span>Add <strong>$100.00</strong> more for <strong>FREE Local Delivery</strong></span>
        </p>
        <div class="shipping-meter-track">
          <div class="shipping-meter-fill" id="shipping-meter-fill" style="width: 0%"></div>
        </div>
      </div>

      <!-- Cart Items List Container -->
      <div class="cart-body">
        <div class="cart-combo-upgrade-section" id="cart-combo-upgrade-container">
          <!-- Populated dynamically when a set upgrade is available -->
        </div>
        <div id="cart-items-container">
          <!-- Populated dynamically -->
        </div>

        <!-- Ultra-Compact Add-Ons Upsell Section -->
        <div class="cart-addons-section" id="cart-addons-container">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Cart Footer & Checkout -->
      <div class="cart-footer" id="cart-footer">
        <form class="promo-code-form" id="cart-promo-form" novalidate>
          <label for="cart-promo-code">Promo code</label>
          <div class="promo-code-controls">
            <input id="cart-promo-code" type="text" autocomplete="off" autocapitalize="characters" maxlength="32" placeholder="Enter Promo Code" aria-describedby="cart-promo-status" />
            <button type="submit" class="promo-apply-btn" id="btn-cart-promo-apply">Apply</button>
            <button type="button" class="promo-remove-btn" id="btn-cart-promo-remove" style="display: none;" aria-label="Remove promo code">&times; Remove</button>
          </div>
          <p class="promo-code-status" id="cart-promo-status" role="status"></p>
        </form>
        <div class="cart-price-breakdown" aria-label="Order price breakdown">
          <span>Subtotal</span><span id="cart-subtotal-val">$0.00</span>
          <span>Delivery</span><span id="cart-delivery-val">$0.00</span>
          <span class="cart-discount-label" id="cart-discount-label" hidden>Discount <b id="cart-promo-label"></b></span><span class="cart-discount-value" id="cart-discount-val" hidden></span>
          <span>Processing Fee (4.9% + $0.40)</span><strong id="cart-processing-fee-val">$0.00</strong>
        </div>
        <div class="cart-total-row">
          <div class="cart-total-label-wrap">
            <span>Total Due:</span>
            <small class="cart-delivery-note" id="cart-delivery-note">Complimentary delivery on orders $100+</small>
          </div>
          <strong id="cart-total-val">$0.00</strong>
        </div>

        <!-- Sleek Single-Line International Store Estimates -->
        <div class="cart-intl-estimates" id="cart-intl-estimates">
          <!-- Populated dynamically via updateCartUI() -->
        </div>

        <button
          type="button"
          class="button button-dark cart-checkout-btn"
          id="btn-cart-checkout"
        >
          Process Order &rarr;
        </button>
      </div>

    </aside>
  `;
}

/**
 * Bind Drawer open/close and body clicks
 */
function bindCartEvents() {
  const backdrop = document.getElementById("cart-backdrop");
  const closeBtn = document.getElementById("btn-close-cart");

  closeBtn?.addEventListener("click", closeCart);

  // Close when clicking outside drawer
  backdrop?.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeCart();
    }
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop?.classList.contains("open")) {
      closeCart();
    }
  });

  // Proceed to Checkout button -> Opens Order Details Page
  const checkoutBtn = document.getElementById("btn-cart-checkout");
  checkoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (checkoutBtn) checkoutBtn.blur();
    closeCart();
    navigateToCheckout();
  });

  const promoForm = document.getElementById("cart-promo-form");
  promoForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    setPromotionCode(document.getElementById("cart-promo-code")?.value);
    updateCartUI();
  });

  const cartPromoRemoveBtn = document.getElementById("btn-cart-promo-remove");
  cartPromoRemoveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    setPromotionCode("");
    const promoInput = document.getElementById("cart-promo-code");
    if (promoInput) promoInput.value = "";
    updateCartUI();
  });

  // Cart body delegation for steppers & remove buttons
  const body = document.getElementById("cart-items-container");
  body?.addEventListener("click", (e) => {
    const itemEl = e.target.closest(".cart-item");
    if (!itemEl) return;

    const itemId = itemEl.dataset.itemId;
    if (!itemId) return;

    if (e.target.closest(".btn-stepper-minus")) {
      updateQuantity(itemId, -1);
    } else if (e.target.closest(".btn-stepper-plus")) {
      updateQuantity(itemId, 1);
    } else if (e.target.closest(".cart-item-remove-btn")) {
      removeFromCart(itemId);
    }
  });

  // Add-on quick add clicks
  const addonsSection = document.getElementById("cart-addons-container");
  addonsSection?.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".btn-quick-addon");
    if (!addBtn) return;
    const slug = addBtn.dataset.slug;
    const addon = (GIFT_ADDONS || []).find(a => a.slug === slug);
    if (addon) {
      addToCart({
        product: addon,
        size: addon.sizes[0],
        vase: addon.vases[0],
        giftMessage: "",
        quantity: 1
      });
      showToast({
        title: "Added to Bag",
        message: `${addon.name} added to your order.`,
        duration: 3000
      });
    }
  });

  const comboUpgradeSection = document.getElementById("cart-combo-upgrade-container");
  comboUpgradeSection?.addEventListener("click", (e) => {
    const upgradeButton = e.target.closest(".btn-cart-combo-upgrade");
    if (!upgradeButton) return;
    upgradeCartItemToCombo(upgradeButton.dataset.itemId, upgradeButton.dataset.comboSlug);
  });

  // Global custom events
  document.addEventListener("open-cart", openCart);
  document.addEventListener("add-to-cart", (e) => {
    if (e.detail) {
      addToCart(e.detail);
    }
  });
}

/**
 * Synchronize UI with current cart state
 */
export function updateCartUI() {
  const container = document.getElementById("cart-items-container");
  const footer = document.getElementById("cart-footer");
  const badge = document.getElementById("cart-badge");
  const drawerBadge = document.getElementById("cart-drawer-badge");
  const subtotalEl = document.getElementById("cart-subtotal-val");
  const deliveryEl = document.getElementById("cart-delivery-val");
  const processingFeeEl = document.getElementById("cart-processing-fee-val");
  const totalEl = document.getElementById("cart-total-val");
  const shippingText = document.getElementById("shipping-meter-text");
  const shippingFill = document.getElementById("shipping-meter-fill");

  const totalCount = getTotalItemCount();
  const subtotal = getCartSubtotal();
  const kingsbiteOffer = getKingsbiteFreeDeliveryOffer(cartItems, subtotal);
  const promotion = kingsbiteOffer.isEligible
    ? { code: getPromotionCode(), state: "unavailable", discountUsd: 0, message: "Kingsbite free delivery is applied; promo codes are not combined with this offer." }
    : getPromotionPreview(subtotal);

  // 1. Update Navbar Badge
  if (badge) {
    badge.textContent = totalCount;
    badge.classList.toggle("has-items", totalCount > 0);
  }

  // 2. Update Drawer Badge
  if (drawerBadge) {
    drawerBadge.textContent = `${totalCount} item${totalCount === 1 ? "" : "s"}`;
  }

  // 3. Free Delivery Progress
  if (shippingText && shippingFill) {
    const target = kingsbiteOffer.hasKingsbite ? 40 : FREE_SHIPPING_THRESHOLD;
    const remaining = target - subtotal;
    const pct = Math.min(100, Math.round((subtotal / target) * 100));
    shippingFill.style.width = `${pct}%`;

    if (hasFreeDelivery(cartItems, subtotal) && subtotal > 0) {
      const offerLabel = kingsbiteOffer.isEligible ? "Kingsbite free delivery" : "FREE Local Florist Delivery";
      shippingText.innerHTML = `${ICONS.sparkles} <span><strong>Congratulations!</strong> You unlocked <strong>${offerLabel}</strong>!</span>`;
      shippingFill.classList.add("unlocked");
    } else if (kingsbiteOffer.hasKingsbite) {
      shippingText.innerHTML = `<span>Add <strong>$${Math.max(0, remaining).toFixed(2)}</strong> more to unlock <strong>Kingsbite free delivery</strong></span>`;
      shippingFill.classList.remove("unlocked");
    } else {
      shippingText.innerHTML = `<span>Add <strong>$${Math.max(0, remaining).toFixed(2)}</strong> more for <strong>FREE Local Delivery</strong></span>`;
      shippingFill.classList.remove("unlocked");
    }
  }

  // 4. Render Cart Items
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">${ICONS.flower}</div>
        <h4>Your Shopping Bag is Empty</h4>
        <p>Explore our freshly cut bouquets and artisanal botanical gifts.</p>
        <button class="button button-dark" id="btn-start-shopping" type="button">
          Explore Flower Collection &rarr;
        </button>
      </div>
    `;

    document.getElementById("btn-start-shopping")?.addEventListener("click", () => {
      closeCart();
      document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
    });

    if (footer) footer.style.display = "none";
    const addonsSection = document.getElementById("cart-addons-container");
    if (addonsSection) addonsSection.style.display = "none";
    const comboUpgradeSection = document.getElementById("cart-combo-upgrade-container");
    if (comboUpgradeSection) comboUpgradeSection.style.display = "none";
    return;
  }

  if (footer) footer.style.display = "flex";

  const comboUpgradeSection = document.getElementById("cart-combo-upgrade-container");
  const comboUpgradeOffer = getComboUpgradeOffer();
  if (comboUpgradeSection) {
    if (comboUpgradeOffer) {
      const { item, combo } = comboUpgradeOffer;
      const comboPrice = combo.sizes.find(size => size.default)?.price ?? combo.sizes[0].price;
      comboUpgradeSection.style.display = "block";
      comboUpgradeSection.innerHTML = `
        <section class="cart-combo-upgrade" aria-label="Upgrade ${item.name} to a gift set">
          <img src="${combo.images.primary}" alt="${combo.name}" loading="lazy" />
          <div class="cart-combo-upgrade-copy">
            <span>Complete the gift · Save $${combo.comboSavings}</span>
            <strong>Upgrade to ${combo.name}</strong>
            <p>Includes your ${item.name} plus curated pairings for $${comboPrice.toFixed(2)}.</p>
          </div>
          <button type="button" class="btn-cart-combo-upgrade" data-item-id="${item.id}" data-combo-slug="${combo.slug}">Upgrade</button>
        </section>
      `;
    } else {
      comboUpgradeSection.style.display = "none";
      comboUpgradeSection.innerHTML = "";
    }
  }

  // Build items HTML with verified live product image
  container.innerHTML = cartItems.map(item => {
    const liveProduct = getProductBySlug(item.slug);
    const itemImg = liveProduct?.images.primary || item.image;

    return `
      <article class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-img">
          <img src="${itemImg}" alt="${item.name}" loading="lazy" />
        </div>

        <div class="cart-item-details">
          <div class="cart-item-title-row">
            <h4 class="cart-item-title">${item.name}</h4>
            <button class="cart-item-remove-btn" type="button" aria-label="Remove ${item.name} from bag">&times;</button>
          </div>

          <div class="cart-item-meta">
            <span><strong>${item.size.name}</strong> • ${item.vase.name}</span>
            ${item.giftMessage ? `<span class="cart-item-note"><span style="display:inline-flex;align-items:center;gap:3px;vertical-align:middle;">${ICONS.envelope}</span> Note: "${item.giftMessage.slice(0, 24)}${item.giftMessage.length > 24 ? "..." : ""}"</span>` : ""}
          </div>

          <div class="cart-item-bottom">
            <div class="cart-stepper">
              <button class="stepper-btn btn-stepper-minus" type="button" aria-label="Decrease quantity">−</button>
              <span class="stepper-count">${item.quantity}</span>
              <button class="stepper-btn btn-stepper-plus" type="button" aria-label="Increase quantity">+</button>
            </div>

            <div class="cart-item-price">
              $${(getItemUnitPrice(item) * item.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // 5. Update Totals & Delivery Note
  const isFreeDelivery = hasFreeDelivery(cartItems, subtotal) || subtotal === 0;
  const deliveryFee = (subtotal === 0 || isFreeDelivery) ? 0 : 14;
  const discount = promotion.state === "applied" ? promotion.discountUsd : 0;
  const baseTotalCents = Math.round((subtotal + deliveryFee - discount) * 100);
  const { feeUsd: processingFee, finalTotalUsd: total } = calculateProcessingFee(baseTotalCents);

  const deliveryNoteEl = document.getElementById("cart-delivery-note");
  if (deliveryNoteEl) {
    if (subtotal === 0) {
      deliveryNoteEl.textContent = "Free delivery on $100+ or $40+ with Kingsbite";
    } else if (isFreeDelivery) {
      deliveryNoteEl.textContent = kingsbiteOffer.isEligible ? "Kingsbite free delivery applied" : "Complimentary delivery applied";
    } else {
      deliveryNoteEl.textContent = "+$14 delivery fee";
    }
  }

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`;
  if (processingFeeEl) processingFeeEl.textContent = `$${processingFee.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  const promoInput = document.getElementById("cart-promo-code");
  if (promoInput && document.activeElement !== promoInput) promoInput.value = getPromotionCode();
  const promoRemoveBtn = document.getElementById("btn-cart-promo-remove");
  if (promoRemoveBtn) {
    promoRemoveBtn.style.display = (promotion.state === "applied" || Boolean(getPromotionCode())) ? "inline-flex" : "none";
  }
  const promoStatus = document.getElementById("cart-promo-status");
  if (promoStatus) {
    promoStatus.textContent = promotion.message || "Enter a code to see your eligible discount.";
    promoStatus.className = `promo-code-status ${promotion.state}`;
  }
  const discountLabel = document.getElementById("cart-discount-label");
  const discountValue = document.getElementById("cart-discount-val");
  const promoLabel = document.getElementById("cart-promo-label");
  const hasDiscount = discount > 0;
  if (discountLabel) discountLabel.hidden = !hasDiscount;
  if (discountValue) {
    discountValue.hidden = !hasDiscount;
    discountValue.textContent = hasDiscount ? `−$${discount.toFixed(2)}` : "";
  }
  if (promoLabel) promoLabel.textContent = hasDiscount ? `(${promotion.code})` : "";

  // 6. Update International Estimates (Sleek Inline Strip)
  const intlEstimatesEl = document.getElementById("cart-intl-estimates");
  if (intlEstimatesEl) {
    const estimates = getInternationalEstimates(total);
    intlEstimatesEl.innerHTML = `
      <span class="cart-intl-prefix">Est:</span>
      <div class="cart-intl-strip-items">
        ${estimates.map(est => `
          <span class="cart-intl-item">
            <span class="cart-intl-code">${est.code}</span>
            <span class="cart-intl-val">${est.formatted}</span>
          </span>
        `).join('<span class="cart-intl-sep">•</span>')}
      </div>
    `;
  }

  // 7. Render Boutique Gift Add-Ons as Compact Horizontal Chips
  const addonsContainer = document.getElementById("cart-addons-container");
  if (addonsContainer) {
    if (cartItems.length > 0 && GIFT_ADDONS && GIFT_ADDONS.length > 0) {
      addonsContainer.style.display = "block";
      addonsContainer.innerHTML = `
        <div class="cart-addons-header">
          <span>Add a Little Extra</span>
        </div>
        <div class="cart-addons-row">
          ${GIFT_ADDONS.map(addon => {
            const inCart = cartItems.find(i => i.slug === addon.slug);
            const shortName = addon.name
              .replace("Artisanal ", "")
              .replace("Botanical ", "")
              .replace("Belgian ", "")
              .replace(" Collection", "")
              .replace(" Ritual", "")
              .replace("Floral ", "")
              .split("(")[0].trim();
            return `
              <div class="cart-addon-chip">
                <div class="cart-addon-thumb">
                  <img src="${addon.images.primary}" alt="${addon.name}" loading="lazy" />
                </div>
                <div class="cart-addon-info">
                  <span class="cart-addon-title">${shortName}</span>
                  <span class="cart-addon-price">$${addon.sizes[0].price}</span>
                </div>
                <button type="button" class="btn-quick-addon" data-slug="${addon.slug}">
                  ${inCart ? "✓" : "+ Add"}
                </button>
              </div>
            `;
          }).join("")}
        </div>
      `;
    } else {
      addonsContainer.style.display = "none";
    }
  }
}
