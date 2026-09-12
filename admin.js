/* ==========================================================================
   Pesles Admin Studio — Authentication & Configuration Logic
   ========================================================================== */

const ADMIN_CREDENTIALS = {
  email: 'pesles@gmail.com',
  password: 'Pesles@123'
};

const STORAGE_KEY_AUTH  = 'pesles_admin_session';
const STORAGE_KEY_MEDIA = 'pesles_media_items';
const STORAGE_KEY_IG    = 'pesles_ig_config';

/* ==========================================================================
   Authentication Engine
   ========================================================================== */
function isAuthenticated() {
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'authenticated';
}

function checkAuthStatus() {
  const loginScreen = document.getElementById('loginScreen');
  const adminLayout = document.getElementById('adminLayout');

  if (isAuthenticated()) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminLayout) adminLayout.style.display = 'flex';
    updateStats();
    renderActiveMedia();
    renderArchivedMedia();
    renderInstagramSettings();
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminLayout) adminLayout.style.display = 'none';
    const emailInput = document.getElementById('loginEmail');
    if (emailInput) setTimeout(() => emailInput.focus(), 150);
  }
}

function handleAdminLogin(e) {
  e.preventDefault();

  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errorEl  = document.getElementById('loginError');
  const cardEl   = document.getElementById('loginCard');

  if (email === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'authenticated');
    if (errorEl) errorEl.classList.remove('active');

    const loginScreen = document.getElementById('loginScreen');
    const adminLayout = document.getElementById('adminLayout');

    loginScreen.style.transition = 'opacity 0.25s ease';
    loginScreen.style.opacity = '0';

    setTimeout(() => {
      loginScreen.style.display = 'none';
      loginScreen.style.opacity = '1';
      adminLayout.style.display = 'flex';
      updateStats();
      renderActiveMedia();
      renderArchivedMedia();
      renderInstagramSettings();
      showToast('Welcome to Pesles Admin Studio! ✨');
    }, 240);
  } else {
    if (errorEl) {
      errorEl.classList.add('active');
      document.getElementById('loginErrorText').textContent = 'Incorrect email or password. Please try again.';
    }
    if (cardEl) {
      cardEl.classList.remove('shake');
      void cardEl.offsetWidth; // trigger reflow
      cardEl.classList.add('shake');
    }
  }
}

function handleAdminLogout() {
  if (!confirm('Are you sure you want to log out from Pesles Admin Studio?')) return;

  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  document.getElementById('loginPassword').value = '';
  checkAuthStatus();
  showToast('Logged out successfully.');
}

// Factory Default Media Items
const DEFAULT_MEDIA_ITEMS = [

  {
    id: 'media_1',
    title: 'Live Session Masterclass',
    type: 'video',
    src: 'vids/IMG_7152.MP4',
    archived: false,
    dateAdded: '2026-08-27'
  },
  {
    id: 'media_2',
    title: 'Creative Showcase',
    type: 'image',
    src: 'vids/photo_6338936490255128232_w.jpg',
    archived: false,
    dateAdded: '2026-08-27'
  },
  {
    id: 'media_3',
    title: 'Student Results & Proof',
    type: 'image',
    src: 'vids/photo_6338936490255128263_w.jpg',
    archived: false,
    dateAdded: '2026-08-27'
  },
  {
    id: 'media_4',
    title: 'Platform Walkthrough',
    type: 'iframe',
    src: 'https://player.vimeo.com/video/1221855390?h=00f22282ba',
    archived: false,
    dateAdded: '2026-08-27'
  },
  {
    id: 'media_5',
    title: 'Masterclass Walkthrough',
    type: 'iframe',
    src: 'https://player.vimeo.com/video/1226110797?h=46e2e8deb8',
    archived: false,
    dateAdded: '2026-08-27'
  }
];


// Factory Default Instagram Config
const DEFAULT_IG_CONFIG = {
  title: 'Darwin Cents',
  handle: '@darwin.cents',
  link: 'https://www.instagram.com/darwin.cents?igsi=MWd2Y2Z6end4Zm81NA%3D%3D&utm_source=qr',
  banner: 'vids/IG.jpg',
  messageTitle: 'Message me here on IG',
  messageSub: 'Have questions, want to get started, or need 1-on-1 guidance? Send me a direct message on Instagram.'
};

/* ==========================================================================
   State & Storage Helpers
   ========================================================================== */
