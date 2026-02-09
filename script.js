(function () {
  "use strict";
  // Configuration constants
  const SCROLL_OFFSET = 36; // Offset for fixed header when scrolling to sections
  const INTERSECTION_ROOT_MARGIN = '-50% 0px -50% 0px'; // Margin for section intersection detection
  const MIN_VIEWPORT_WIDTH_FOR_VIDEO = 992; // Minimum viewport width for video display
  const DEBOUNCE_DELAY = 250; // Milliseconds to wait before executing debounced functions

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

  /**
   * Debounce function execution to limit how often it can be called
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds before function executes
   * @returns {Function} Debounced function
   */
  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
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

  const portfolioLightbox = typeof GLightbox !== "undefined"
    ? GLightbox({ selector: ".portfolio__lightbox" })
    : null;

  // ==========================================
  // VIDEO LAZY LOADING
  // ==========================================

  /**
   * Lazy load video sources for videos with data-src attribute
   * Only loads videos on desktop viewports (min-width: 992px)
   * Prevents re-injection if source already exists
   */
  function injectVideoSources() {
    if (!window.matchMedia(`(min-width: ${MIN_VIEWPORT_WIDTH_FOR_VIDEO}px)`).matches) return;
    document.querySelectorAll("video[data-src]").forEach((video) => {
      // Skip if already injected
      if (video.querySelector("source")) return;

      const url = video.getAttribute("data-src");
      if (!url) return;

      // Create and append <source> element
      const src = document.createElement("source");
      src.src = url;
      src.type = "video/mp4";
      video.appendChild(src);

      video.autoplay = true;
      video.muted = true;
      video.loop = true;

      video.load();
      video.play().catch((err) => {
        console.warn("Video play was prevented:", err);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", injectVideoSources);
  window.addEventListener("resize", debounce(injectVideoSources, DEBOUNCE_DELAY));

  // Inject video sources when lightbox opens
  if (portfolioLightbox && typeof portfolioLightbox.on === "function") {
    portfolioLightbox.on("open", injectVideoSources);
    portfolioLightbox.on("slide_changed", injectVideoSources);
  }
})();
