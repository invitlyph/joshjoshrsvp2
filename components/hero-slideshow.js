// ============================================
// Hero Background Slideshow (proper crossfade)
// No flickering - one image fades out while the other fades in
// ============================================
(function initHeroSlideshow(){
  const INTERVAL = 5000; // ms between transitions
  const FADE_DURATION = 1200; // ms for fade transition

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const images = [
    'photos/prenup1.png',
    'photos/Screenshot 2026-01-03 001436.png',
    'photos/Screenshot 2026-01-03 001542.png',
    'photos/Screenshot 2026-01-03 001634.png',
    'photos/Screenshot 2026-01-03 001459.png',
    'photos/Screenshot 2026-01-03 001715.png',
    'photos/Screenshot 2026-01-03 001732.png',
    'photos/Screenshot 2026-01-03 001744.png',
    'photos/Screenshot 2026-01-03 001808.png',
    'photos/Screenshot 2026-01-03 001833.png',
  ];

  // Remove original hero-bg
  const originalBg = hero.querySelector('.hero-bg');
  if (originalBg) originalBg.remove();

  // Create single layer that will fade between images
  const bgLayer = document.createElement('div');
  bgLayer.className = 'hero-bg-layer';
  bgLayer.style.cssText = `
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: saturate(0.85) brightness(0.95);
    z-index: 0;
  `;
  
  // Insert at beginning of hero
  hero.insertBefore(bgLayer, hero.firstChild);

  let currentIndex = 0;

  // Set initial image
  bgLayer.style.backgroundImage = `url('${images[0]}')`;
  
  // Preload all images
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  function changeImage() {
    // Fade out
    bgLayer.style.transition = `opacity ${FADE_DURATION / 2}ms ease-out`;
    bgLayer.style.opacity = '0';
    
    setTimeout(() => {
      // Change image while invisible
      currentIndex = (currentIndex + 1) % images.length;
      bgLayer.style.backgroundImage = `url('${images[currentIndex]}')`;
      
      // Fade in
      bgLayer.style.transition = `opacity ${FADE_DURATION / 2}ms ease-in`;
      bgLayer.style.opacity = '1';
    }, FADE_DURATION / 2);
  }

  // Start slideshow
  setInterval(changeImage, INTERVAL);
})();