function getMediaItems() {
  const data = localStorage.getItem(STORAGE_KEY_MEDIA);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_MEDIA, JSON.stringify(DEFAULT_MEDIA_ITEMS));
    return DEFAULT_MEDIA_ITEMS;
  }
  try {
    let items = JSON.parse(data);

    // Auto-correct any Vimeo/YouTube/Loom items saved with wrong type or raw URL
    items = items.map(item => {
      let src = item.src || '';
      let type = item.type;
      const formatted = formatEmbedUrl(src);
      if (formatted !== src || formatted.includes('player.vimeo.com') || formatted.includes('youtube.com/embed') || formatted.includes('loom.com/embed')) {
        src = formatted;
        type = 'iframe';
      }
      return {
        ...item,
        src: src,
        type: type
      };
    });

    // Ensure item 5 is present
    const hasItem5 = items.some(item => item.src && item.src.includes('1226110797'));
    if (!hasItem5) {
      const item4 = items.find(item => item.id === 'media_4' || item.id === '4');
      if (item4) {
        item4.src = 'https://player.vimeo.com/video/1221855390?h=00f22282ba';
        item4.title = 'Platform Walkthrough';
        item4.type = 'iframe';
      }
      items.push({
        id: 'media_5',
        title: 'Masterclass Walkthrough',
        src: 'https://player.vimeo.com/video/1226110797?h=46e2e8deb8',
        type: 'iframe',
        archived: false,
        dateAdded: '2026-08-27'
      });
    }
    localStorage.setItem(STORAGE_KEY_MEDIA, JSON.stringify(items));
    return items;
  } catch (e) {
    return DEFAULT_MEDIA_ITEMS;
  }
}

function saveMediaItems(items) {
  localStorage.setItem(STORAGE_KEY_MEDIA, JSON.stringify(items));
}

function getIgConfig() {
  const data = localStorage.getItem(STORAGE_KEY_IG);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_IG, JSON.stringify(DEFAULT_IG_CONFIG));
    return DEFAULT_IG_CONFIG;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_IG_CONFIG;
  }
}

function saveIgConfig(config) {
  localStorage.setItem(STORAGE_KEY_IG, JSON.stringify(config));
}

/* ==========================================================================
   UI Rendering
   ========================================================================== */
function updateStats() {
  const items = getMediaItems();
  const activeCount   = items.filter(i => !i.archived).length;
  const archivedCount = items.filter(i => i.archived).length;
  const igConfig      = getIgConfig();

  document.getElementById('statTotal').textContent    = items.length;
  document.getElementById('statActive').textContent   = activeCount;
  document.getElementById('statArchived').textContent = archivedCount;
  document.getElementById('statIgHandle').textContent = igConfig.handle || '@darwin.cents';

  document.getElementById('badgeActiveCount').textContent   = activeCount;
  document.getElementById('badgeArchivedCount').textContent = archivedCount;
}

