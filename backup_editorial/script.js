const slideshow = document.querySelector("[data-slideshow]");

if (slideshow) {
  const slides = Array.from(slideshow.querySelectorAll("[data-slide]"));
  const dots = Array.from(slideshow.querySelectorAll("[data-dot]"));
  const prevButton = slideshow.querySelector("[data-prev]");
  const nextButton = slideshow.querySelector("[data-next]");
  let currentIndex = 0;
  let autoplayId = null;

  const renderSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });

    currentIndex = index;
  };

  const showNext = () => {
    renderSlide((currentIndex + 1) % slides.length);
  };

  const showPrev = () => {
    renderSlide((currentIndex - 1 + slides.length) % slides.length);
  };

  const restartAutoplay = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    window.clearInterval(autoplayId);
    autoplayId = window.setInterval(showNext, 2500);
  };

  prevButton?.addEventListener("click", () => {
    showPrev();
    restartAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    showNext();
    restartAutoplay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      renderSlide(index);
      restartAutoplay();
    });
  });

  slideshow.addEventListener("mouseenter", () => window.clearInterval(autoplayId));
  slideshow.addEventListener("mouseleave", restartAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      window.clearInterval(autoplayId);
    } else {
      restartAutoplay();
    }
  });

  let touchStartX = null;
  slideshow.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  slideshow.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX == null) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 56) return;
      if (dx < 0) showNext();
      else showPrev();
      restartAutoplay();
    },
    { passive: true }
  );

  restartAutoplay();
}
