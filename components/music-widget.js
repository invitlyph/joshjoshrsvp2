// ============================================
// Music Widget Toggle Component
// ============================================

(function initMusicWidget() {
  const widget = document.getElementById('musicWidget');
  const toggle = document.getElementById('musicWidgetToggle');
  
  if (!widget || !toggle) return;

  let isTouchDevice = false;

  // Function to expand widget
  function expandWidget() {
    widget.classList.remove('collapsed');
    widget.classList.add('expanded');
  }

  // Function to collapse widget
  function collapseWidget() {
    widget.classList.remove('expanded');
    widget.classList.add('collapsed');
  }

  // Function to toggle widget
  function toggleWidget() {
    if (widget.classList.contains('collapsed')) {
      expandWidget();
    } else {
      collapseWidget();
    }
  }

  // Detect touch device
  toggle.addEventListener('touchstart', () => {
    isTouchDevice = true;
  }, { passive: true });

  widget.addEventListener('touchstart', () => {
    isTouchDevice = true;
  }, { passive: true });

  // Click handler for desktop
  toggle.addEventListener('click', (e) => {
    if (isTouchDevice) {
      isTouchDevice = false; // Reset for next interaction
      return; // Skip, touchend already handled it
    }
    e.stopPropagation();
    toggleWidget();
  });

  // Touch handler for mobile
  toggle.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWidget();
  }, { passive: false });

  // Click on widget when collapsed (desktop)
  widget.addEventListener('click', (e) => {
    if (isTouchDevice) return;
    if (!widget.classList.contains('collapsed')) return;
    if (e.target.closest('#musicWidgetToggle')) return;
    expandWidget();
  });

  // Touch on widget when collapsed (mobile)
  widget.addEventListener('touchend', (e) => {
    if (!widget.classList.contains('collapsed')) return;
    if (e.target.closest('#musicWidgetToggle')) return;
    e.preventDefault();
    expandWidget();
  }, { passive: false });

  // Update playing state class
  window.updateMusicWidgetState = function(isPlaying) {
    if (isPlaying) {
      widget.classList.add('playing');
    } else {
      widget.classList.remove('playing');
    }
  };

  // Update the header text when playing
  window.updateMusicWidgetTitle = function(title) {
    const textEl = widget.querySelector('.music-text');
    if (textEl) {
      textEl.textContent = title || 'Now Playing';
    }
  };
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