function renderActiveMedia() {
  const items = getMediaItems().filter(i => !i.archived);
  const grid  = document.getElementById('activeMediaGrid');
  const empty = document.getElementById('emptyActiveState');

  if (items.length === 0) {
    grid.style.display  = 'none';
    empty.style.display = 'flex';
    return;
  }

  grid.style.display  = 'grid';
  empty.style.display = 'none';

  grid.innerHTML = items.map((item, index) => {
    const num = (index + 1).toString().padStart(2, '0');
    const isMain = index === 0;

    let previewMarkup = '';
    if (item.type === 'video') {
      previewMarkup = `<video src="${item.src}#t=0.5" preload="metadata" muted playsinline></video>`;
    } else if (item.type === 'image') {
      previewMarkup = `<img src="${item.src}" alt="${item.title}" loading="lazy">`;
    } else if (item.type === 'iframe') {
      previewMarkup = `<iframe src="${item.src}" frameborder="0"></iframe>`;
    }

    return `
      <div class="media-admin-card ${isMain ? 'is-main' : ''}" data-id="${item.id}">
        <div class="media-preview-box">
          ${previewMarkup}
          <div class="badge-top-left">
            <span class="card-num-badge ${isMain ? 'main' : ''}">
              ${isMain ? '👑 Main (01)' : num}
            </span>
            <span class="card-type-badge">${item.type}</span>
          </div>
        </div>

        <div class="media-card-details">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="media-src-path" title="${escapeHtml(item.src)}">${escapeHtml(item.src)}</span>

          <div class="media-card-actions">
            <div class="action-btn-group">
              <button type="button" class="icon-btn" onclick="moveItem('${item.id}', -1)" title="Move Left / Up" ${index === 0 ? 'disabled style="opacity:0.35;"' : ''}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button type="button" class="icon-btn" onclick="moveItem('${item.id}', 1)" title="Move Right / Down" ${index === items.length - 1 ? 'disabled style="opacity:0.35;"' : ''}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div class="action-btn-group">
              <button type="button" class="btn-secondary btn-sm" onclick="openReplaceModal('${item.id}')" title="Replace File / URL">
                🔄 Replace
              </button>
              <button type="button" class="icon-btn" onclick="openEditModal('${item.id}')" title="Edit Title">
                ✏️
              </button>
              <button type="button" class="icon-btn" onclick="toggleArchive('${item.id}')" title="Archive (Hide from site)">
                🗄️
              </button>
              <button type="button" class="icon-btn danger" onclick="deleteItem('${item.id}')" title="Delete Asset">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderArchivedMedia() {
  const items = getMediaItems().filter(i => i.archived);
  const grid  = document.getElementById('archivedMediaGrid');
  const empty = document.getElementById('emptyArchivedState');

  if (items.length === 0) {
    grid.style.display  = 'none';
    empty.style.display = 'flex';
    return;
  }

  grid.style.display  = 'grid';
  empty.style.display = 'none';

  grid.innerHTML = items.map((item) => {
    let previewMarkup = '';
    if (item.type === 'video') {
      previewMarkup = `<video src="${item.src}#t=0.5" preload="metadata" muted playsinline></video>`;
    } else if (item.type === 'image') {
      previewMarkup = `<img src="${item.src}" alt="${item.title}" loading="lazy">`;
    } else if (item.type === 'iframe') {
      previewMarkup = `<iframe src="${item.src}" frameborder="0"></iframe>`;
    }

    return `
      <div class="media-admin-card" style="opacity: 0.85;" data-id="${item.id}">
        <div class="media-preview-box">
          ${previewMarkup}
          <div class="badge-top-left">
            <span class="card-num-badge" style="background:#4b5563;">Archived</span>
            <span class="card-type-badge">${item.type}</span>
          </div>
        </div>

        <div class="media-card-details">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="media-src-path" title="${escapeHtml(item.src)}">${escapeHtml(item.src)}</span>

          <div class="media-card-actions">
            <span style="font-size:0.75rem;color:var(--text-muted);">Archived Asset</span>

            <div class="action-btn-group">
              <button type="button" class="btn-primary btn-sm" onclick="toggleArchive('${item.id}')" title="Restore to Live Site">
                ✨ Restore to Live
              </button>
              <button type="button" class="icon-btn danger" onclick="deleteItem('${item.id}')" title="Permanently Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderInstagramSettings() {
  const config = getIgConfig();

  document.getElementById('igInputTitle').value        = config.title || 'Darwin Cents';
  document.getElementById('igInputHandle').value       = config.handle || '@darwin.cents';
  document.getElementById('igInputLink').value         = config.link || '';
  document.getElementById('igInputBanner').value       = config.banner || 'vids/IG.jpg';
  document.getElementById('igInputMsgTitle').value     = config.messageTitle || 'Message me here on IG';
  document.getElementById('igInputMsgSub').value       = config.messageSub || '';

  // Live preview inside settings
  document.getElementById('igPreviewTitle').textContent    = config.title || 'Darwin Cents';
  document.getElementById('igPreviewHandle').textContent   = config.handle || '@darwin.cents';
  document.getElementById('igPreviewMsgTitle').textContent = config.messageTitle || 'Message me here on IG';
  document.getElementById('igPreviewMsgSub').textContent   = config.messageSub || '';
  document.getElementById('igPreviewBanner').src           = config.banner || 'vids/IG.jpg';
}

/* ==========================================================================
   Tab Navigation
   ========================================================================== */
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

  const btn = document.getElementById(`tabBtn-${tabId}`);
  const content = document.getElementById(`tabContent-${tabId}`);

  if (btn) btn.classList.add('active');
  if (content) content.style.display = 'block';

  if (tabId === 'active') renderActiveMedia();
  if (tabId === 'archived') renderArchivedMedia();
  if (tabId === 'instagram') renderInstagramSettings();
}

/* ==========================================================================
   Media Action Operations
   ========================================================================== */
function toggleArchive(id) {
  const items = getMediaItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  item.archived = !item.archived;
  saveMediaItems(items);
  updateStats();
  renderActiveMedia();
  renderArchivedMedia();

  showToast(item.archived ? 'Asset moved to Archive' : 'Asset restored to Live Site! ✨');
}

function deleteItem(id) {
  if (!confirm('Are you sure you want to permanently delete this media asset?')) return;

  let items = getMediaItems();
  items = items.filter(i => i.id !== id);
  saveMediaItems(items);
  updateStats();
  renderActiveMedia();
  renderArchivedMedia();

  showToast('Asset deleted.');
}

function moveItem(id, direction) {
  let items = getMediaItems();
  const activeItems = items.filter(i => !i.archived);
  const currentIdx = activeItems.findIndex(i => i.id === id);

  if (currentIdx < 0) return;
  const targetIdx = currentIdx + direction;

  if (targetIdx < 0 || targetIdx >= activeItems.length) return;

  // Swap in active items
  const temp = activeItems[currentIdx];
  activeItems[currentIdx] = activeItems[targetIdx];
  activeItems[targetIdx] = temp;

  // Merge back with archived
  const archivedItems = items.filter(i => i.archived);
  const newItems = [...activeItems, ...archivedItems];

  saveMediaItems(newItems);
  renderActiveMedia();
  showToast('Media reordered.');
}

/* ==========================================================================
   Modal Operations (Add / Edit / Replace)
   ========================================================================== */
let editingMediaId = null;

function openAddMediaModal() {
  editingMediaId = null;
  document.getElementById('modalTitleText').textContent = '➕ Add New Media Asset';
  document.getElementById('mediaInputTitle').value = '';
  document.getElementById('mediaInputType').value  = 'video';
  document.getElementById('mediaInputSrc').value   = '';
  document.getElementById('mediaFileInput').value  = '';
  document.getElementById('mediaSaveBtn').textContent = 'Add to Live Site';

  openModal();
}

function openEditModal(id) {
  const items = getMediaItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  editingMediaId = id;
  document.getElementById('modalTitleText').textContent = '✏️ Edit Media Asset';
  document.getElementById('mediaInputTitle').value = item.title;
  document.getElementById('mediaInputType').value  = item.type;
  document.getElementById('mediaInputSrc').value   = item.src;
  document.getElementById('mediaFileInput').value  = '';
  document.getElementById('mediaSaveBtn').textContent = 'Save Changes';

  openModal();
}

function openReplaceModal(id) {
  const items = getMediaItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  editingMediaId = id;
  document.getElementById('modalTitleText').textContent = `🔄 Replace Asset: ${item.title}`;
  document.getElementById('mediaInputTitle').value = item.title;
  document.getElementById('mediaInputType').value  = item.type;
  document.getElementById('mediaInputSrc').value   = item.src;
  document.getElementById('mediaFileInput').value  = '';
  document.getElementById('mediaSaveBtn').textContent = 'Replace Asset';

  openModal();
}

function openModal() {
  document.getElementById('mediaModal').classList.add('active');
}

function closeModal() {
  document.getElementById('mediaModal').classList.remove('active');
}

// File chooser reader
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Auto-detect type
  if (file.type.startsWith('video/')) {
    document.getElementById('mediaInputType').value = 'video';
  } else if (file.type.startsWith('image/')) {
    document.getElementById('mediaInputType').value = 'image';
  }

  // Auto fill title if empty
  const titleInput = document.getElementById('mediaInputTitle');
  if (!titleInput.value) {
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    titleInput.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  // If local file in vids folder, write relative path or read dataUrl
  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById('mediaInputSrc').value = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// Auto-format embed links (Vimeo, YouTube, Loom)
function formatEmbedUrl(url) {
  if (!url) return '';
  url = url.trim();

  // Vimeo standard / unlisted URLs
  // e.g. https://vimeo.com/1226110797/46e2e8deb8?share=copy...
  const vimeoUnlistedMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
  if (vimeoUnlistedMatch) {
    return `https://player.vimeo.com/video/${vimeoUnlistedMatch[1]}?h=${vimeoUnlistedMatch[2]}`;
  }

  // e.g. https://vimeo.com/1226110797
  const vimeoPublicMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoPublicMatch && !url.includes('player.vimeo.com')) {
    return `https://player.vimeo.com/video/${vimeoPublicMatch[1]}`;
  }

  // YouTube URLs
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && !url.includes('youtube.com/embed')) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Loom URLs
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch && !url.includes('loom.com/embed')) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  return url;
}

