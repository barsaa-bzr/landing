const header = document.querySelector(".site-header");
const tiltTarget = document.querySelector("[data-tilt]");
const waitlistForm = document.querySelector("#waitlist-form");
const formNote = document.querySelector(".form-note");

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

if (tiltTarget) {
  window.addEventListener(
    "pointermove",
    (event) => {
      if (window.matchMedia("(max-width: 980px)").matches) return;

      const rect = tiltTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((event.clientY - centerY) / rect.height) * -4;
      const rotateY = ((event.clientX - centerX) / rect.width) * 5;

      tiltTarget.style.transform = `rotate(-8deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    },
    { passive: true },
  );

  window.addEventListener("pointerleave", () => {
    tiltTarget.style.transform = "rotate(-8deg)";
  });
}

waitlistForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(waitlistForm);
  const email = formData.get("email");
  const interest = formData.get("interest");

  formNote.textContent = `${email} is on the early access list for ${interest}.`;
  waitlistForm.reset();
});
