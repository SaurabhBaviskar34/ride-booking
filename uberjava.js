/* =========================================================
   SWYFT — LANDING PAGE INTERACTIVITY
   Vanilla JS only — no dependencies
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     Ride type pricing model
     base fare + per-km rate, used by both the booking form
     and the pricing estimator slider
  --------------------------------------------------------*/
  const RIDE_TYPES = [
    { id: 'uberx', name: 'UberX', eta: '3 min away', base: 40, perKm: 12 },
    { id: 'comfort', name: 'Comfort', eta: '5 min away', base: 55, perKm: 16 },
    { id: 'black', name: 'Black', eta: '7 min away', base: 90, perKm: 28 },
    { id: 'xl', name: 'XL', eta: '6 min away', base: 65, perKm: 20 },
  ];

  /** Calculate a fare given distance in km */
  function calcFare(distanceKm, ride) {
    const fare = ride.base + distanceKm * ride.perKm;
    return Math.round(fare);
  }

  function formatINR(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  }

  /* -------------------------------------------------------
     Sticky navbar shadow on scroll
  --------------------------------------------------------*/
  const navbar = document.getElementById('navbar');
  function handleNavbarScroll() {
    if (window.scrollY > 8) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* -------------------------------------------------------
     Mobile navigation toggle
  --------------------------------------------------------*/
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('is-open');
      navToggle.classList.remove('is-active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* -------------------------------------------------------
     Smooth scrolling for in-page anchor links
  --------------------------------------------------------*/
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length <= 1) return; // ignore bare "#"
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight + 1;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* -------------------------------------------------------
     Booking form validation + fare calculator
  --------------------------------------------------------*/
  const bookingForm = document.getElementById('bookingForm');
  const fareResult = document.getElementById('fareResult');
  const fareList = document.getElementById('fareList');

  const fields = {
    pickup: { input: document.getElementById('pickup'), error: document.getElementById('pickupError') },
    destination: { input: document.getElementById('destination'), error: document.getElementById('destinationError') },
    distance: { input: document.getElementById('distance'), error: document.getElementById('distanceError') },
  };

  function setFieldError(fieldKey, message) {
    const { input, error } = fields[fieldKey];
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      error.textContent = message;
    } else {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      error.textContent = '';
    }
  }

  function validateBookingForm() {
    let isValid = true;

    const pickupVal = fields.pickup.input.value.trim();
    if (pickupVal.length < 3) {
      setFieldError('pickup', 'Enter a valid pickup location.');
      isValid = false;
    } else {
      setFieldError('pickup', '');
    }

    const destinationVal = fields.destination.input.value.trim();
    if (destinationVal.length < 3) {
      setFieldError('destination', 'Enter a valid destination.');
      isValid = false;
    } else if (destinationVal.toLowerCase() === pickupVal.toLowerCase()) {
      setFieldError('destination', 'Destination must differ from pickup.');
      isValid = false;
    } else {
      setFieldError('destination', '');
    }

    const distanceVal = parseFloat(fields.distance.input.value);
    if (isNaN(distanceVal) || distanceVal <= 0) {
      setFieldError('distance', 'Enter a distance greater than 0.');
      isValid = false;
    } else if (distanceVal > 500) {
      setFieldError('distance', 'Distance seems too large. Max 500 km.');
      isValid = false;
    } else {
      setFieldError('distance', '');
    }

    return isValid;
  }

  function renderFares(distanceKm) {
    fareList.innerHTML = '';
    RIDE_TYPES.forEach(function (ride) {
      const fare = calcFare(distanceKm, ride);
      const li = document.createElement('li');
      li.innerHTML =
        '<span>' + ride.name + ' <small style="opacity:.6">&middot; ' + ride.eta + '</small></span>' +
        '<strong>' + formatINR(fare) + '</strong>';
      fareList.appendChild(li);
    });
    fareResult.hidden = false;
  }

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateBookingForm()) {
      fareResult.hidden = true;
      return;
    }
    const distanceKm = parseFloat(fields.distance.input.value);
    renderFares(distanceKm);
  });

  // Live-clear errors as the user types
  Object.keys(fields).forEach(function (key) {
    fields[key].input.addEventListener('input', function () {
      if (fields[key].input.classList.contains('is-invalid')) {
        setFieldError(key, '');
      }
    });
  });

  /* -------------------------------------------------------
     Pricing estimator slider
  --------------------------------------------------------*/
  const distanceSlider = document.getElementById('distanceSlider');
  const sliderValue = document.getElementById('sliderValue');
  const pricingCards = document.getElementById('pricingCards');

  function renderPricingCards(distanceKm) {
    pricingCards.innerHTML = '';
    RIDE_TYPES.forEach(function (ride) {
      const fare = calcFare(distanceKm, ride);
      const card = document.createElement('div');
      card.className = 'price-card';
      card.innerHTML =
        '<p class="price-card__name">' + ride.name + '</p>' +
        '<p class="price-card__eta">' + ride.eta + '</p>' +
        '<p class="price-card__price">' + formatINR(fare) + '</p>';
      pricingCards.appendChild(card);
    });
  }

  distanceSlider.addEventListener('input', function () {
    const val = distanceSlider.value;
    sliderValue.textContent = val;
    renderPricingCards(parseFloat(val));
  });

  // Initial render
  renderPricingCards(parseFloat(distanceSlider.value));

  /* -------------------------------------------------------
     FAQ accordion
  --------------------------------------------------------*/
  const accordionItems = document.querySelectorAll('.accordion__item');

  accordionItems.forEach(function (item) {
    const trigger = item.querySelector('.accordion__trigger');
    const panel = item.querySelector('.accordion__panel');

    trigger.addEventListener('click', function () {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close all other panels (single-open accordion)
      accordionItems.forEach(function (otherItem) {
        if (otherItem === item) return;
        otherItem.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
        otherItem.querySelector('.accordion__panel').style.maxHeight = null;
      });

      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
    });
  });

  /* -------------------------------------------------------
     Animated statistic counters (triggered on first view)
  --------------------------------------------------------*/
  const statNumbers = document.querySelectorAll('.stat__number');

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    const duration = 1400;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toFixed(decimals) + suffix;
      }
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(function (el) { counterObserver.observe(el); });

  /* -------------------------------------------------------
     Scroll-reveal animations for sections
  --------------------------------------------------------*/
  const revealTargets = document.querySelectorAll(
    '.service-card, .step, .price-card, .testimonial-card, .drive__card-stat'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  /* -------------------------------------------------------
     Footer year
  --------------------------------------------------------*/
  document.getElementById('year').textContent = new Date().getFullYear();

})();