function saveMediaForm(e) {
  e.preventDefault();

  const title = document.getElementById('mediaInputTitle').value.trim();
  let type  = document.getElementById('mediaInputType').value;
  let src   = document.getElementById('mediaInputSrc').value.trim();

  if (!title || !src) {
    alert('Please provide both a Title and a Media Source (File or URL).');
    return;
  }

  // Auto format embed links
  const formattedSrc = formatEmbedUrl(src);
  if (formattedSrc !== src || formattedSrc.includes('player.vimeo.com') || formattedSrc.includes('youtube.com/embed') || formattedSrc.includes('loom.com/embed')) {
    src = formattedSrc;
    type = 'iframe';
  }

  let items = getMediaItems();

  if (editingMediaId) {
    const item = items.find(i => i.id === editingMediaId);
    if (item) {
      item.title = title;
      item.type  = type;
      item.src   = src;
    }
    showToast('Asset updated successfully!');
  } else {
    const newItem = {
      id: 'media_' + Date.now(),
      title: title,
      type: type,
      src: src,
      archived: false,
      dateAdded: new Date().toISOString().slice(0, 10)
    };
    items.unshift(newItem); // add to front
    showToast('New asset added to Live Site! 🎉');
  }

  saveMediaItems(items);
  updateStats();
  renderActiveMedia();
  renderArchivedMedia();
  closeModal();
}

