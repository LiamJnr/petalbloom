/**
 * West Africa Expansion & HandyPay Partnership Announcement Modal Module
 * Triggers after 5.5 seconds on first session visit with dark overlay.
 */

const STORAGE_KEY = "petal_bloom_expansion_seen";
const DISPLAY_DELAY_MS = 5500; // 5.5 seconds

export function initAnnouncementModal({ onExploreShop } = {}) {
  const modal = document.getElementById("announcement-modal");
  if (!modal) return;

  const closeBtn = document.getElementById("announcement-modal-close");
  const dismissBtn = document.getElementById("announcement-modal-dismiss");
  const exploreBtn = document.getElementById("announcement-modal-explore");

  // Check if user already saw/dismissed the announcement this session
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }
  } catch {
    // If storage is blocked, continue gracefully
  }

  // Open after 5.5 seconds
  const timer = setTimeout(() => {
    openModal(modal);
  }, DISPLAY_DELAY_MS);

  // Close helper
  const handleClose = () => {
    closeModal(modal);
    markSeen();
  };

  closeBtn?.addEventListener("click", handleClose);
  dismissBtn?.addEventListener("click", handleClose);

  // Backdrop click (only if clicking the backdrop directly, not dialog)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      handleClose();
    }
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      handleClose();
    }
  });

  // Explore Shop CTA
  exploreBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    handleClose();
    if (typeof onExploreShop === "function") {
      onExploreShop();
    }
  });
}

function openModal(modal) {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  if (document.activeElement && modal && modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Graceful fallback
  }
}
