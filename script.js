(function () {
  "use strict";
  // Configuration constants
  const SCROLL_OFFSET = 36; // Offset for fixed header when scrolling to sections
  const INTERSECTION_ROOT_MARGIN = '-50% 0px -50% 0px'; // Margin for section intersection detection

  /**
   * Select DOM element(s) using a CSS selector
   * @param {string} el - CSS selector string
   * @param {boolean} [all=false] - If true, returns all matching elements; otherwise returns first match
   * @returns {Element|Element[]|null} Selected element(s) or null if not found
   */
  const select = (el, all = false) => {
    el = el.trim();
    return all
      ? [...document.querySelectorAll(el)]
      : document.querySelector(el);
  };

  /**
   * Add event listener(s) to element(s) selected by CSS selector
   * @param {string} type - Event type
   * @param {string} el - CSS selector string
   * @param {Function} listener - Event handler function
   * @param {boolean} [all=false] - If true, adds listener to all matching elements
   */
  const on = (type, el, listener, all = false) => {
    let els = select(el, all);
    if (!els) return;
    if (all) els.forEach((e) => e.addEventListener(type, listener));
    else els.addEventListener(type, listener);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================
  
  let navbarlinks = select(".nav .nav__link", true);

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navbarlinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
             link.classList.add('active');
          }
        });
      }
    });
  }, {
    rootMargin: INTERSECTION_ROOT_MARGIN
  });

  document.querySelectorAll('section').forEach(section => {
    navObserver.observe(section);
  });
  
  /**
   * Smooth scroll to element with fixed header offset
   * @param {string} el - CSS selector or hash of element to scroll to
   */
  const scrollto = (el) => {
    const element = select(el);
    if (!element) return;
    let offset = element.offsetTop - SCROLL_OFFSET;
    window.scrollTo({ top: offset, behavior: "smooth" });
  };

  on("click", ".mobile-nav-toggle", function () {
    document.body.classList.toggle("mobile-nav-active");
    this.classList.toggle("bx-list");
    this.classList.toggle("bx-x");
  });

  const portfolioGrid = select('.portfolio__grid');
  if (portfolioGrid) {
    portfolioGrid.addEventListener('touchstart', function(e) {
      const portfolioCard = e.target.closest('.portfolio__card');
      if (!portfolioCard) return;

      portfolioGrid.querySelectorAll('.portfolio__card').forEach(card => {
        card.classList.remove('mobile-active');
      });

      portfolioCard.classList.add('mobile-active');
    }, { passive: true });

    document.addEventListener('touchstart', function(e) {
      if (!e.target.closest('.portfolio__card')) {
        portfolioGrid.querySelectorAll('.portfolio__card').forEach(card => {
          card.classList.remove('mobile-active');
        });
      }
    }, { passive: true });
  }

  on(
    "click",
    ".nav__link",
    function (e) {
      if (select(this.hash)) {
        e.preventDefault();
        if (document.body.classList.contains("mobile-nav-active")) {
          document.body.classList.remove("mobile-nav-active");
          let btn = select(".mobile-nav-toggle");
          btn.classList.toggle("bx-list");
          btn.classList.toggle("bx-x");
        }
        scrollto(this.hash);
        this.blur();
      }
    },
    true
  );

  window.addEventListener("load", () => {
    if (window.location.hash && select(window.location.hash)) {
      scrollto(window.location.hash);
    }
  });

  // ==========================================
  // SCROLL ANIMATIONS
  // ==========================================

  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Handle delay if specified
        const delay = entry.target.dataset.animateDelay;
        if (delay) {
          setTimeout(() => {
            entry.target.classList.add('animate-visible');
          }, parseInt(delay, 10));
        } else {
          entry.target.classList.add('animate-visible');
        }
        // Stop observing once animated
        animateObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('[data-animate]').forEach(el => {
    animateObserver.observe(el);
  });

  // ==========================================
  // PORTFOLIO FILTER
  // ==========================================

  window.addEventListener("load", () => {
    let container = select(".portfolio__grid");
    if (container && typeof Isotope !== "undefined") {
      requestAnimationFrame(() => {
        let iso = new Isotope(container, { itemSelector: ".portfolio__item" });
        let filters = select(".portfolio__filters li", true);
        on(
          "click",
          ".portfolio__filters li",
          function (e) {
            e.preventDefault();
            filters.forEach((el) => el.classList.remove("filter-active"));
            this.classList.add("filter-active");
            iso.arrange({ filter: this.getAttribute("data-filter") });
          },
          true
        );
      });
    }
  });

  // ==========================================
  // GLIGHTBOX
  // ==========================================

  if (typeof GLightbox !== "undefined") {
    const lightbox = GLightbox({ selector: ".portfolio__lightbox" });

    lightbox.on("slide_changed", ({ current }) => {
      const slides = lightbox.slidesContainer.querySelectorAll(".gslide");
      slides.forEach((slide) => slide.querySelector("video")?.pause());
      slides[current.index]?.querySelector("video")?.play().catch(() => {});
    });

    lightbox.on("close", () => {
      document.querySelectorAll("video").forEach((v) => v.pause());
    });
  }
})();
