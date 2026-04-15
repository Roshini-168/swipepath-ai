// ==========================================
//  SwipePath AI — App v3 (all fixes)
// ==========================================

// ── STATE ──
let currentUser = null;
let userProfile = {};
let careers = [];
let allCareers = [];           // full pool, never mutated
let cardQueue = [];
let swipeHistory = [];
let quizHistory = [];
let quizAttempt = 0;           // tracks how many times quiz taken
let totalCards = 0;
let onboardingStep = 1;
let onboardingAnswers = { hobbies: [] };
let isDragging = false;
let startX = 0, startY = 0, currentX = 0, currentY = 0;
let lastTap = 0;

// ── DOM ──
const splash = document.getElementById('splash');
const authScreen = document.getElementById('auth-screen');
const onboardingScreen = document.getElementById('onboarding-screen');
const mainApp = document.getElementById('main-app');

// ==========================================
//  INIT
// ==========================================
window.addEventListener('load', async () => {
  // Load careers (no interests yet — loaded fresh after onboarding)
  try {
    const res = await fetch('/api/careers');
    allCareers = await res.json();
    careers = [...allCareers];
  } catch {
    allCareers = getFallbackCareers();
    careers = [...allCareers];
  }

  // Check saved session
  const saved = localStorage.getItem('swipepath_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    userProfile = JSON.parse(localStorage.getItem('swipepath_profile') || '{}');
    quizHistory = JSON.parse(localStorage.getItem('swipepath_history') || '[]');
    quizAttempt = quizHistory.length;
  }

  setTimeout(() => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      splash.classList.add('hidden');
      if (currentUser) {
        // Reload careers sorted by user interests
        loadCareersForUser().then(showMainApp);
      } else {
        authScreen.classList.remove('hidden');
      }
    }, 500);
  }, 2400);
});

// Load careers sorted by user's interests
async function loadCareersForUser() {
  const interests = (userProfile.hobbies || []).join(',');
  try {
    const res = await fetch('/api/careers' + (interests ? `?interests=${encodeURIComponent(interests)}` : ''));
    allCareers = await res.json();
    careers = [...allCareers];
  } catch {
    // keep existing
  }
}

// ==========================================
//  AUTH
// ==========================================
function switchAuthTab(tab) {
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('signin-form').classList.toggle('hidden', tab !== 'signin');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

function handleSignIn() {
  const email = document.getElementById('signin-email').value.trim();
  const pass = document.getElementById('signin-password').value;
  if (!email || !pass) return showToast('Please fill all fields');

  const existing = localStorage.getItem('swipepath_user_' + email);
  if (!existing) return showToast('Account not found — please sign up');

  const stored = JSON.parse(existing);
  if (stored.password !== pass) return showToast('Incorrect password');

  currentUser = { email, name: stored.name };
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));
  userProfile = JSON.parse(localStorage.getItem('swipepath_profile_' + email) || '{}');
  localStorage.setItem('swipepath_profile', JSON.stringify(userProfile));
  quizHistory = JSON.parse(localStorage.getItem('swipepath_history_' + email) || '[]');
  localStorage.setItem('swipepath_history', JSON.stringify(quizHistory));
  quizAttempt = quizHistory.length;

  authScreen.classList.add('hidden');
  loadCareersForUser().then(showMainApp);
}

function handleSignUp() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-password').value;
  if (!name || !email || !pass) return showToast('Please fill all fields');
  if (pass.length < 6) return showToast('Password must be at least 6 characters');

  currentUser = { email, name };
  localStorage.setItem('swipepath_user_' + email, JSON.stringify({ name, password: pass }));
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));

  authScreen.classList.add('hidden');
  startOnboarding();
}

// ── GUEST LOGIN ──
function handleGuestLogin() {
  currentUser = { email: 'guest@swipepath.ai', name: 'Explorer', isGuest: true };
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));
  authScreen.classList.add('hidden');
  // Guest also gets onboarding — always show it fresh for guests
  startOnboarding();
}

function handleGoogleAuth() {
  const name = 'Demo User';
  const email = 'demo@swipepath.ai';
  currentUser = { email, name, isGoogle: true };
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));

  const existing = localStorage.getItem('swipepath_profile_' + email);
  if (existing) {
    userProfile = JSON.parse(existing);
    localStorage.setItem('swipepath_profile', JSON.stringify(userProfile));
    quizHistory = JSON.parse(localStorage.getItem('swipepath_history_' + email) || '[]');
    localStorage.setItem('swipepath_history', JSON.stringify(quizHistory));
    quizAttempt = quizHistory.length;
    authScreen.classList.add('hidden');
    loadCareersForUser().then(showMainApp);
  } else {
    authScreen.classList.add('hidden');
    startOnboarding();
  }
}

function handleSignOut() {
  // Don't wipe guest data, but clear session
  localStorage.removeItem('swipepath_user');
  currentUser = null;
  userProfile = {};
  quizHistory = [];
  quizAttempt = 0;
  mainApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  switchAuthTab('signin');
  showToast('Signed out successfully');
}

