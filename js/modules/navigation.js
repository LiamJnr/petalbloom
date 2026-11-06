/**
 * Navigation & Header Interaction Module
 */

export function initNavigation({ 
  onNavigateHome, 
  onNavigateShop, 
  onNavigateFAQ,
  onNavigateContact,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateShipping,
  onSearchChange, 
  onOpenCart, 
  onOpenWishlist 
}) {
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const searchToggleBtn = document.querySelector(".search-toggle-btn");
  const searchWrapper = document.querySelector(".search-input-wrapper");
  const searchInput = document.querySelector(".search-input");
  const searchClearBtn = document.querySelector(".search-clear-btn");
  const cartTrigger = document.querySelector(".cart-trigger");
  const wishlistTrigger = document.getElementById("wishlist-trigger");

  // Dynamically sync --announcement-height with the real announcement bar size
  const announcementBar = document.querySelector(".announcement-bar");
  function syncAnnouncementHeight() {
    const h = announcementBar ? announcementBar.offsetHeight : 0;
    document.documentElement.style.setProperty("--announcement-height", h + "px");
  }
  syncAnnouncementHeight();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncAnnouncementHeight, 100);
  }, { passive: true });

  // Sticky header on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  }, { passive: true });

  // Mobile menu toggle
  menuToggle?.addEventListener("click", () => {
    const isOpen = navLinks?.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close mobile menu on clicking any link
  navLinks?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle?.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  // Header and breadcrumb links
  document.querySelectorAll("#nav-home-link, .btn-breadcrumb-home").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof onNavigateHome === "function") {
        onNavigateHome();
      }
    });
  });

  // FAQ navigation links
  document.querySelectorAll("#nav-faq-link, .footer-faq-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.dataset.tab || "care";
      if (typeof onNavigateFAQ === "function") {
        onNavigateFAQ(tab);
      }
    });
  });

  // Contact navigation links
  document.querySelectorAll("#nav-contact-link, .footer-contact-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof onNavigateContact === "function") {
        onNavigateContact();
      }
    });
  });

  // Policy footer links
  document.querySelectorAll(".footer-privacy-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof onNavigatePrivacy === "function") {
        onNavigatePrivacy();
      }
    });
  });

  document.querySelectorAll(".footer-terms-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof onNavigateTerms === "function") {
        onNavigateTerms();
      }
    });
  });

  document.querySelectorAll(".footer-shipping-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof onNavigateShipping === "function") {
        onNavigateShipping();
      }
    });
  });

  // Shop links in header and breadcrumbs
  document.querySelectorAll("#nav-shop-link, #btn-header-go-shop, .btn-hero-explore-shop, #shop-breadcrumb-home, #announcement-shop-link").forEach(link => {
    link.addEventListener("click", (e) => {
      if (link.id === "shop-breadcrumb-home") {
        e.preventDefault();
        if (typeof onNavigateHome === "function") {
          onNavigateHome();
        }
        return;
      }

      if (link.id === "nav-shop-link" || link.id === "announcement-shop-link" || link.classList.contains("btn-explore-full-shop") || link.classList.contains("btn-hero-explore-shop") || link.id === "btn-header-go-shop") {
        e.preventDefault();
        const category = link.dataset.category || "";
        if (typeof onNavigateShop === "function") {
          onNavigateShop(category ? { category } : {});
        }
      }
    });
  });

  // Footer shop category links
  document.querySelectorAll(".footer-shop-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = link.dataset.category || "";
      if (typeof onNavigateShop === "function") {
        onNavigateShop({ category });
      }
    });
  });

  // Search Bar Expand / Collapse
  searchToggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = searchWrapper?.classList.toggle("open");
    if (isOpen) {
      searchInput?.focus();
    }
  });

  // Close search when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchWrapper?.contains(e.target) && !searchToggleBtn?.contains(e.target)) {
      searchWrapper?.classList.remove("open");
    }
  });

  // Search input change handler with debounce
  let debounceTimer;
  searchInput?.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (searchClearBtn) {
      searchClearBtn.classList.toggle("visible", query.length > 0);
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (typeof onSearchChange === "function") {
        onSearchChange(query);
      }
    }, 200);
  });

  // Search clear button
  searchClearBtn?.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
      searchClearBtn.classList.remove("visible");
      if (typeof onSearchChange === "function") {
        onSearchChange("");
      }
      searchInput.focus();
    }
  });

  // Cart trigger click
  cartTrigger?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof onOpenCart === "function") {
      onOpenCart();
    }
  });

  // Wishlist trigger click
  wishlistTrigger?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof onOpenWishlist === "function") {
      onOpenWishlist();
    }
  });

  // Dynamic copyright year
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Update active navigation link in header
 */
export function setActiveNav(viewName) {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (viewName === "home") {
    document.getElementById("nav-home-link")?.classList.add("active");
  } else if (viewName === "shop") {
    document.getElementById("nav-shop-link")?.classList.add("active");
  } else if (viewName === "faq") {
    document.getElementById("nav-faq-link")?.classList.add("active");
  } else if (viewName === "contact") {
    document.getElementById("nav-contact-link")?.classList.add("active");
  }
}

