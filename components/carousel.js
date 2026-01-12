// ============================================
// Photo Carousel Component - Multi Image View
// Shows 1/2/3 images per slide based on width
// ============================================

(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const indicators = document.getElementById('carouselIndicators');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  
  if (!track || !indicators) return;

  // Photo list - removed the problematic image (Screenshot 2026-01-03 001459.png shows no couple)
  const photos = [
    { src: 'photos/prenup1.png', alt: 'Josh and Joy prenup photo' },
    { src: 'photos/Screenshot 2026-01-03 001436.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001542.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001634.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001459.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001715.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001732.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001744.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001808.png', alt: 'Josh and Joy photo' },
    { src: 'photos/Screenshot 2026-01-03 001833.png', alt: 'Josh and Joy photo' }
  ];

  let currentIndex = 0; // slide index
  let autoplayInterval;
  let itemsPerSlide = 3;
  let slides = []; // array of arrays (grouped photos)

  function computeItemsPerSlide() {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 900) return 2;
    return 3;
  }

  function chunk(array, size) {
    const out = [];
    for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
    return out;
  }

  // Create slides (groups of images)
  function createSlides() {
    itemsPerSlide = computeItemsPerSlide();
    slides = chunk(photos, itemsPerSlide);
    track.innerHTML = '';
    slides.forEach(group => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      const inner = document.createElement('div');
      inner.className = 'carousel-slide-inner';
      group.forEach(photo => {
        const cell = document.createElement('div');
        cell.className = 'photo-cell';
        cell.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" loading="lazy" />`;
        inner.appendChild(cell);
      });
      slide.appendChild(inner);
      track.appendChild(slide);
    });
  }

  // Create indicators (per slide)
  function createIndicators() {
    indicators.innerHTML = '';
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'carousel-indicator' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.addEventListener('click', () => goToSlide(i));
      indicators.appendChild(btn);
    });
  }

  // Update slide position
  function updateSlidePosition() {
    const offset = currentIndex * 100;
    track.style.transform = `translateX(-${offset}%)`;
    
    // Update indicators
    const indicatorBtns = indicators.querySelectorAll('.carousel-indicator');
    indicatorBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === currentIndex);
    });
  }

  // Go to specific slide
  function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, slides.length - 1));
    updateSlidePosition();
  }

  // Next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlidePosition();
  }

  // Previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlidePosition();
  }

  // Start autoplay
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, 4000);
  }

  // Stop autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  // Initialize
  function init() {
    createSlides();
    createIndicators();
    currentIndex = 0;
    updateSlidePosition();
    startAutoplay();
  }

  // Event listeners
  prevBtn?.addEventListener('click', () => {
    prevSlide();
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    nextSlide();
    startAutoplay();
  });

  // Pause autoplay on hover
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoplay();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (diff > swipeThreshold) {
      nextSlide();
    } else if (diff < -swipeThreshold) {
      prevSlide();
    }
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoplay();
    }
  });

  // Rebuild on resize to adjust items per slide
  window.addEventListener('resize', () => {
    const prevItems = itemsPerSlide;
    const nextItems = computeItemsPerSlide();
    if (prevItems !== nextItems) {
      const approxFirstItem = currentIndex * prevItems;
      createSlides();
      createIndicators();
      currentIndex = Math.floor(approxFirstItem / nextItems);
      updateSlidePosition();
    }
  });

  init();
})();