// ==========================================
//  ONBOARDING
// ==========================================
function startOnboarding() {
  onboardingStep = 1;
  onboardingAnswers = { hobbies: [] };
  onboardingScreen.classList.remove('hidden');
  updateOnboardingUI();
}

function selectOption(btn, field, value) {
  btn.closest('.options-grid').querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  onboardingAnswers[field] = value;
  document.getElementById('onboarding-next').disabled = false;
}

function toggleMulti(btn, field, value) {
  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    onboardingAnswers[field] = (onboardingAnswers[field] || []).filter(v => v !== value);
  } else {
    const current = onboardingAnswers[field] || [];
    if (current.length >= 3) return showToast('Pick up to 3 interests');
    btn.classList.add('selected');
    onboardingAnswers[field] = [...current, value];
  }
  document.getElementById('onboarding-next').disabled = (onboardingAnswers[field] || []).length === 0;
}

function onboardingNext() {
  if (onboardingStep < 5) {
    onboardingStep++;
    updateOnboardingUI();
  } else {
    finishOnboarding();
  }
}

function onboardingBack() {
  if (onboardingStep > 1) {
    onboardingStep--;
    updateOnboardingUI();
  }
}

function updateOnboardingUI() {
  document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-step="${onboardingStep}"]`).classList.add('active');

  document.getElementById('onboarding-progress').style.width = ((onboardingStep / 5) * 100) + '%';
  document.getElementById('onboarding-step-label').textContent = `${onboardingStep} of 5`;
  document.getElementById('onboarding-back').style.visibility = onboardingStep > 1 ? 'visible' : 'hidden';

  const nextBtn = document.getElementById('onboarding-next');
  nextBtn.textContent = onboardingStep === 5 ? "Let's Start! 🚀" : 'Next →';

  const stepFields = ['age', 'gender', 'location', 'hobbies', 'education'];
  const field = stepFields[onboardingStep - 1];
  const hasAnswer = field === 'hobbies'
    ? (onboardingAnswers.hobbies || []).length > 0
    : !!onboardingAnswers[field];
  nextBtn.disabled = !hasAnswer;
}

async function finishOnboarding() {
  userProfile = { ...onboardingAnswers, name: currentUser.name, email: currentUser.email };
  localStorage.setItem('swipepath_profile', JSON.stringify(userProfile));
  if (!currentUser.isGuest) {
    localStorage.setItem('swipepath_profile_' + currentUser.email, JSON.stringify(userProfile));
  }
  onboardingScreen.classList.add('hidden');

  // Now load careers sorted by their chosen interests
  await loadCareersForUser();
  showMainApp();
}

// ==========================================
//  MAIN APP / DASHBOARD
// ==========================================
function showMainApp() {
  mainApp.classList.remove('hidden');
  updateDashboard();
  renderSpotlight();
  setTimeout(() => {
    const notif = document.getElementById('quiz-notification');
    if (notif) notif.style.display = 'flex';
  }, 2000);
}

function updateDashboard() {
  if (!currentUser) return;
  const name = userProfile.name || currentUser.name || 'Explorer';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning 👋' : hour < 17 ? 'Good afternoon 👋' : 'Good evening 👋';

  document.getElementById('dash-greeting').textContent = greeting;
  document.getElementById('dash-name').textContent = name;
  document.getElementById('dash-avatar').textContent = name.charAt(0).toUpperCase();

  document.getElementById('stat-quizzes').textContent = quizHistory.length;
  const totalMatches = quizHistory.reduce((a, q) => a + (q.results ? q.results.length : 0), 0);
  document.getElementById('stat-matches').textContent = totalMatches;
  document.getElementById('stat-streak').textContent = Math.min(quizHistory.length, 7) + '🔥';

  // Past matches from latest quiz
  if (quizHistory.length > 0) {
    const latest = quizHistory[quizHistory.length - 1];
    const matchesEl = document.getElementById('past-matches');
    matchesEl.innerHTML = (latest.results || []).slice(0, 3).map(r => `
      <div class="match-chip">
        <img class="match-chip-img" src="${r.imageUrl}"
          onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=60'" />
        <div class="match-chip-info">
          <div class="match-chip-title">${r.title}</div>
          <div class="match-chip-sub">${r.cluster} · ${r.avgSalary || 'Competitive'}</div>
        </div>
        <div class="match-chip-pct">${r.matchPct || '—'}%</div>
      </div>`).join('');
    document.getElementById('nav-results').style.display = 'flex';
  }

  updateProfilePage();
  updateHistoryPage();
}

function updateProfilePage() {
  if (!currentUser) return;
  const name = userProfile.name || currentUser.name || 'Explorer';
  document.getElementById('profile-avatar-big').textContent = name.charAt(0).toUpperCase();
  document.getElementById('profile-name-big').textContent = name;
  document.getElementById('profile-email-big').textContent = currentUser.isGuest ? 'Guest Account' : (currentUser.email || '');

  const items = [
    { label: 'Age Group', value: userProfile.age || '—' },
    { label: 'Gender', value: userProfile.gender || '—' },
    { label: 'Location', value: userProfile.location || '—' },
    { label: 'Education', value: userProfile.education || '—' },
    { label: 'Quizzes Taken', value: quizHistory.length },
    { label: 'Interests', value: (userProfile.hobbies || []).join(', ') || '—' },
  ];
  document.getElementById('profile-info-grid').innerHTML = items.map(i => `
    <div class="profile-info-item">
      <div class="profile-info-label">${i.label}</div>
      <div class="profile-info-value">${i.value}</div>
    </div>`).join('');
}

function updateHistoryPage() {
  const list = document.getElementById('history-list');
  if (quizHistory.length === 0) {
    list.innerHTML = `<div class="empty-matches" style="margin:2rem 1.5rem"><div style="font-size:2rem">📋</div><p>No quiz history yet</p></div>`;
    return;
  }
  list.innerHTML = [...quizHistory].reverse().map(q => `
    <div class="history-item">
      <div class="history-date">${new Date(q.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })} · Attempt #${q.attempt || 1}</div>
      <div class="history-top">Top Match: ${q.results && q.results[0] ? q.results[0].title : 'N/A'}</div>
      <div class="history-chips">
        ${(q.results || []).slice(0, 3).map(r => `<span class="history-chip">${r.title}</span>`).join('')}
      </div>
    </div>`).join('');
}

function renderSpotlight() {
  const shuffled = [...allCareers].sort(() => Math.random() - 0.5).slice(0, 6);
  document.getElementById('spotlight-scroll').innerHTML = shuffled.map(c => `
    <div class="spotlight-card" onclick="showToast('Take the quiz to explore ${c.title}!')">
      <img src="${c.imageUrl}" onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=60'" />
      <div class="spotlight-card-overlay"></div>
      <div class="spotlight-card-name">
        <div class="spotlight-card-cluster">${c.cluster}</div>
        ${c.title}
      </div>
    </div>`).join('');
}

// ==========================================
//  TAB NAVIGATION
// ==========================================
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => {
    t.classList.remove('active');
    t.classList.add('hidden');
  });
  const target = document.getElementById('tab-' + tab);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + tab);
  if (navBtn) navBtn.classList.add('active');

  const notif = document.getElementById('quiz-notification');
  if (notif) notif.style.display = tab === 'quiz' ? 'none' : 'flex';
}

function goToDashboard() {
  switchTab('dashboard');
  updateDashboard();
}

// ==========================================
//  QUIZ FLOW — SMART ROTATION
// ==========================================
function startQuizFlow() {
  document.getElementById('instructions-modal').classList.remove('hidden');
}

function closeInstructions() {
  document.getElementById('instructions-modal').classList.add('hidden');
  beginQuiz();
}

// Build a fresh card queue for this attempt:
// - Rotate which 12 careers are shown based on attempt number
// - Interest-matched careers always included
// - Rest rotated from remaining pool
function buildQuizQueue() {
  const total = allCareers.length;         // 20 careers
  const batchSize = 12;
  const interests = userProfile.hobbies || [];

  // Split: interest-matched vs others
  const matched = allCareers.filter(c =>
    (c.interests || []).some(i => interests.includes(i)) ||
    interests.length === 0
  );
  const others = allCareers.filter(c => !matched.find(m => m._id === c._id));

  // Rotate "others" based on attempt number so different ones show up
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  const rotationOffset = (quizAttempt * 4) % Math.max(others.length, 1);
  const rotated = [
    ...shuffledOthers.slice(rotationOffset),
    ...shuffledOthers.slice(0, rotationOffset)
  ];

  // Always show matched first, pad with rotated others to reach batchSize
  const shuffledMatched = [...matched].sort(() => Math.random() - 0.5);
  const queue = [
    ...shuffledMatched.slice(0, Math.min(matched.length, 8)),
    ...rotated.slice(0, batchSize)
  ];

  // Deduplicate and cap at batchSize
  const seen = new Set();
  const deduped = queue.filter(c => {
    if (seen.has(c._id)) return false;
    seen.add(c._id);
    return true;
  });

  return deduped.slice(0, batchSize);
}

function beginQuiz() {
  swipeHistory = [];
  const queue = buildQuizQueue();
  cardQueue = [...queue];
  totalCards = cardQueue.length;

  document.getElementById('swipe-count').textContent = '0';
  document.getElementById('total-count').textContent = totalCards;

  const notif = document.getElementById('quiz-notification');
  if (notif) notif.style.display = 'none';

  switchTab('quiz');
  renderCards();
}

// ==========================================
//  CARD RENDERING
// ==========================================
function renderCards() {
  const cardStack = document.getElementById('card-stack');
  cardStack.innerHTML = '';
  if (cardQueue.length === 0) { showResults(); return; }
  cardQueue.slice(0, 3).forEach((c, i) => cardStack.appendChild(createCard(c, i)));
  attachDragListeners();
}

function createCard(career, stackIndex) {
  const card = document.createElement('div');
  card.className = `swipe-card card-${stackIndex + 1}`;
  card.dataset.id = career._id;
  const tags = career.tags.slice(0, 4).map(t => `<span class="card-tag">${t}</span>`).join('');
  card.innerHTML = `
    <img class="card-image" src="${career.imageUrl}" loading="lazy"
         onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'" />
    <div class="card-gradient"></div>
    <div class="card-like-glow glow-like"></div>
    <div class="card-like-glow glow-dislike"></div>
    <div class="card-content">
      <div class="card-cluster">${career.cluster}</div>
      <h2 class="card-title">${career.title}</h2>
      <p class="card-description">${career.description}</p>
      <div class="card-tags">${tags}</div>
      <div class="card-salary">Avg: <strong>${career.avgSalary || 'Competitive'}</strong></div>
    </div>`;
  if (stackIndex === 0) card.style.animation = 'cardAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards';
  return card;
}

// ==========================================
//  DRAG/SWIPE ENGINE
// ==========================================
function attachDragListeners() {
  const top = document.getElementById('card-stack').querySelector('.card-1');
  if (!top) return;
  top.addEventListener('touchstart', onDragStart, { passive: true });
  top.addEventListener('touchmove', onDragMove, { passive: false });
  top.addEventListener('touchend', onDragEnd);
  top.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  top.addEventListener('touchend', handleDoubleTap);
  top.addEventListener('dblclick', () => swipeCard('superlike'));
}

function onDragStart(e) {
  isDragging = true;
  const p = e.touches ? e.touches[0] : e;
  startX = p.clientX; startY = p.clientY;
  currentX = 0; currentY = 0;
  const top = document.getElementById('card-stack').querySelector('.card-1');
  if (top) top.style.transition = 'none';
}

function onDragMove(e) {
  if (!isDragging) return;
  if (e.cancelable) e.preventDefault();
  const p = e.touches ? e.touches[0] : e;
  currentX = p.clientX - startX;
  currentY = p.clientY - startY;
  const top = document.getElementById('card-stack').querySelector('.card-1');
  if (!top) return;
  top.style.transform = `translate(${currentX}px,${currentY}px) rotate(${currentX * 0.08}deg)`;
  resetIndicators();
  const absX = Math.abs(currentX), absY = Math.abs(currentY), thresh = 60;
  const gL = top.querySelector('.glow-like'), gD = top.querySelector('.glow-dislike');
  if (absY > absX * 1.5) {
    if (currentY < -thresh) document.getElementById('super-indicator').style.opacity = Math.min(1, (-currentY - thresh) / 80);
    else if (currentY > thresh) document.getElementById('superdown-indicator').style.opacity = Math.min(1, (currentY - thresh) / 80);
  } else if (currentX > thresh) {
    document.getElementById('like-indicator').style.opacity = Math.min(1, (currentX - thresh) / 80);
    if (gL) gL.style.opacity = Math.min(0.6, (currentX - thresh) / 120);
  } else if (currentX < -thresh) {
    document.getElementById('dislike-indicator').style.opacity = Math.min(1, (-currentX - thresh) / 80);
    if (gD) gD.style.opacity = Math.min(0.6, (-currentX - thresh) / 120);
  }
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  const top = document.getElementById('card-stack').querySelector('.card-1');
  if (!top) return;
  top.style.transition = 'transform 0.3s ease';
  resetIndicators();
  const absX = Math.abs(currentX), absY = Math.abs(currentY), thresh = 80;
  if (absY > absX * 1.5) {
    if (currentY < -thresh) { swipeCard('superlike'); return; }
    if (currentY > thresh) { swipeCard('superDislike'); return; }
  } else {
    if (currentX > thresh) { swipeCard('like'); return; }
    if (currentX < -thresh) { swipeCard('dislike'); return; }
  }
  top.style.transform = 'translate(0,0) rotate(0deg)';
}

function handleDoubleTap() {
  const now = Date.now();
  if (now - lastTap < 300) swipeCard('superlike');
  lastTap = now;
}

function resetIndicators() {
  ['like-indicator','dislike-indicator','super-indicator','superdown-indicator']
    .forEach(id => { document.getElementById(id).style.opacity = '0'; });
}

// ==========================================
//  SWIPE ACTION
// ==========================================
function swipeCard(action) {
  const cardStack = document.getElementById('card-stack');
  const top = cardStack.querySelector('.card-1');
  if (!top) return;
  const careerId = top.dataset.id;

  const clone = top.cloneNode(true);
  top.parentNode.replaceChild(clone, top);
  clone.style.transition = 'none';

  const animMap = { like:'card-fly-right', dislike:'card-fly-left', superlike:'card-fly-up', superDislike:'card-fly-down' };
  const indMap  = { like:'like-indicator', dislike:'dislike-indicator', superlike:'super-indicator', superDislike:'superdown-indicator' };

  const ind = document.getElementById(indMap[action]);
  if (ind) { ind.style.opacity = '1'; setTimeout(() => { ind.style.opacity = '0'; }, 400); }

  clone.classList.add(animMap[action]);
  swipeHistory.push({ careerId, action });
  cardQueue.shift();
  document.getElementById('swipe-count').textContent = totalCards - cardQueue.length;

  setTimeout(() => {
    clone.remove();
    if (cardQueue.length === 0) {
      showResults();
    } else {
      updateCardStack();
      if (cardQueue.length >= 3) cardStack.appendChild(createCard(cardQueue[2], 2));
      attachDragListeners();
    }
  }, 480);
}

function updateCardStack() {
  document.getElementById('card-stack').querySelectorAll('.swipe-card')
    .forEach((c, i) => { c.className = `swipe-card card-${i + 1}`; });
}

// ── BUTTON LISTENERS ──
document.getElementById('btn-like').addEventListener('click', () => swipeCard('like'));
document.getElementById('btn-dislike').addEventListener('click', () => swipeCard('dislike'));
document.getElementById('btn-superlike').addEventListener('click', () => swipeCard('superlike'));
document.getElementById('btn-superdown').addEventListener('click', () => swipeCard('superDislike'));
document.getElementById('info-btn').addEventListener('click', () => document.getElementById('info-modal').classList.remove('hidden'));
document.getElementById('modal-close').addEventListener('click', () => document.getElementById('info-modal').classList.add('hidden'));
document.getElementById('info-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('info-modal')) document.getElementById('info-modal').classList.add('hidden');
});

// ==========================================
//  RESULTS
// ==========================================
function showResults() {
  switchTab('results');
  quizAttempt++;

  document.getElementById('results-container').innerHTML = `
    <div style="text-align:center;padding:2rem;color:var(--text-muted)">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">🤖</div>
      <div style="font-family:'Syne',sans-serif">AI analyzing your preferences...</div>
    </div>`;

  setTimeout(() => {
    const recs = computeRecommendations();
    renderResults(recs);

    const entry = {
      date: new Date().toISOString(),
      attempt: quizAttempt,
      swipeCount: swipeHistory.length,
      results: recs.map(r => ({ ...r, matchPct: computeMatchPct(r) }))
    };
    quizHistory.push(entry);
    localStorage.setItem('swipepath_history', JSON.stringify(quizHistory));
    if (currentUser && !currentUser.isGuest) {
      localStorage.setItem('swipepath_history_' + currentUser.email, JSON.stringify(quizHistory));
    }

    document.getElementById('nav-results').style.display = 'flex';
    updateDashboard();
  }, 1000);
}

function computeRecommendations() {
  const likedTags = {}, likedClusters = {};
  swipeHistory.forEach(({ careerId, action }) => {
    const c = allCareers.find(x => x._id === careerId);
    if (!c) return;
    const w = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -3 : -1;
    c.tags.forEach(t => { likedTags[t] = (likedTags[t] || 0) + w; });
    likedClusters[c.cluster] = (likedClusters[c.cluster] || 0) + w;
  });

  const superDislikedIds = swipeHistory.filter(s => s.action === 'superDislike').map(s => s.careerId);
  const pool = superDislikedIds.length < allCareers.length
    ? allCareers.filter(c => !superDislikedIds.includes(c._id))
    : allCareers;

  const scored = pool.map(c => {
    let score = 0;
    c.tags.forEach(t => score += likedTags[t] || 0);
    score += (likedClusters[c.cluster] || 0) * 2;
    return { ...c, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);

  return scored.length > 0 ? scored : allCareers.slice(0, 3);
}

function computeMatchPct(career) {
  const likedTags = {}, likedClusters = {};
  swipeHistory.forEach(({ careerId, action }) => {
    const c = allCareers.find(x => x._id === careerId);
    if (!c) return;
    const w = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -2 : -0.5;
    c.tags.forEach(t => { likedTags[t] = (likedTags[t] || 0) + w; });
    likedClusters[c.cluster] = (likedClusters[c.cluster] || 0) + w;
  });
  let score = 0, maxScore = 0;
  const tagVals = Object.values(likedTags).filter(v => v > 0);
  const tagMax = tagVals.length ? Math.max(...tagVals) : 1;
  career.tags.forEach(t => { maxScore += tagMax; score += Math.max(0, likedTags[t] || 0); });
  const clVals = Object.values(likedClusters).filter(v => v > 0);
  const clMax = clVals.length ? Math.max(...clVals) : 1;
  maxScore += clMax * 2;
  score += Math.max(0, likedClusters[career.cluster] || 0) * 2;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 65 + Math.floor(Math.random() * 20);
  return Math.min(99, Math.max(60, pct));
}

const RANKS = ['🥇 Best Match', '🥈 Great Fit', '🥉 Good Match'];
const RANK_CLS = ['rank-1', 'rank-2', 'rank-3'];

function renderResults(recs) {
  if (!recs || recs.length === 0) {
    document.getElementById('results-container').innerHTML = `
      <div class="empty-state"><div class="empty-state-icon">🤔</div>
      <h3>Not enough data</h3><p>Try swiping more cards!</p></div>`;
    return;
  }
  document.getElementById('results-container').innerHTML = recs.map((career, i) => {
    const pct = computeMatchPct(career);
    const path = (career.studyPath || []).slice(0, 4).map((s, j, a) =>
      `<span class="path-step">${s}</span>${j < a.length - 1 ? '<span class="path-arrow">→</span>' : ''}`
    ).join('');
    const tags = (career.tags || []).map(t => `<span class="result-tag">${t}</span>`).join('');
    const linkedin = (career.linkedinProfiles || []).map(p => `
      <a class="linkedin-profile" href="${p.url}" onclick="openExternalLink(event, '${p.url}')">        <img class="linkedin-avatar" src="${p.avatar}"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=7c3aed&color=fff&size=40'" />
        <div class="linkedin-info">
          <div class="linkedin-name">${p.name}</div>
          <div class="linkedin-role">${p.title}</div>
        </div>
        <div class="linkedin-icon">in</div>
      </a>`).join('');
    return `
      <div class="result-card">
        <div class="result-card-hero">
          <img class="result-card-img" src="${career.imageUrl}"
               onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'" />
          <div class="result-card-hero-overlay"></div>
          <div class="result-rank ${RANK_CLS[i]}">${RANKS[i]}</div>
          <div class="match-score">${pct}%<span> match</span></div>
        </div>
        <div class="result-card-body">
          <div class="result-card-top">
            <h2 class="result-title">${career.title}</h2>
            <span class="result-salary-badge">${career.avgSalary || 'Competitive'}</span>
          </div>
          <div class="result-growth">
            <span class="growth-badge">↑ ${career.growth || '20%'}</span>
            <span class="growth-label">job market growth</span>
          </div>
          <p class="result-description">${career.description}</p>
          <div class="result-tags">${tags}</div>
          <div class="result-path-label">🗺️ Learning Roadmap</div>
          <div class="result-path">${path}</div>
          <div class="linkedin-section">
            <div class="linkedin-label">👥 Pros in this field — tap to connect</div>
            <div class="linkedin-profiles">${linkedin}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

