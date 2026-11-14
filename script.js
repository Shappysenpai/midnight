// Conditionally load popover polyfill only when native support is missing
if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
  import("https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js");
}

/* ==========================================================================
   Responsive Site Navigation (navbar guide)
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector(".site-header");
  const inner = document.querySelector(".header-inner");
  const siteMenu = document.getElementById("site-menu");
  const dropdownItem = document.querySelector(".nav-dropdown");
  const dropdownTrigger = document.querySelector(".dropdown-trigger");
  const dropdownList = document.getElementById("more-menu");

  if (!header || !inner || !siteMenu || !dropdownItem || !dropdownTrigger || !dropdownList) {
    return;
  }

  let isWide = false;
  let lastHeaderWidth = 0;
  let hoverPreview = false;

  const supportsAnchorPositioning =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("position-area", "block-end");

  function positionDropdownFallback() {
    if (supportsAnchorPositioning || !isWide) return;
    const triggerRect = dropdownTrigger.getBoundingClientRect();
    const menuRect = dropdownList.getBoundingClientRect();
    let top = triggerRect.bottom + 10;
    if (top + menuRect.height > window.innerHeight) {
      top = Math.max(8, triggerRect.top - menuRect.height - 10);
    }
    const left = Math.min(
      Math.max(8, triggerRect.left),
      Math.max(8, window.innerWidth - menuRect.width - 8)
    );
    dropdownList.style.top = `${top}px`;
    dropdownList.style.left = `${left}px`;
  }

  function syncNavLayout() {
    const wasMenuOpen = !isWide && siteMenu.matches(":popover-open, .\\:popover-open");
    header.classList.add("is-measuring");
    header.classList.add("is-wide");
    dropdownList.removeAttribute("popover");
    dropdownList.hidden = true;

    const fitsInline = inner.scrollWidth <= inner.clientWidth;
    isWide = fitsInline;

    header.classList.toggle("is-wide", isWide);

    if (isWide) {
      siteMenu.removeAttribute("popover");
      dropdownList.setAttribute("popover", "auto");
      dropdownList.hidden = false;
    } else {
      siteMenu.setAttribute("popover", "auto");
      dropdownList.removeAttribute("popover");
      dropdownList.hidden = true;
      if (wasMenuOpen && typeof siteMenu.showPopover === "function") {
        try {
          siteMenu.showPopover();
        } catch {
          // Ignore if already open
        }
      }
    }

    dropdownTrigger.setAttribute("aria-expanded", "false");
    hoverPreview = false;

    requestAnimationFrame(() => {
      header.classList.remove("is-measuring");
    });
  }

  const ro = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect?.width ?? header.clientWidth;
    if (isWide || width > lastHeaderWidth) {
      syncNavLayout();
    }
    lastHeaderWidth = width;
  });

  ro.observe(header);
  ro.observe(siteMenu);
  syncNavLayout();

  // Narrow layout disclosure click handler
  dropdownTrigger.addEventListener("click", (event) => {
    if (!isWide) {
      const expanded = dropdownTrigger.getAttribute("aria-expanded") === "true";
      dropdownTrigger.setAttribute("aria-expanded", String(!expanded));
      dropdownList.hidden = expanded;
      return;
    }

    if (hoverPreview) {
      hoverPreview = false;
      event.preventDefault();
    }
  });

  // Wide layout popover toggle state sync + anchor fallback positioning
  dropdownList.addEventListener("toggle", (event) => {
    if (!isWide) return;
    const isOpen = event.newState === "open";
    dropdownTrigger.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      positionDropdownFallback();
    } else {
      hoverPreview = false;
    }
  });

  // Hover preview for wide layout on hover-capable devices
  dropdownItem.addEventListener("pointerenter", (event) => {
    if (!isWide || event.pointerType === "touch") return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (typeof dropdownList.showPopover === "function" && !dropdownList.matches(":popover-open, .\\:popover-open")) {
      try {
        hoverPreview = true;
        dropdownList.showPopover({ source: dropdownTrigger });
      } catch {
        hoverPreview = false;
      }
    }
  });

  dropdownItem.addEventListener("pointerleave", (event) => {
    if (!isWide || event.pointerType === "touch") return;
    if (hoverPreview && typeof dropdownList.hidePopover === "function") {
      hoverPreview = false;
      try {
        dropdownList.hidePopover();
      } catch {
        // Ignore if already closed
      }
    }
  });

  dropdownItem.addEventListener("focusout", (event) => {
    if (!isWide) return;
    if (event.relatedTarget && !dropdownItem.contains(event.relatedTarget)) {
      if (typeof dropdownList.hidePopover === "function" && dropdownList.matches(":popover-open, .\\:popover-open")) {
        try {
          dropdownList.hidePopover();
        } catch {
          // Ignore
        }
      }
    }
  });

  // Close mobile popover when clicking an in-page link
  siteMenu.addEventListener("click", (event) => {
    if (isWide) return;
    const link = event.target.closest("a");
    if (link && typeof siteMenu.hidePopover === "function") {
      try {
        siteMenu.hidePopover();
      } catch {
        // Ignore
      }
    }
  });
}

/* ==========================================================================
   Hero Carousel
   ========================================================================== */
function initHeroCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
  const dots = Array.from(carousel.querySelectorAll(".hero-dot"));
  const prevBtn = carousel.querySelector(".swiper-hero-prev");
  const nextBtn = carousel.querySelector(".swiper-hero-next");

  let activeIndex = 0;

  function goToSlide(index) {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    activeIndex = clamped;

    slides.forEach((slide, i) => {
      const active = i === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", String(active));
    });

    if (prevBtn) prevBtn.disabled = activeIndex === 0;
    if (nextBtn) nextBtn.disabled = activeIndex === slides.length - 1;
  }

  prevBtn?.addEventListener("click", () => goToSlide(activeIndex - 1));
  nextBtn?.addEventListener("click", () => goToSlide(activeIndex + 1));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = Number(dot.dataset.slideTo ?? 0);
      goToSlide(target);
    });
  });

  // Jump to Redeem slide if user clicks the #hero-redeem nav link
  document.querySelectorAll('a[href="#hero-redeem"]').forEach((link) => {
    link.addEventListener("click", () => goToSlide(2));
  });

  goToSlide(0);
}

/* ==========================================================================
   Timeline Accordion
   ========================================================================== */
function initTimelineAccordion() {
  const triggers = document.querySelectorAll(".timeline-trigger");
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panelId = trigger.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      const item = trigger.closest(".timeline-item");
      const plus = trigger.querySelector(".timeline-plus");
      if (!panel) return;

      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isExpanded));
      panel.hidden = isExpanded;
      item?.classList.toggle("is-open", !isExpanded);
      if (plus) plus.textContent = isExpanded ? "+" : "−";
    });
  });
}

/* ==========================================================================
   Newsletter Form & Policy ID Copy
   ========================================================================== */
function initFooterInteractions() {
  const form = document.getElementById("newsletter-form");
  const emailInput = document.getElementById("newsletter-email");
  const consentInput = document.getElementById("newsletter-consent");
  const statusEl = document.getElementById("newsletter-status");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!emailInput || !consentInput || !statusEl) return;

    if (!emailInput.checkValidity()) {
      statusEl.textContent = "Please enter a valid email address.";
      emailInput.focus();
      return;
    }

    if (!consentInput.checked) {
      statusEl.textContent = "Please agree to the Privacy Policy to subscribe.";
      consentInput.focus();
      return;
    }

    statusEl.textContent = `Subscribed ${emailInput.value.trim()} for Midnight TGE updates.`;
    form.reset();
  });

  const copyBtn = document.getElementById("copy-policy-btn");
  const copyBadge = document.getElementById("copy-badge");

  copyBtn?.addEventListener("click", async () => {
    const policyId = copyBtn.dataset.policyId;
    if (!policyId) return;

    try {
      await navigator.clipboard.writeText(policyId);
      if (copyBadge) {
        copyBadge.textContent = "Copied!";
        setTimeout(() => {
          copyBadge.textContent = "Copy";
        }, 2000);
      }
    } catch {
      if (copyBadge) {
        copyBadge.textContent = "Select to copy";
      }
    }
  });
}

initNavbar();
initHeroCarousel();
initTimelineAccordion();
initFooterInteractions();
