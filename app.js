/* ==========================================================================
   Pesles — app.js
   ========================================================================== */

/* --------------------------------------------------------------------------
   Circular Orbital Star Background Animation
   -------------------------------------------------------------------------- */
(function () {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, cx, cy;
  let stars = [], shootingStars = [];

  const STAR_COUNT     = 260;
  const SHOOT_INTERVAL = 3200;

  /* Resize & Mobile Orientation Handling */
  function resize() {
    W  = canvas.width  = window.innerWidth;
    H  = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  window.addEventListener('resize', () => { resize(); initStars(); });
  window.addEventListener('orientationchange', () => { setTimeout(() => { resize(); initStars(); }, 150); });

  /* Max radius — just past the screen diagonal so stars fill every corner */
  function maxRadius() {
    return Math.sqrt(cx * cx + cy * cy) * 1.05;
  }

  /* Create a single orbiting star */
  function createStar() {
    const r     = Math.random() * maxRadius();        // orbital radius
    const angle = Math.random() * Math.PI * 2;        // starting angle
    const size  = Math.random() * 1.5 + 0.3;

    /* Inner stars orbit faster — mimics Keplerian motion */
    const speed = (0.00015 + 0.00035 * (1 - r / maxRadius()))
                  * (Math.random() > 0.5 ? 1 : -1);  // ~half go counter-clockwise

    return {
      r, angle, size,
      speed,
      alpha:    Math.random() * 0.55 + 0.2,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      twinkle:  Math.random() * 0.006 + 0.002,
    };
  }

  /* Shooting star (diagonal streak) */
  function createShootingStar() {
    const sx    = Math.random() * W;
    const sy    = Math.random() * H * 0.5;
    const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.4;
    return {
      x: sx, y: sy,
      vx: Math.cos(angle) * (7 + Math.random() * 4),
      vy: Math.sin(angle) * (7 + Math.random() * 4),
      alpha: 1,
      fade:  0.018 + Math.random() * 0.012,
      trail: [],
      alive: true,
    };
  }

  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, createStar);
  }
  initStars();

  setInterval(() => shootingStars.push(createShootingStar()), SHOOT_INTERVAL);

  /* Draw loop */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* --- Orbiting stars --- */
    stars.forEach(s => {
      /* Advance orbital angle */
      s.angle += s.speed;

      /* Twinkle */
      s.alpha += s.twinkle * s.alphaDir;
      if (s.alpha > 0.85 || s.alpha < 0.1) s.alphaDir *= -1;

      /* Convert polar → cartesian from screen center */
      const x = cx + Math.cos(s.angle) * s.r;
      const y = cy + Math.sin(s.angle) * s.r;

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });

    /* --- Shooting stars --- */
    shootingStars.forEach(ss => {
      ss.trail.push({ x: ss.x, y: ss.y });
      if (ss.trail.length > 26) ss.trail.shift();

      if (ss.trail.length > 1) {
        for (let i = 1; i < ss.trail.length; i++) {
          const t = i / ss.trail.length;
          const p = ss.trail[i - 1];
          const c = ss.trail[i];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(c.x, c.y);
          ctx.strokeStyle = `rgba(180,255,200,${t * ss.alpha * 0.85})`;
          ctx.lineWidth   = t * 2;
          ctx.lineCap     = 'round';
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,255,230,${ss.alpha})`;
      ctx.fill();

      ss.x     += ss.vx;
      ss.y     += ss.vy;
      ss.alpha -= ss.fade;
      if (ss.alpha <= 0 || ss.x > W + 50 || ss.y > H + 50) ss.alive = false;
    });

    shootingStars = shootingStars.filter(ss => ss.alive);
    requestAnimationFrame(draw);
  }

  draw();
})();


/* ==========================================================================
   Checkout Modal
   ========================================================================== */
let currentBilling = 'monthly';

function openCheckoutModal() {
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('checkoutModal')) closeCheckoutModal();
}

function setBilling(plan) {
  currentBilling = plan;
  document.getElementById('btnMonthly').classList.toggle('active', plan === 'monthly');
  document.getElementById('btnAnnual').classList.toggle('active',  plan === 'annual');
  document.getElementById('summaryInterval').textContent = plan === 'monthly' ? 'Monthly Recurring' : 'Annual (1 payment)';
  document.getElementById('summaryTotal').textContent    = plan === 'monthly' ? '$9.00 USD' : '$89.00 USD';
  document.getElementById('checkoutBtnText').textContent = plan === 'monthly'
    ? 'Continue to Secure Checkout ($9)'
    : 'Continue to Secure Checkout ($89)';
}

function proceedToCheckout() {
  const btn  = document.querySelector('.modal-checkout-btn');
  const span = document.getElementById('checkoutBtnText');
  btn.disabled     = true;
  span.textContent = 'Redirecting…';
  setTimeout(() => {
    btn.disabled     = false;
    span.textContent = currentBilling === 'monthly'
      ? 'Continue to Secure Checkout ($9)'
      : 'Continue to Secure Checkout ($89)';
  }, 2000);
}


/* ==========================================================================
   Playlist Media Selection & Navigation (Dynamic from Admin Sync)
   ========================================================================== */

const STORAGE_KEY_MEDIA = 'pesles_media_items';
const STORAGE_KEY_IG    = 'pesles_ig_config';

const DEFAULT_MEDIA = [
  { id: '1', title: 'Live Session', src: 'vids/IMG_7152.MP4', type: 'video', archived: false },
  { id: '2', title: 'Creative Showcase', src: 'vids/photo_6338936490255128232_w.jpg', type: 'image', archived: false },
  { id: '3', title: 'Student Results', src: 'vids/photo_6338936490255128263_w.jpg', type: 'image', archived: false },
  { id: '4', title: 'Platform Walkthrough', src: 'vids/screenrecordM (1).mp4', type: 'video', archived: false }
];

let livePlaylist = [];
let currentMediaIndex = 1;

function loadLiveMedia() {
  const stored = localStorage.getItem(STORAGE_KEY_MEDIA);
  if (stored) {
    try {
      const all = JSON.parse(stored);
      livePlaylist = all.filter(i => !i.archived);
    } catch (e) {
      livePlaylist = DEFAULT_MEDIA;
    }
  } else {
    livePlaylist = DEFAULT_MEDIA;
  }

  if (livePlaylist.length === 0) {
    livePlaylist = DEFAULT_MEDIA;
  }
}

function renderLivePlaylist() {
  const row = document.getElementById('playlistRow');
  if (!row) return;

  row.innerHTML = livePlaylist.map((item, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    const isActive = idx === (currentMediaIndex - 1);

    let previewContent = '';
    if (item.type === 'video') {
      previewContent = `<video src="${item.src}#t=0.5" preload="metadata" muted playsinline></video>`;
    } else if (item.type === 'image') {
      previewContent = `<img src="${item.src}" alt="${item.title || 'Preview'}" loading="lazy">`;
    } else if (item.type === 'iframe') {
      previewContent = `<div style="width:100%;height:100%;background:#1e3a8a;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#fff;">Embed</div>`;
    }

    return `
      <div class="playlist-thumb ${isActive ? 'active' : ''}" onclick="selectThumb(this, ${idx + 1})" id="thumb${idx + 1}" title="${item.title || 'Media ' + num}">
        <div class="playlist-thumb-img">
          ${previewContent}
        </div>
        <div class="playlist-thumb-overlay">
          <div class="playlist-play-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        <div class="playlist-thumb-label">
          <span class="playlist-num">${num}</span>
        </div>
      </div>
    `;
  }).join('');
}

function syncLiveInstagram() {
  const stored = localStorage.getItem(STORAGE_KEY_IG);
  if (!stored) return;

  try {
    const config = JSON.parse(stored);
    const titleEl    = document.querySelector('.ig-title-meta h3');
    const handleEl   = document.querySelector('.ig-handle');
    const bannerEl   = document.querySelector('.ig-banner-img');
    const msgTitleEl = document.querySelector('.ig-message-title');
    const msgSubEl   = document.querySelector('.ig-message-sub');
    const linkEl     = document.querySelector('.ig-cta-btn');

    if (titleEl && config.title) titleEl.textContent = config.title;
    if (handleEl && config.handle) handleEl.textContent = config.handle;
    if (bannerEl && config.banner) bannerEl.src = config.banner;
    if (msgTitleEl && config.messageTitle) msgTitleEl.textContent = config.messageTitle;
    if (msgSubEl && config.messageSub) msgSubEl.textContent = config.messageSub;
    if (linkEl && config.link) linkEl.href = config.link;
  } catch (e) {}
}

function selectThumb(el, num) {
  if (num < 1 || num > livePlaylist.length) return;
  currentMediaIndex = num;

  // Highlight active thumb
  document.querySelectorAll('.playlist-thumb').forEach(t => t.classList.remove('active'));
  if (el) {
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  } else {
    const targetThumb = document.getElementById(`thumb${num}`);
    if (targetThumb) {
      targetThumb.classList.add('active');
      targetThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  const item = livePlaylist[num - 1];
  if (!item) return;

  const container = document.getElementById('videoContainer');
  const video     = document.getElementById('vslVideo');
  const img       = document.getElementById('vslImage');

  if (!container) return;

  // Smooth fade transition
  container.style.opacity = '0.25';
  container.style.transition = 'opacity 0.2s ease';

  setTimeout(() => {
    // Reset players
    if (video) {
      video.style.display = 'none';
      video.pause();
      video.src = '';
    }

    if (img) {
      img.style.display = 'none';
      img.src = '';
    }

    // Activate media
    if (item.type === 'video' && video) {
      video.src = item.src;
      video.style.display = 'block';
      video.load();
      video.play().catch(() => {});
    } else if (item.type === 'image' && img) {
      img.src = item.src;
      img.style.display = 'block';
    }

    container.style.opacity = '1';
  }, 180);
}

function nextMedia() {
  const nextIdx = currentMediaIndex >= livePlaylist.length ? 1 : currentMediaIndex + 1;
  selectThumb(null, nextIdx);
}

function prevMedia() {
  const prevIdx = currentMediaIndex <= 1 ? livePlaylist.length : currentMediaIndex - 1;
  selectThumb(null, prevIdx);
}

// Keyboard arrow key navigation support
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    nextMedia();
  } else if (e.key === 'ArrowLeft') {
    prevMedia();
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadLiveMedia();
  renderLivePlaylist();
  syncLiveInstagram();

  // Load first item into player
  if (livePlaylist.length > 0) {
    const first = livePlaylist[0];
    const video = document.getElementById('vslVideo');
    const img   = document.getElementById('vslImage');
    if (first.type === 'video' && video) {
      video.src = first.src;
      video.style.display = 'block';
    } else if (first.type === 'image' && img) {
      img.src = first.src;
      img.style.display = 'block';
    }
  }
});