document.getElementById('restart-btn').addEventListener('click', () => {
  swipeHistory = [];
  beginQuiz();
});

// ==========================================
//  TOAST
// ==========================================
function showToast(msg) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  t.style.cssText = `position:fixed;top:1.5rem;left:50%;transform:translateX(-50%);background:rgba(20,20,30,0.97);color:#fff;padding:0.7rem 1.4rem;border-radius:99px;font-size:0.85rem;font-weight:500;z-index:9999;border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(10px);animation:fadeInDown 0.3s ease;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.4);`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ==========================================
//  FALLBACK CAREER DATA (if server is down)
// ==========================================
function getFallbackCareers() {
  return [
    { _id:'1', title:'AI/ML Engineer', description:'Build intelligent systems that learn from data.', tags:['Python','TensorFlow','Deep Learning','Math'], cluster:'Technology', interests:['Tech & Coding','Science & Research'], studyPath:['Python','Statistics','ML Fundamentals','Deep Learning','MLOps'], imageUrl:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80', avgSalary:'₹18-45 LPA', growth:'40%', linkedinProfiles:[{name:'Andrew Ng',title:'AI Pioneer & Coursera Co-founder',url:'https://www.linkedin.com/in/andrewyng/',avatar:'https://i.pravatar.cc/150?img=1'},{name:'Andrej Karpathy',title:'Ex-Tesla AI Director',url:'https://www.linkedin.com/in/andrej-karpathy-9a650716/',avatar:'https://i.pravatar.cc/150?img=2'}]},
    { _id:'2', title:'Product Manager', description:'Own the vision and bridge business, design, and engineering.', tags:['Strategy','Leadership','Analytics','UX'], cluster:'Business', interests:['Business & Money'], studyPath:['Business Basics','UX Research','Agile','Data Analytics','Product Strategy'], imageUrl:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80', avgSalary:'₹15-40 LPA', growth:'25%', linkedinProfiles:[{name:'Shreyas Doshi',title:'Ex-PM at Stripe, Twitter, Google',url:'https://www.linkedin.com/in/shreyasdoshi/',avatar:'https://i.pravatar.cc/150?img=4'}]},
    { _id:'3', title:'Full-Stack Developer', description:'Build complete web applications from database to UI.', tags:['React','Node.js','Databases','APIs'], cluster:'Technology', interests:['Tech & Coding'], studyPath:['HTML/CSS/JS','React','Node.js','Databases','Cloud'], imageUrl:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80', avgSalary:'₹8-30 LPA', growth:'22%', linkedinProfiles:[{name:'Dan Abramov',title:'React Core Team at Meta',url:'https://www.linkedin.com/in/dan-abramov/',avatar:'https://i.pravatar.cc/150?img=7'}]},
    { _id:'4', title:'UX/UI Designer', description:'Craft experiences that feel magical.', tags:['Figma','Prototyping','Research','Psychology'], cluster:'Design', interests:['Art & Design'], studyPath:['Design Principles','Figma','UX Research','Prototyping','Design Systems'], imageUrl:'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80', avgSalary:'₹6-25 LPA', growth:'20%', linkedinProfiles:[{name:'Julie Zhuo',title:'Ex-VP Design at Facebook',url:'https://www.linkedin.com/in/juliezhuo/',avatar:'https://i.pravatar.cc/150?img=10'}]},
    { _id:'5', title:'Cybersecurity Analyst', description:'Be the digital guardian.', tags:['Networking','Ethical Hacking','Firewalls','SIEM'], cluster:'Technology', interests:['Tech & Coding'], studyPath:['Networking','Linux','Security+','Ethical Hacking','SOC'], imageUrl:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', avgSalary:'₹10-35 LPA', growth:'33%', linkedinProfiles:[{name:'Troy Hunt',title:'Security Researcher, HaveIBeenPwned',url:'https://www.linkedin.com/in/troyhunt/',avatar:'https://i.pravatar.cc/150?img=15'}]},
    { _id:'6', title:'Data Scientist', description:'Uncover hidden patterns in massive datasets.', tags:['Python','Statistics','SQL','Visualization'], cluster:'Technology', interests:['Tech & Coding','Science & Research'], studyPath:['Statistics','Python','SQL','ML Basics','Data Storytelling'], imageUrl:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', avgSalary:'₹12-40 LPA', growth:'28%', linkedinProfiles:[{name:'Cassie Kozyrkov',title:'Chief Decision Scientist at Google',url:'https://www.linkedin.com/in/cassiekozyrkov/',avatar:'https://i.pravatar.cc/150?img=18'}]},
    { _id:'7', title:'Digital Marketer', description:'Grow brands in the digital age.', tags:['SEO','Social Media','Analytics','Content'], cluster:'Marketing', interests:['Business & Money','Writing & Media'], studyPath:['Marketing Fundamentals','SEO/SEM','Social Media','Paid Ads','Analytics'], imageUrl:'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80', avgSalary:'₹5-20 LPA', growth:'18%', linkedinProfiles:[{name:'Neil Patel',title:'Co-founder Neil Patel Digital',url:'https://www.linkedin.com/in/neilkpatel/',avatar:'https://i.pravatar.cc/150?img=19'}]},
    { _id:'8', title:'Cloud Architect', description:'Design the backbone of the internet.', tags:['AWS','Azure','DevOps','Kubernetes'], cluster:'Technology', interests:['Tech & Coding'], studyPath:['Linux','Networking','AWS/Azure','DevOps','Kubernetes'], imageUrl:'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', avgSalary:'₹20-60 LPA', growth:'35%', linkedinProfiles:[{name:'Kelsey Hightower',title:'Distinguished Engineer at Google',url:'https://www.linkedin.com/in/kelseyhightower/',avatar:'https://i.pravatar.cc/150?img=23'}]},
    { _id:'9', title:'Investment Banker', description:'Navigate high-stakes financial deals.', tags:['Finance','Excel','Valuation','M&A'], cluster:'Finance', interests:['Business & Money'], studyPath:['Financial Modeling','Accounting','Valuation','Excel/VBA','CFA'], imageUrl:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', avgSalary:'₹12-50 LPA', growth:'15%', linkedinProfiles:[{name:'Joshua Rosenbaum',title:'Author of Investment Banking Bible',url:'https://www.linkedin.com/in/joshuarosenbaum/',avatar:'https://i.pravatar.cc/150?img=27'}]},
    { _id:'10', title:'Biotech Researcher', description:'Rewrite the code of life.', tags:['Biology','Lab Skills','CRISPR','Research'], cluster:'Science', interests:['Science & Research','Helping People'], studyPath:['Molecular Biology','Biochemistry','Lab Techniques','Bioinformatics','Research'], imageUrl:'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80', avgSalary:'₹8-30 LPA', growth:'20%', linkedinProfiles:[{name:'Jennifer Doudna',title:'Nobel Laureate, CRISPR Pioneer',url:'https://www.linkedin.com/in/jennifer-doudna-81568421/',avatar:'https://i.pravatar.cc/150?img=28'}]},
    { _id:'11', title:'Game Developer', description:'Build worlds from scratch.', tags:['Unity','C#','Game Design','3D'], cluster:'Technology', interests:['Tech & Coding','Art & Design'], studyPath:['C# Basics','Unity','Game Design','3D Modeling','Publishing'], imageUrl:'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80', avgSalary:'₹6-25 LPA', growth:'16%', linkedinProfiles:[{name:'Tim Sweeney',title:'CEO & Founder of Epic Games',url:'https://www.linkedin.com/in/tim-sweeney-epicgames/',avatar:'https://i.pravatar.cc/150?img=32'}]},
    { _id:'12', title:'Entrepreneur', description:'Build something from nothing.', tags:['Vision','Leadership','Fundraising','Hustle'], cluster:'Business', interests:['Business & Money'], studyPath:['Business Basics','Lean Startup','Fundraising','Product Dev','Marketing'], imageUrl:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', avgSalary:'Unlimited', growth:'Self-determined', linkedinProfiles:[{name:'Kunal Shah',title:'Founder & CEO of CRED',url:'https://www.linkedin.com/in/kunalshah1/',avatar:'https://i.pravatar.cc/150?img=36'}]},
    { _id:'13', title:'Content Creator', description:'Build an audience around your passion.', tags:['Video Editing','Storytelling','SEO','Branding'], cluster:'Media', interests:['Writing & Media','Music & Arts'], studyPath:['Video Production','Editing','SEO & Thumbnails','Audience Growth','Monetization'], imageUrl:'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80', avgSalary:'₹2-50 LPA', growth:'30%', linkedinProfiles:[{name:'Ali Abdaal',title:'Doctor turned YouTuber & Author',url:'https://www.linkedin.com/in/aliabdaal/',avatar:'https://i.pravatar.cc/150?img=39'}]},
    { _id:'14', title:'Clinical Psychologist', description:'Heal minds and help people.', tags:['Empathy','CBT','Research','Counselling'], cluster:'Health', interests:['Helping People','Science & Research'], studyPath:['Psychology Degree','Clinical Training','CBT','Internship','Licensure'], imageUrl:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80', avgSalary:'₹5-25 LPA', growth:'22%', linkedinProfiles:[{name:'Adam Grant',title:'Organizational Psychologist, Wharton',url:'https://www.linkedin.com/in/adammgrant/',avatar:'https://i.pravatar.cc/150?img=40'}]},
    { _id:'15', title:'Fashion Designer', description:'Shape culture through clothing.', tags:['Illustration','Textiles','Trend Research','CAD'], cluster:'Creative', interests:['Art & Design','Music & Arts'], studyPath:['Fashion Illustration','Textile Design','Pattern Making','Portfolio','Fashion Business'], imageUrl:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', avgSalary:'₹4-20 LPA', growth:'12%', linkedinProfiles:[{name:'Masaba Gupta',title:'Founder House of Masaba',url:'https://www.linkedin.com/in/masaba-gupta/',avatar:'https://i.pravatar.cc/150?img=45'}]},
    { _id:'16', title:'Sports Coach', description:'Turn physical excellence into a profession.', tags:['Fitness','Nutrition','Coaching','Performance'], cluster:'Health', interests:['Sports & Fitness','Helping People'], studyPath:['Sports Science','Coaching Certification','Nutrition','Performance Analytics','Sports Management'], imageUrl:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', avgSalary:'₹4-30 LPA', growth:'18%', linkedinProfiles:[{name:'Pullela Gopichand',title:'Chief Badminton Coach, India',url:'https://www.linkedin.com/in/pullela-gopichand/',avatar:'https://i.pravatar.cc/150?img=48'}]},
    { _id:'17', title:'Music Producer', description:'Create the soundtracks of culture.', tags:['DAW','Music Theory','Mixing','Sound Design'], cluster:'Creative', interests:['Music & Arts'], studyPath:['Music Theory','DAW (Ableton/FL)','Mixing & Mastering','Sound Design','Music Business'], imageUrl:'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80', avgSalary:'₹3-40 LPA', growth:'15%', linkedinProfiles:[{name:'A.R. Rahman',title:'Oscar-winning Composer & Producer',url:'https://www.linkedin.com/in/arrahman/',avatar:'https://i.pravatar.cc/150?img=49'}]},
    { _id:'18', title:'Civil Engineer', description:'Build the physical world.', tags:['AutoCAD','Structural Analysis','Project Management','Math'], cluster:'Engineering', interests:['Science & Research'], studyPath:['Engineering Degree','AutoCAD/Revit','Structural Analysis','Site Management','PMP'], imageUrl:'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', avgSalary:'₹5-25 LPA', growth:'11%', linkedinProfiles:[{name:'Larsen & Toubro',title:"India's Largest Engineering Conglomerate",url:'https://www.linkedin.com/company/larsen-toubro/',avatar:'https://i.pravatar.cc/150?img=54'}]},
    { _id:'19', title:'Journalist / Writer', description:'Be the voice of truth.', tags:['Writing','Reporting','Research','Ethics'], cluster:'Media', interests:['Writing & Media','Helping People'], studyPath:['Journalism Degree','Beat Reporting','Investigative Journalism','Digital Media','Multimedia'], imageUrl:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', avgSalary:'₹3-20 LPA', growth:'8%', linkedinProfiles:[{name:'Barkha Dutt',title:'Senior Journalist & Founder Mojo Story',url:'https://www.linkedin.com/in/barkha-dutt/',avatar:'https://i.pravatar.cc/150?img=55'}]},
    { _id:'20', title:'Doctor / Physician', description:'Diagnose, treat, and heal patients.', tags:['Medicine','Diagnosis','Anatomy','Empathy'], cluster:'Health', interests:['Helping People','Science & Research'], studyPath:['NEET','MBBS (5.5 yrs)','Internship','PG / Specialization','Practice'], imageUrl:'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80', avgSalary:'₹8-80 LPA', growth:'18%', linkedinProfiles:[{name:'Atul Gawande',title:'Surgeon, Author & Public Health Leader',url:'https://www.linkedin.com/in/atul-gawande/',avatar:'https://i.pravatar.cc/150?img=59'}]}
  ];
}

// ==========================================
//  PWA — Service Worker
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    setTimeout(() => { if (deferredPrompt && currentUser) showInstallBanner(deferredPrompt); }, 10000);
  });
}

function showInstallBanner(prompt) {
  const b = document.createElement('div');
  b.innerHTML = `<div style="position:fixed;bottom:calc(var(--nav-h) + 16px);left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:0.65rem 1.2rem;border-radius:99px;z-index:999;display:flex;align-items:center;gap:0.5rem;font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;box-shadow:0 8px 30px rgba(124,58,237,0.5);cursor:pointer;animation:fadeInUp 0.4s ease both;">📲 Install SwipePath App</div>`;
  b.querySelector('div').onclick = async () => { prompt.prompt(); b.remove(); };
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 10000);
}

function openExternalLink(e, url) {
  e.preventDefault();

  // For PWA / mobile
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
} 