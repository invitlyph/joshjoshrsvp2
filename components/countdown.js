// ============================================
// Countdown Timer Component
// ============================================

(function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  
  // Wedding at 3:00 PM on January 22, 2026
  const eventDate = new Date('January 22, 2026 15:00:00');

  function tick() {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      el.textContent = 'Today is the day!';
      return;
    }
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    el.textContent = `${d} days \u2022 ${h}h ${m}m ${s}s`;
  }
  
  tick();
  setInterval(tick, 1000);
})();
