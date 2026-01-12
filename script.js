// ============================================
// Josh & Joy Wedding - Main Script
// ============================================

// Copy to Clipboard Function
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    // Add copied state
    button.classList.add('copied');
    const textSpan = button.querySelector('.copy-text');
    const originalText = textSpan.textContent;
    textSpan.textContent = 'Copied!';
    
    // Reset after 2 seconds
    setTimeout(() => {
      button.classList.remove('copied');
      textSpan.textContent = originalText;
    }, 2000);
  }).catch(err => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      button.classList.add('copied');
      const textSpan = button.querySelector('.copy-text');
      const originalText = textSpan.textContent;
      textSpan.textContent = 'Copied!';
      
      setTimeout(() => {
        button.classList.remove('copied');
        textSpan.textContent = originalText;
      }, 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
    
    document.body.removeChild(textArea);
  });
}

// Copy Info (for inline copy icons)
function copyInfo(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    element.classList.add('copied');
    
    setTimeout(() => {
      element.classList.remove('copied');
    }, 1500);
  }).catch(err => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      element.classList.add('copied');
      
      setTimeout(() => {
        element.classList.remove('copied');
      }, 1500);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
    
    document.body.removeChild(textArea);
  });
}

// Photo Carousel
(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const indicators = document.getElementById('carouselIndicators');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  
  if (!track || !indicators) return;

  // Photo list from photos folder
  const photos = [
    { src: 'photos/prenup1.png', alt: 'Josh and Joy prenup photo 1' },
    { src: 'photos/Screenshot 2026-01-03 001436.png', alt: 'Josh and Joy photo 2' },
    { src: 'photos/Screenshot 2026-01-03 001459.png', alt: 'Josh and Joy photo 3' },
    { src: 'photos/Screenshot 2026-01-03 001542.png', alt: 'Josh and Joy photo 4' },
    { src: 'photos/Screenshot 2026-01-03 001634.png', alt: 'Josh and Joy photo 5' },
    { src: 'photos/Screenshot 2026-01-03 001459.png', alt: 'Josh and Joy photo 6' },
    { src: 'photos/Screenshot 2026-01-03 001715.png', alt: 'Josh and Joy photo 7' },
    { src: 'photos/Screenshot 2026-01-03 001732.png', alt: 'Josh and Joy photo 8' },
    { src: 'photos/Screenshot 2026-01-03 001744.png', alt: 'Josh and Joy photo 9' },
    { src: 'photos/Screenshot 2026-01-03 001808.png', alt: 'Josh and Joy photo 10' },
    { src: 'photos/Screenshot 2026-01-03 001833.png', alt: 'Josh and Joy photo 11' }
  ];

  let currentIndex = 0;
  let slidesPerView = 3;
  let autoplayInterval;

  // Determine slides per view based on screen width
  function updateSlidesPerView() {
    if (window.innerWidth <= 600) {
      slidesPerView = 1;
    } else if (window.innerWidth <= 900) {
      slidesPerView = 2;
    } else {
      slidesPerView = 3;
    }
  }

  // Create slides
  function createSlides() {
    track.innerHTML = '';
    photos.forEach((photo, i) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" loading="lazy" />`;
      track.appendChild(slide);
    });
  }

  // Create indicators
  function createIndicators() {
    indicators.innerHTML = '';
    const totalGroups = Math.ceil(photos.length / slidesPerView);
    
    for (let i = 0; i < totalGroups; i++) {
      const btn = document.createElement('button');
      btn.className = 'carousel-indicator' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Go to slide group ${i + 1}`);
      btn.addEventListener('click', () => goToSlide(i * slidesPerView));
      indicators.appendChild(btn);
    }
  }

  // Update slide position
  function updateSlidePosition() {
    const slideWidth = track.querySelector('.carousel-slide')?.offsetWidth || 0;
    const gap = 16;
    const offset = currentIndex * (slideWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    
    // Update indicators
    const indicatorBtns = indicators.querySelectorAll('.carousel-indicator');
    const activeGroup = Math.floor(currentIndex / slidesPerView);
    indicatorBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === activeGroup);
    });
  }

  // Go to specific slide
  function goToSlide(index) {
    const maxIndex = photos.length - slidesPerView;
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateSlidePosition();
  }

  // Next slide
  function nextSlide() {
    const maxIndex = photos.length - slidesPerView;
    if (currentIndex >= maxIndex) {
      currentIndex = 0;
    } else {
      currentIndex = Math.min(currentIndex + 1, maxIndex);
    }
    updateSlidePosition();
  }

  // Previous slide
  function prevSlide() {
    if (currentIndex <= 0) {
      currentIndex = photos.length - slidesPerView;
    } else {
      currentIndex = Math.max(currentIndex - 1, 0);
    }
    updateSlidePosition();
  }

  // Start autoplay
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  // Stop autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  // Initialize
  function init() {
    updateSlidesPerView();
    createSlides();
    createIndicators();
    updateSlidePosition();
    startAutoplay();
  }

  // Event listeners
  prevBtn?.addEventListener('click', () => {
    prevSlide();
    startAutoplay(); // Reset autoplay on manual interaction
  });

  nextBtn?.addEventListener('click', () => {
    nextSlide();
    startAutoplay();
  });

  // Pause autoplay on hover
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  // Touch support
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

  // Handle resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const prevSlidesPerView = slidesPerView;
      updateSlidesPerView();
      if (prevSlidesPerView !== slidesPerView) {
        createIndicators();
        goToSlide(0);
      }
      updateSlidePosition();
    }, 100);
  });

  init();
})();

// Music Widget Toggle
(function initMusicWidget() {
  const widget = document.getElementById('musicWidget');
  const toggle = document.getElementById('musicWidgetToggle');
  const body = document.getElementById('musicWidgetBody');
  
  if (!widget || !toggle) return;

  // Start collapsed
  widget.classList.add('collapsed');

  toggle.addEventListener('click', () => {
    widget.classList.toggle('collapsed');
  });

  // Add close button functionality
  const closeBtn = widget.querySelector('.music-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      widget.classList.add('hidden');
    });
  }
})();

// Entourage toggle
(function initEntourageToggle() {
  const content = document.getElementById('entourageContent');
  const toggleBtn = document.querySelector('.entourage-toggle');
  if (!content || !toggleBtn) return;

  const label = toggleBtn.querySelector('.toggle-label');
  const collapsedLabel = 'Meet the Entourage';
  const expandedLabel = 'Hide Entourage';

  function setState(expanded) {
    content.classList.toggle('is-expanded', expanded);
    content.classList.toggle('is-collapsed', !expanded);
    content.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (label) {
      label.textContent = expanded ? expandedLabel : collapsedLabel;
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isExpanded = content.classList.contains('is-expanded');
    setState(!isExpanded);
  });

  setState(false);
})();

(function initGiftToggle() {
  const content = document.getElementById('giftContent');
  const toggleBtn = document.querySelector('.gift-toggle');
  if (!content || !toggleBtn) return;

  const label = toggleBtn.querySelector('.toggle-label');
  const collapsedLabel = 'Show Ways to Bless Us';
  const expandedLabel = 'Hide Ways to Bless Us';

  function setState(expanded) {
    content.classList.toggle('is-expanded', expanded);
    content.classList.toggle('is-collapsed', !expanded);
    content.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (label) {
      label.textContent = expanded ? expandedLabel : collapsedLabel;
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isExpanded = content.classList.contains('is-expanded');
    setState(!isExpanded);
  });

  setState(false);
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Intersection Observer for scroll animations
(function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add fade-in class to sections
  document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });

  // CSS for visible state
  const style = document.createElement('style');
  style.textContent = `
    .section.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
})();
