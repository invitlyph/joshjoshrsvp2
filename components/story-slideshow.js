// ============================================
// Story Section Background Slideshow
// Full-width background images with story text overlay
// Sequence: Show image (3s) → Show text (8s) → Fade to next
// ============================================
(function initStorySlideshow(){
  const IMAGE_ONLY_DURATION = 1200;      // ms to show image before text appears
  const TEXT_VISIBLE_DURATION = 8000;    // ms to show text with image (longer)
  const FADE_DURATION = 800;            // ms for fade transitions (slower, smoother)

  const section = document.getElementById('story');
  if (!section) return;

  // Collect story items from existing timeline
  const rawItems = Array.from(section.querySelectorAll('.story-item'));
  if (!rawItems.length) return;
  
  const items = rawItems.map(node => ({
    year: (node.querySelector('.story-year')?.textContent || '').trim(),
    title: (node.querySelector('h4')?.textContent || '').trim(),
    text: (node.querySelector('p')?.textContent || '').trim(),
  }));
  
  // Hide the original timeline
  const timeline = section.querySelector('.story-timeline');
  if (timeline) timeline.style.display = 'none';

  // Images array - one per story item ideally, but we cycle through available
  const images = [
    'photos/prenup1.png',
    'photos/Screenshot 2026-01-03 001833.png',
    'photos/Screenshot 2026-01-03 001744.png',
    'photos/Screenshot 2026-01-03 001634.png',
    'photos/Screenshot 2026-01-03 001459.png',
  ];

  // Make section full-width and set up for background slideshow
  section.style.cssText = `
    position: relative;
    max-width: none;
    width: 100%;
    min-height: 100vh;
    padding: 0;
    margin: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #2C3E50;
  `;

  // Create TWO background layers for smooth crossfade (no white flash)
  const bgLayerA = document.createElement('div');
  const bgLayerB = document.createElement('div');
  
  const bgStyle = `
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
    transition: opacity ${FADE_DURATION}ms ease;
  `;
  
  bgLayerA.className = 'story-bg-layer-a';
  bgLayerA.style.cssText = bgStyle + 'opacity: 1;';
  
  bgLayerB.className = 'story-bg-layer-b';
  bgLayerB.style.cssText = bgStyle + 'opacity: 0;';
  
  section.insertBefore(bgLayerB, section.firstChild);
  section.insertBefore(bgLayerA, section.firstChild);

  // Create dark overlay for text readability
  const darkOverlay = document.createElement('div');
  darkOverlay.style.cssText = `
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(44, 62, 80, 0.3) 0%,
      rgba(44, 62, 80, 0.5) 50%,
      rgba(44, 62, 80, 0.3) 100%
    );
    z-index: 1;
  `;
  section.appendChild(darkOverlay);

  // Move and style section header
  const header = section.querySelector('.section-header');
  if (header) {
    header.style.cssText = `
      position: relative;
      z-index: 3;
      padding: 60px 24px 20px;
      margin: 0;
    `;
    const h2 = header.querySelector('h2');
    if (h2) h2.style.color = '#fff';
    header.querySelectorAll('.section-ornament').forEach(el => {
      el.style.color = 'rgba(255,255,255,0.6)';
    });
  }

  // Create text overlay container
  const textOverlay = document.createElement('div');
  textOverlay.className = 'story-text-overlay';
  textOverlay.style.cssText = `
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 100%;
    max-width: 600px;
    padding: 40px 24px 80px;
    text-align: center;
  `;
  
  textOverlay.innerHTML = `
    <div class="story-card" style="
      background: rgba(255, 255, 255, 0.15);
      padding: 40px 48px;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 1200ms ease-in-out, transform 1200ms ease-in-out;
      max-width: 100%;
    ">
      <div class="s-year" style="
        font-family: var(--font-family-base);
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        margin-bottom: 12px;
      "></div>
      <h3 class="s-title" style="
        font-family: var(--font-family-base);
        font-size: 1.8rem;
        font-weight: 600;
        color: #fff;
        margin: 0 0 16px;
        line-height: 1.3;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      "></h3>
      <p class="s-text" style="
        font-family: var(--font-family-base);
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        line-height: 1.7;
      "></p>
    </div>
  `;
  section.appendChild(textOverlay);

  const card = textOverlay.querySelector('.story-card');
  const yearEl = textOverlay.querySelector('.s-year');
  const titleEl = textOverlay.querySelector('.s-title');
  const textEl = textOverlay.querySelector('.s-text');

  let currentIndex = 0;
  let activeLayer = 'A'; // Track which layer is currently visible

  // Set initial image on layer A
  bgLayerA.style.backgroundImage = `url('${images[0]}')`;
  bgLayerA.style.opacity = '1';
  bgLayerB.style.opacity = '0';
  
  // Preload all images
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  function showText() {
    const item = items[currentIndex % items.length];
    yearEl.textContent = item.year;
    titleEl.textContent = item.title;
    textEl.textContent = item.text;
    
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }

  function hideText() {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
  }

  function crossfadeToNextImage(callback) {
    const nextImageIndex = (currentIndex + 1) % images.length;
    const nextImageUrl = `url('${images[nextImageIndex]}')`;
    
    if (activeLayer === 'A') {
      // Load next image on layer B, then fade B in and A out
      bgLayerB.style.backgroundImage = nextImageUrl;
      bgLayerB.style.opacity = '1';
      bgLayerA.style.opacity = '0';
      activeLayer = 'B';
    } else {
      // Load next image on layer A, then fade A in and B out
      bgLayerA.style.backgroundImage = nextImageUrl;
      bgLayerA.style.opacity = '1';
      bgLayerB.style.opacity = '0';
      activeLayer = 'A';
    }
    
    // Wait for crossfade to complete
    setTimeout(() => {
      if (callback) callback();
    }, FADE_DURATION);
  }

  function cycle() {
    // Phase 1: Show image only for IMAGE_ONLY_DURATION
    setTimeout(() => {
      // Phase 2: Show text for TEXT_VISIBLE_DURATION
      showText();
      
      setTimeout(() => {
        // Phase 3: Hide text, then crossfade to next image
        hideText();
        
        setTimeout(() => {
          // Crossfade to next image (smooth, no white flash)
          crossfadeToNextImage(() => {
            // Move to next story item
            currentIndex = (currentIndex + 1) % items.length;
            // Start next cycle
            cycle();
          });
        }, FADE_DURATION); // Wait for text fade out
      }, TEXT_VISIBLE_DURATION);
    }, IMAGE_ONLY_DURATION);
  }

  // Start the slideshow
  cycle();
})();
