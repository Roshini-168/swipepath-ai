// ==========================================
//  SwipePath AI — Main App Logic
// ==========================================

const API_BASE = '';

// State
let careers = [];
let cardQueue = [];
let swipeHistory = [];
let currentIndex = 0;
let totalCards = 0;
let isDragging = false;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let lastTap = 0;

// DOM refs
const splash = document.getElementById('splash');
const app = document.getElementById('app');
const resultsPage = document.getElementById('results-page');
const cardStack = document.getElementById('card-stack');
const swipeCountEl = document.getElementById('swipe-count');
const totalCountEl = document.getElementById('total-count');
const resultsContainer = document.getElementById('results-container');

const likeIndicator = document.getElementById('like-indicator');
const dislikeIndicator = document.getElementById('dislike-indicator');
const superIndicator = document.getElementById('super-indicator');
const superdownIndicator = document.getElementById('superdown-indicator');

// ==========================================
//  INIT
// ==========================================
async function init() {
  try {
    const res = await fetch(`${API_BASE}/api/careers`);
    careers = await res.json();
    
    // Shuffle for randomness
    careers = shuffleArray([...careers]);
    cardQueue = [...careers];
    totalCards = careers.length;
    totalCountEl.textContent = totalCards;

    // Wait for splash animation
    setTimeout(() => {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        splash.classList.add('hidden');
        app.classList.remove('hidden');
        renderCards();
      }, 500);
    }, 2200);

  } catch (err) {
    console.error('Failed to load careers:', err);
    // Fallback: show app anyway
    setTimeout(() => {
      splash.classList.add('hidden');
      app.classList.remove('hidden');
      cardStack.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Could not connect</h3>
          <p>Make sure the server is running</p>
        </div>`;
    }, 2200);
  }
}

// ==========================================
//  CARD RENDERING
// ==========================================
function renderCards() {
  cardStack.innerHTML = '';
  
  if (cardQueue.length === 0) {
    showResults();
    return;
  }

  // Render top 3 cards
  const visibleCards = cardQueue.slice(0, 3);
  
  visibleCards.forEach((career, index) => {
    const card = createCard(career, index);
    cardStack.appendChild(card);
  });

  // Attach drag listeners to top card
  attachDragListeners();
}

function createCard(career, stackIndex) {
  const card = document.createElement('div');
  card.className = `swipe-card card-${stackIndex + 1}`;
  card.dataset.id = career._id;

  const tagHTML = career.tags.slice(0, 4).map(t => 
    `<span class="card-tag">${t}</span>`
  ).join('');

  card.innerHTML = `
    <img class="card-image" src="${career.imageUrl}" alt="${career.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'" />
    <div class="card-gradient"></div>
    <div class="card-like-glow glow-like" id="glow-like-${career._id}"></div>
    <div class="card-like-glow glow-dislike" id="glow-dislike-${career._id}"></div>
    <div class="card-content">
      <div class="card-cluster">${career.cluster}</div>
      <h2 class="card-title">${career.title}</h2>
      <p class="card-description">${career.description}</p>
      <div class="card-tags">${tagHTML}</div>
      <div class="card-salary">Avg Salary: <strong>${career.avgSalary}</strong></div>
    </div>
  `;

  if (stackIndex === 0) {
    card.style.animation = 'cardAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
  }

  return card;
}

// ==========================================
//  DRAG / SWIPE LOGIC
// ==========================================
function attachDragListeners() {
  const topCard = cardStack.querySelector('.card-1');
  if (!topCard) return;

  // Touch events
  topCard.addEventListener('touchstart', onDragStart, { passive: true });
  topCard.addEventListener('touchmove', onDragMove, { passive: false });
  topCard.addEventListener('touchend', onDragEnd);

  // Mouse events
  topCard.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);

  // Double tap / click
  topCard.addEventListener('touchend', handleDoubleTap);
  topCard.addEventListener('dblclick', handleDoubleClick);
}

function onDragStart(e) {
  isDragging = true;
  const point = e.touches ? e.touches[0] : e;
  startX = point.clientX;
  startY = point.clientY;
  currentX = 0;
  currentY = 0;

  const topCard = cardStack.querySelector('.card-1');
  if (topCard) topCard.style.transition = 'none';
}

function onDragMove(e) {
  if (!isDragging) return;
  if (e.cancelable) e.preventDefault();

  const point = e.touches ? e.touches[0] : e;
  currentX = point.clientX - startX;
  currentY = point.clientY - startY;

  const topCard = cardStack.querySelector('.card-1');
  if (!topCard) return;

  const rotate = currentX * 0.08;
  topCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

  // Show indicators
  const threshold = 60;
  const absX = Math.abs(currentX);
  const absY = Math.abs(currentY);

  // Glow effects
  const glowLike = topCard.querySelector('.card-like-glow.glow-like');
  const glowDislike = topCard.querySelector('.card-like-glow.glow-dislike');

  resetIndicators();

  if (absY > absX * 1.5) {
    if (currentY < -threshold) {
      superIndicator.style.opacity = Math.min(1, ((-currentY - threshold) / 80));
    } else if (currentY > threshold) {
      superdownIndicator.style.opacity = Math.min(1, ((currentY - threshold) / 80));
    }
  } else if (currentX > threshold) {
    likeIndicator.style.opacity = Math.min(1, ((currentX - threshold) / 80));
    if (glowLike) glowLike.style.opacity = Math.min(0.6, ((currentX - threshold) / 120));
  } else if (currentX < -threshold) {
    dislikeIndicator.style.opacity = Math.min(1, ((-currentX - threshold) / 80));
    if (glowDislike) glowDislike.style.opacity = Math.min(0.6, ((-currentX - threshold) / 120));
  }
}

function onDragEnd(e) {
  if (!isDragging) return;
  isDragging = false;

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);

  const topCard = cardStack.querySelector('.card-1');
  if (!topCard) return;

  topCard.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  resetIndicators();

  const threshold = 80;
  const absX = Math.abs(currentX);
  const absY = Math.abs(currentY);

  if (absY > absX * 1.5) {
    if (currentY < -threshold) {
      swipeCard('superlike');
      return;
    } else if (currentY > threshold) {
      swipeCard('superDislike');
      return;
    }
  } else {
    if (currentX > threshold) {
      swipeCard('like');
      return;
    } else if (currentX < -threshold) {
      swipeCard('dislike');
      return;
    }
  }

  // Snap back
  topCard.style.transform = 'translate(0, 0) rotate(0deg)';
}

function handleDoubleTap(e) {
  const now = Date.now();
  if (now - lastTap < 300) {
    swipeCard('superlike');
  }
  lastTap = now;
}

function handleDoubleClick() {
  swipeCard('superlike');
}

// ==========================================
//  SWIPE ACTIONS
// ==========================================
function swipeCard(action) {
  const topCard = cardStack.querySelector('.card-1');
  if (!topCard) return;

  const careerId = topCard.dataset.id;
  const career = cardQueue[0];

  // Remove drag listeners
  const newCard = topCard.cloneNode(true);
  topCard.parentNode.replaceChild(newCard, topCard);

  // Animate out
  newCard.style.transition = 'none';
  
  let animClass = '';
  let indicatorEl = null;

  switch (action) {
    case 'like':
      animClass = 'card-fly-right';
      indicatorEl = likeIndicator;
      break;
    case 'dislike':
      animClass = 'card-fly-left';
      indicatorEl = dislikeIndicator;
      break;
    case 'superlike':
      animClass = 'card-fly-up';
      indicatorEl = superIndicator;
      break;
    case 'superDislike':
      animClass = 'card-fly-down';
      indicatorEl = superdownIndicator;
      break;
  }

  // Flash indicator
  if (indicatorEl) {
    indicatorEl.style.opacity = '1';
    setTimeout(() => { indicatorEl.style.opacity = '0'; }, 400);
  }

  newCard.classList.add(animClass);
  
  // Record swipe
  swipeHistory.push({ careerId, action });
  cardQueue.shift();
  
  // Update counter
  const swiped = totalCards - cardQueue.length;
  swipeCountEl.textContent = swiped;

  // Remove card and re-render after animation
  setTimeout(() => {
    newCard.remove();

    if (cardQueue.length === 0) {
      showResults();
    } else {
      // Promote remaining cards
      updateCardStack();
      // Add new card at bottom if available
      if (cardQueue.length >= 3) {
        const newCardEl = createCard(cardQueue[2], 2);
        cardStack.appendChild(newCardEl);
      }
      // Re-attach to new top card
      attachDragListeners();
    }
  }, 480);
}

function updateCardStack() {
  const cards = cardStack.querySelectorAll('.swipe-card');
  cards.forEach((card, i) => {
    card.className = `swipe-card card-${i + 1}`;
  });
}

function resetIndicators() {
  likeIndicator.style.opacity = '0';
  dislikeIndicator.style.opacity = '0';
  superIndicator.style.opacity = '0';
  superdownIndicator.style.opacity = '0';
}

// ==========================================
//  BUTTON ACTIONS
// ==========================================
document.getElementById('btn-like').addEventListener('click', () => swipeCard('like'));
document.getElementById('btn-dislike').addEventListener('click', () => swipeCard('dislike'));
document.getElementById('btn-superlike').addEventListener('click', () => swipeCard('superlike'));
document.getElementById('btn-superdown').addEventListener('click', () => swipeCard('superDislike'));

document.getElementById('info-btn').addEventListener('click', () => {
  document.getElementById('info-modal').classList.remove('hidden');
});

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('info-modal').classList.add('hidden');
});

document.getElementById('info-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('info-modal')) {
    document.getElementById('info-modal').classList.add('hidden');
  }
});

// ==========================================
//  RESULTS PAGE
// ==========================================
function showResults() {
  app.classList.add('hidden');
  resultsPage.classList.remove('hidden');

  resultsContainer.innerHTML = `
    <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
      <div>Analyzing your preferences...</div>
    </div>
  `;

  // Always compute client-side — avoids server-state issues entirely
  setTimeout(() => {
    const recs = computeLocalRecommendations();
    renderResults(recs);
  }, 900);
}

function computeLocalRecommendations() {
  const likedTags = {};
  const likedClusters = {};
  
  swipeHistory.forEach(({ careerId, action }) => {
    const career = careers.find(c => c._id === careerId);
    if (!career) return;
    const w = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -3 : -1;
    career.tags.forEach(t => { likedTags[t] = (likedTags[t] || 0) + w; });
    likedClusters[career.cluster] = (likedClusters[career.cluster] || 0) + w;
  });

  // Score ALL careers — don't filter out swiped ones
  // (user may have swiped all cards, so nothing would remain otherwise)
  const superDislikedIds = swipeHistory
    .filter(s => s.action === 'superDislike')
    .map(s => s.careerId);

  const pool = superDislikedIds.length < careers.length
    ? careers.filter(c => !superDislikedIds.includes(c._id))
    : careers; // fallback: if everything was super-disliked, use all

  const scored = pool
    .map(c => {
      let score = 0;
      c.tags.forEach(t => score += likedTags[t] || 0);
      score += (likedClusters[c.cluster] || 0) * 2;
      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Nuclear fallback: should never be empty
  return scored.length > 0 ? scored : careers.slice(0, 3);
}

function computeMatchScore(career) {
  const likedTags = {};
  const likedClusters = {};
  
  swipeHistory.forEach(({ careerId, action }) => {
    const c = careers.find(x => x._id === careerId);
    if (!c) return;
    const w = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -2 : -0.5;
    c.tags.forEach(t => { likedTags[t] = (likedTags[t] || 0) + w; });
    likedClusters[c.cluster] = (likedClusters[c.cluster] || 0) + w;
  });

  let score = 0;
  let maxScore = 0;

  career.tags.forEach(t => {
    const tagMax = Math.max(...Object.values(likedTags).filter(v => v > 0), 1);
    maxScore += tagMax;
    score += Math.max(0, likedTags[t] || 0);
  });

  const clusterMax = Math.max(...Object.values(likedClusters).filter(v => v > 0), 1);
  maxScore += clusterMax * 2;
  score += Math.max(0, (likedClusters[career.cluster] || 0)) * 2;

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50 + Math.floor(Math.random() * 30);
  return Math.min(99, Math.max(60, pct));
}

const rankLabels = ['🥇 Best Match', '🥈 Great Fit', '🥉 Good Match'];
const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

function renderResults(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤔</div>
        <h3>Not enough data</h3>
        <p>Try swiping more cards!</p>
      </div>`;
    return;
  }

  resultsContainer.innerHTML = recommendations.map((career, i) => {
    const matchPct = computeMatchScore(career);
    const pathHTML = (career.studyPath || []).slice(0, 4).map((step, j, arr) => `
      <span class="path-step">${step}</span>${j < arr.length - 1 ? '<span class="path-arrow">→</span>' : ''}
    `).join('');

    const linkedinHTML = (career.linkedinProfiles || []).map(p => `
      <a class="linkedin-profile" href="${p.url}" target="_blank" rel="noopener">
        <img class="linkedin-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.src='https://i.pravatar.cc/150?img=${Math.floor(Math.random()*40)}'"/>
        <div class="linkedin-info">
          <div class="linkedin-name">${p.name}</div>
          <div class="linkedin-role">${p.title}</div>
        </div>
        <div class="linkedin-icon">in</div>
      </a>
    `).join('');

    const tagHTML = (career.tags || []).map(t => `<span class="result-tag">${t}</span>`).join('');

    return `
      <div class="result-card">
        <div class="result-card-hero">
          <img class="result-card-img" 
               src="${career.imageUrl}" 
               alt="${career.title}"
               onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'"/>
          <div class="result-card-hero-overlay"></div>
          <div class="result-rank ${rankClasses[i]}">${rankLabels[i]}</div>
          <div class="match-score">${matchPct}%<span> match</span></div>
        </div>
        <div class="result-card-body">
          <div class="result-card-top">
            <h2 class="result-title">${career.title}</h2>
            <span class="result-salary-badge">${career.avgSalary || 'Market Rate'}</span>
          </div>
          
          <div class="result-growth">
            <span class="growth-badge">↑ ${career.growth || '20%'}</span>
            <span class="growth-label">job market growth</span>
          </div>

          <p class="result-description">${career.description}</p>

          <div class="result-tags">${tagHTML}</div>

          <div class="result-path-label">🗺️ Learning Roadmap</div>
          <div class="result-path">${pathHTML}</div>

          <div class="linkedin-section">
            <div class="linkedin-label">👥 Pros in this field</div>
            <div class="linkedin-profiles">${linkedinHTML}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
//  RESTART
// ==========================================
document.getElementById('restart-btn').addEventListener('click', () => {
  swipeHistory = [];
  careers = shuffleArray([...careers]);
  cardQueue = [...careers];
  currentIndex = 0;

  resultsPage.classList.add('hidden');
  app.classList.remove('hidden');

  swipeCountEl.textContent = '0';
  renderCards();
  attachDragListeners();
});

// ==========================================
//  UTILS
// ==========================================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==========================================
//  START
// ==========================================
init();

// ==========================================
//  PWA — Register Service Worker
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SwipePath SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });

  // Show install prompt on Android
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show a subtle install banner after 3 swipes
    setTimeout(() => {
      if (deferredPrompt) showInstallBanner(deferredPrompt);
    }, 5000);
  });
}

function showInstallBanner(prompt) {
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `
    <div style="
      position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
      background:linear-gradient(135deg,#7c3aed,#06b6d4);
      color:#fff; padding:0.7rem 1.2rem;
      border-radius:99px; z-index:999;
      display:flex; align-items:center; gap:0.6rem;
      font-family:'Syne',sans-serif; font-weight:600; font-size:0.85rem;
      box-shadow:0 8px 30px rgba(124,58,237,0.5);
      cursor:pointer; white-space:nowrap;
      animation: fadeInUp 0.4s ease both;
    ">
      📲 Install SwipePath App
      <span style="opacity:0.7;font-size:0.75rem;font-weight:400">Free</span>
    </div>
  `;
  banner.querySelector('div').addEventListener('click', async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    banner.remove();
  });
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 8000);
}