/* ==========================================================================
   Instagram Config Form
   ========================================================================== */
function saveInstagramSettings(e) {
  e.preventDefault();

  const config = {
    title: document.getElementById('igInputTitle').value.trim() || 'Darwin Cents',
    handle: document.getElementById('igInputHandle').value.trim() || '@darwin.cents',
    link: document.getElementById('igInputLink').value.trim() || 'https://instagram.com/darwin.cents',
    banner: document.getElementById('igInputBanner').value.trim() || 'vids/IG.jpg',
    messageTitle: document.getElementById('igInputMsgTitle').value.trim() || 'Message me here on IG',
    messageSub: document.getElementById('igInputMsgSub').value.trim() || ''
  };

  saveIgConfig(config);
  updateStats();
  renderInstagramSettings();
  showToast('Instagram settings saved! 🚀');
}

function handleIgBannerUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById('igInputBanner').value = evt.target.result;
    document.getElementById('igPreviewBanner').src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   Reset to Factory Defaults
   ========================================================================== */
function resetAllDefaults() {
  if (!confirm('Reset all media assets and Instagram settings back to factory default? This will restore the 4 initial files.')) {
    return;
  }

  localStorage.setItem(STORAGE_KEY_MEDIA, JSON.stringify(DEFAULT_MEDIA_ITEMS));
  localStorage.setItem(STORAGE_KEY_IG, JSON.stringify(DEFAULT_IG_CONFIG));

  updateStats();
  renderActiveMedia();
  renderArchivedMedia();
  renderInstagramSettings();

  showToast('Reset to factory defaults.');
}

/* ==========================================================================
   Toast Notification
   ========================================================================== */
function showToast(msg) {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span>✓</span><span>${escapeHtml(msg)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ==========================================================================
   Orbital Starfield Animation for Background
   ========================================================================== */
(function initStarsBackground() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, cx, cy;
  const STAR_COUNT = 180;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const maxR = Math.sqrt(cx * cx + cy * cy);
    stars.push({
      r: Math.random() * maxR,
      angle: Math.random() * Math.PI * 2,
      size: Math.random() * 1.4 + 0.3,
      speed: (0.0003 + Math.random() * 0.0004) * (Math.random() < 0.5 ? 1 : -1),
      alpha: Math.random() * 0.7 + 0.2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.angle += s.speed;
      const x = cx + Math.cos(s.angle) * s.r;
      const y = cy + Math.sin(s.angle) * s.r;

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ==========================================================================
   Init on DOM Ready
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  const mediaFileInput = document.getElementById('mediaFileInput');
  if (mediaFileInput) mediaFileInput.addEventListener('change', handleFileSelect);

  const igBannerFileInput = document.getElementById('igBannerFileInput');
  if (igBannerFileInput) igBannerFileInput.addEventListener('change', handleIgBannerUpload);

  const mediaInputSrc = document.getElementById('mediaInputSrc');
  if (mediaInputSrc) {
    mediaInputSrc.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const formatted = formatEmbedUrl(val);
      if (formatted !== val) {
        e.target.value = formatted;
        const typeSelect = document.getElementById('mediaInputType');
        if (typeSelect) typeSelect.value = 'iframe';
      }
    });
  }
});

