const header = document.querySelector(".site-header");
const tiltTarget = document.querySelector("[data-tilt]");
const waitlistForm = document.querySelector("#waitlist-form");
const formNote = document.querySelector(".form-note");
const themeToggle = document.querySelector(".theme-toggle");
const root = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

let scrollTicking = false;

const getSavedTheme = () => {
  try {
    return localStorage.getItem("bzr-theme");
  } catch {
    return null;
  }
};

const setTheme = (theme, shouldPersist = true) => {
  const nextTheme = theme === "dark" ? "dark" : "light";

  root.dataset.theme = nextTheme;
  themeToggle?.setAttribute("aria-pressed", String(nextTheme === "dark"));
  themeToggle?.setAttribute(
    "aria-label",
    nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
  );

  if (!shouldPersist) return;

  try {
    localStorage.setItem("bzr-theme", nextTheme);
  } catch {
    // Theme persistence is optional.
  }
};

setTheme(root.dataset.theme || (prefersDarkScheme.matches ? "dark" : "light"), false);

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

prefersDarkScheme.addEventListener?.("change", (event) => {
  if (getSavedTheme()) return;
  setTheme(event.matches ? "dark" : "light", false);
});

const syncScrollState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
  root.style.setProperty("--scroll-shift", `${Math.max(window.scrollY * -0.025, -80)}px`);
  scrollTicking = false;
};

const requestScrollSync = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(syncScrollState);
};

window.addEventListener("scroll", requestScrollSync, { passive: true });
syncScrollState();

const registerRevealAnimations = () => {
  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) return;

  const shouldScrollRevealSignalStrip = window.matchMedia("(max-width: 980px)").matches;
  const groups = [
    ...(shouldScrollRevealSignalStrip
      ? [{ selector: ".signal-strip > div", variant: "reveal-zoom", start: 80, step: 90 }]
      : []),
    { selector: ".section-heading > *", variant: "reveal-left", start: 0, step: 80 },
    { selector: ".product-card", variant: "reveal-zoom", start: 120, step: 110 },
    { selector: ".model-orbit", variant: "reveal-zoom", start: 80, step: 0 },
    { selector: ".intelligence-copy", variant: "reveal-right", start: 180, step: 0 },
    { selector: ".check-list span", variant: "reveal-left", start: 320, step: 70 },
    { selector: ".platform-grid article", variant: "reveal-zoom", start: 80, step: 85 },
    { selector: ".waitlist > div > *", variant: "reveal-left", start: 0, step: 80 },
    { selector: ".waitlist-form", variant: "reveal-right", start: 160, step: 0 },
    { selector: ".waitlist-form > *", variant: "reveal-zoom", start: 300, step: 65 },
    { selector: ".site-footer > *", variant: "reveal-zoom", start: 0, step: 90 },
  ];

  const revealItems = new Set();

  groups.forEach(({ selector, variant, start, step }) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (revealItems.has(element)) return;

      revealItems.add(element);
      element.classList.add("reveal", variant);
      element.style.setProperty("--reveal-delay", `${start + index * step}ms`);
    });
  });

  if (!revealItems.size) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12,
    },
  );

  document.body.classList.add("reveal-ready");

  const releaseRevealItems = () => {
    revealItems.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const isAlreadyVisible = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;

      if (isAlreadyVisible) {
        element.classList.add("is-visible");
      } else {
        observer.observe(element);
      }
    });
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(releaseRevealItems, 120);
    });
  });
};

registerRevealAnimations();

const registerScoreCounters = () => {
  const counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length) return;

  const setFinalValues = () => {
    counters.forEach((counter) => {
      counter.textContent = counter.dataset.countTo;
    });
  };

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    setFinalValues();
    return;
  }

  const animateCounter = (counter) => {
    const target = Number(counter.dataset.countTo);
    if (!Number.isFinite(target)) return;

    const start = Math.max(0, target - 86);
    const duration = 1650;
    const startedAt = performance.now();
    const core = counter.closest(".model-core");

    counter.textContent = String(start);
    core?.classList.add("is-counting");

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);

      counter.textContent = String(value);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        counter.textContent = String(target);
        window.setTimeout(() => core?.classList.remove("is-counting"), 320);
      }
    };

    window.requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -15% 0px",
      threshold: 0.45,
    },
  );

  counters.forEach((counter) => counterObserver.observe(counter));
};

registerScoreCounters();

if (tiltTarget) {
  const heroVisual = tiltTarget.closest(".hero-visual");
  const floatingCards = document.querySelectorAll(".floating-card");
  const isMobile = () => window.matchMedia("(max-width: 980px)").matches;

  heroVisual?.addEventListener(
    "pointermove",
    (event) => {
      if (isMobile() || prefersReducedMotion.matches) return;

      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      const rotateX = y * -12;
      const rotateY = x * 16;

      tiltTarget.style.transition = "transform 80ms ease-out, box-shadow 80ms ease";
      tiltTarget.style.transform = `rotate(-8deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.97)`;

      floatingCards.forEach((card) => {
        card.style.setProperty("--card-tx", `${x * -14}px`);
        card.style.setProperty("--card-ty", `${y * -10}px`);
      });
    },
    { passive: true },
  );

  heroVisual?.addEventListener("pointerleave", () => {
    tiltTarget.style.transition = "";
    tiltTarget.style.transform = "rotate(-8deg)";
    floatingCards.forEach((card) => {
      card.style.removeProperty("--card-tx");
      card.style.removeProperty("--card-ty");
    });
  });
}

waitlistForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(waitlistForm);
  const email = formData.get("email");
  const interest = formData.get("interest");

  if (formNote) {
    formNote.textContent = `${email} is on the early access list for ${interest}.`;
  }

  waitlistForm.reset();
});
