// ==========================================
//  SwipePath AI — App v4
//  Fixes: quiz rotation, micro-quizzes,
//  career personality, layout
// ==========================================

// ── STATE ──
let currentUser = null;
let userProfile = {};
let allCareers = [];
let cardQueue = [];
let swipeHistory = [];
let microQuizAnswers = {};  // personality signals from micro-quizzes
let quizHistory = [];
let quizAttempt = 0;
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
//  MICRO QUIZ QUESTIONS
// ==========================================
const MICRO_QUESTIONS = [
  { id: 'puzzles',    emoji: '🧩', q: 'Do you enjoy solving complex puzzles?',        yes: ['Technology','Science','Engineering'], no: ['Creative','Media','Health'] },
  { id: 'team',      emoji: '🤝', q: 'Do you prefer working in teams over alone?',   yes: ['Business','Health','Marketing'],    no: ['Technology','Science'] },
  { id: 'creative',  emoji: '🎨', q: 'Does creative expression energize you?',       yes: ['Design','Creative','Media'],        no: ['Finance','Engineering'] },
  { id: 'numbers',   emoji: '📊', q: 'Are you comfortable working with numbers & data?', yes: ['Finance','Technology','Science'],no: ['Creative','Media'] },
  { id: 'outdoors',  emoji: '🌿', q: 'Would you rather work outdoors than at a desk?', yes: ['Health','Science'],               no: ['Technology','Finance'] },
  { id: 'helping',   emoji: '💬', q: 'Does helping others give you deep satisfaction?',yes: ['Health','Social'],                no: ['Technology','Finance'] },
  { id: 'spotlight', emoji: '🎤', q: 'Do you enjoy being in the spotlight?',          yes: ['Media','Marketing','Creative'],    no: ['Technology','Science','Engineering'] },
  { id: 'structure', emoji: '📋', q: 'Do you thrive with clear rules & structure?',   yes: ['Finance','Engineering','Health'],  no: ['Creative','Business','Media'] },
];

// Insert micro-quiz cards after every 4 career cards
const MICRO_QUIZ_INTERVAL = 4;
let microQInserted = new Set();
let microQIdx = 0;

// ==========================================
//  CAREER PERSONALITY ENGINE
// ==========================================
const PERSONALITIES = [
  {
    id: 'creative_strategist',
    name: 'Creative Strategist',
    emoji: '🎯',
    desc: 'You think visually, solve problems with creativity, and prefer autonomy. You thrive at the intersection of art and logic.',
    positiveTraits: ['Visual Thinker', 'Autonomous', 'Innovative'],
    negativeTraits: ['Dislikes Repetition'],
    neutralTraits: ['Big-picture Focused'],
    clusters: ['Design', 'Marketing', 'Business'],
  },
  {
    id: 'tech_pioneer',
    name: 'Tech Pioneer',
    emoji: '🚀',
    desc: 'You love building things from scratch, thrive in logic-heavy environments, and are energized by problem-solving.',
    positiveTraits: ['Analytical', 'Builder', 'Detail-oriented'],
    negativeTraits: ['Avoids Ambiguity'],
    neutralTraits: ['Introvert-leaning'],
    clusters: ['Technology', 'Engineering', 'Science'],
  },
  {
    id: 'people_champion',
    name: 'People Champion',
    emoji: '🤗',
    desc: 'You draw energy from helping and connecting with others. You lead with empathy and build trust naturally.',
    positiveTraits: ['Empathetic', 'Communicative', 'Team Player'],
    negativeTraits: ['Dislikes Solitary Work'],
    neutralTraits: ['Purpose-driven'],
    clusters: ['Health', 'Social', 'Marketing'],
  },
  {
    id: 'wealth_architect',
    name: 'Wealth Architect',
    emoji: '💼',
    desc: 'You think in systems, love optimizing outcomes, and are motivated by measurable results and financial impact.',
    positiveTraits: ['Strategic', 'Results-driven', 'Competitive'],
    negativeTraits: ['Dislikes Slow Pace'],
    neutralTraits: ['Risk-aware'],
    clusters: ['Finance', 'Business'],
  },
  {
    id: 'curious_explorer',
    name: 'Curious Explorer',
    emoji: '🔬',
    desc: 'You chase understanding, ask "why" constantly, and are driven by discovery. Research and deep expertise excite you.',
    positiveTraits: ['Inquisitive', 'Patient', 'Evidence-based'],
    negativeTraits: ['Avoids Spotlight'],
    neutralTraits: ['Independent'],
    clusters: ['Science', 'Technology', 'Engineering'],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    emoji: '✍️',
    desc: 'You communicate ideas with power and emotion. Narratives, culture, and self-expression are your natural language.',
    positiveTraits: ['Expressive', 'Cultural', 'Persuasive'],
    negativeTraits: ['Dislikes Pure Data Work'],
    neutralTraits: ['Audience-aware'],
    clusters: ['Media', 'Creative', 'Marketing'],
  },
];

function computePersonality(swipes) {
  // Score each cluster from swipes
  const clusterScore = {};
  swipes.forEach(({ careerId, action }) => {
    const c = allCareers.find(x => x._id === careerId);
    if (!c) return;
    const w = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -3 : -1;
    clusterScore[c.cluster] = (clusterScore[c.cluster] || 0) + w;
  });

  // Boost clusters from micro-quiz answers
  Object.entries(microQuizAnswers).forEach(([qId, answer]) => {
    const q = MICRO_QUESTIONS.find(x => x.id === qId);
    if (!q) return;
    const boosted = answer === 'yes' ? q.yes : q.no;
    boosted.forEach(cl => { clusterScore[cl] = (clusterScore[cl] || 0) + 1.5; });
  });

  // Match personality
  const scored = PERSONALITIES.map(p => {
    let score = p.clusters.reduce((sum, cl) => sum + (clusterScore[cl] || 0), 0);
    return { ...p, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0] || PERSONALITIES[0];
}

// ==========================================
//  INIT
// ==========================================
window.addEventListener('load', async () => {
  try {
    const res = await fetch('/api/careers');
    allCareers = await res.json();
  } catch {
    allCareers = getFallbackCareers();
  }

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
        loadCareersForUser().then(showMainApp);
      } else {
        authScreen.classList.remove('hidden');
      }
    }, 500);
  }, 2400);
});

async function loadCareersForUser() {
  const interests = (userProfile.hobbies || []).join(',');
  try {
    const url = '/api/careers' + (interests ? `?interests=${encodeURIComponent(interests)}` : '');
    const res = await fetch(url);
    allCareers = await res.json();
  } catch { /* keep existing */ }
}

// ==========================================
//  AUTH
// ==========================================
function switchAuthTab(tab) {
  ['signin','signup'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById(t + '-form').classList.toggle('hidden', t !== tab);
  });
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
  if (pass.length < 6) return showToast('Password must be 6+ characters');
  currentUser = { email, name };
  localStorage.setItem('swipepath_user_' + email, JSON.stringify({ name, password: pass }));
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));
  authScreen.classList.add('hidden');
  startOnboarding();
}

function handleGuestLogin() {
  currentUser = { email: 'guest@swipepath.ai', name: 'Explorer', isGuest: true };
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));
  authScreen.classList.add('hidden');
  startOnboarding(); // guests always get onboarding
}

function handleGoogleAuth() {
  const email = 'demo@swipepath.ai';
  currentUser = { email, name: 'Demo User', isGoogle: true };
  localStorage.setItem('swipepath_user', JSON.stringify(currentUser));
  const existing = localStorage.getItem('swipepath_profile_' + email);
  if (existing) {
    userProfile = JSON.parse(existing);
    localStorage.setItem('swipepath_profile', JSON.stringify(userProfile));
    quizHistory = JSON.parse(localStorage.getItem('swipepath_history_' + email) || '[]');
    quizAttempt = quizHistory.length;
    authScreen.classList.add('hidden');
    loadCareersForUser().then(showMainApp);
  } else {
    authScreen.classList.add('hidden');
    startOnboarding();
  }
}

function handleSignOut() {
  localStorage.removeItem('swipepath_user');
  currentUser = null; userProfile = {}; quizHistory = []; quizAttempt = 0;
  mainApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  switchAuthTab('signin');
  showToast('Signed out');
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
    const cur = onboardingAnswers[field] || [];
    if (cur.length >= 3) return showToast('Pick up to 3 interests');
    btn.classList.add('selected');
    onboardingAnswers[field] = [...cur, value];
  }
  document.getElementById('onboarding-next').disabled = (onboardingAnswers[field] || []).length === 0;
}

function onboardingNext() {
  if (onboardingStep < 5) { onboardingStep++; updateOnboardingUI(); }
  else finishOnboarding();
}

function onboardingBack() {
  if (onboardingStep > 1) { onboardingStep--; updateOnboardingUI(); }
}

function updateOnboardingUI() {
  document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-step="${onboardingStep}"]`).classList.add('active');
  document.getElementById('onboarding-progress').style.width = (onboardingStep / 5 * 100) + '%';
  document.getElementById('onboarding-step-label').textContent = `${onboardingStep} of 5`;
  document.getElementById('onboarding-back').style.visibility = onboardingStep > 1 ? 'visible' : 'hidden';
  const nextBtn = document.getElementById('onboarding-next');
  nextBtn.textContent = onboardingStep === 5 ? "Let's Start! 🚀" : 'Next →';
  const fields = ['age','gender','location','hobbies','education'];
  const f = fields[onboardingStep - 1];
  const hasAnswer = f === 'hobbies' ? (onboardingAnswers.hobbies || []).length > 0 : !!onboardingAnswers[f];
  nextBtn.disabled = !hasAnswer;
}

async function finishOnboarding() {
  userProfile = { ...onboardingAnswers, name: currentUser.name, email: currentUser.email };
  localStorage.setItem('swipepath_profile', JSON.stringify(userProfile));
  if (!currentUser.isGuest) {
    localStorage.setItem('swipepath_profile_' + currentUser.email, JSON.stringify(userProfile));
  }
  onboardingScreen.classList.add('hidden');
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
    const n = document.getElementById('quiz-notification');
    if (n) n.style.display = 'flex';
  }, 2000);
}

function updateDashboard() {
  if (!currentUser) return;
  const name = userProfile.name || currentUser.name || 'Explorer';
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning 👋' : h < 17 ? 'Good afternoon 👋' : 'Good evening 👋';
  document.getElementById('dash-greeting').textContent = greeting;
  document.getElementById('dash-name').textContent = name;
  document.getElementById('dash-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('stat-quizzes').textContent = quizHistory.length;
  document.getElementById('stat-matches').textContent = quizHistory.reduce((a, q) => a + (q.results ? q.results.length : 0), 0);
  document.getElementById('stat-streak').textContent = Math.min(quizHistory.length, 7) + '🔥';

  if (quizHistory.length > 0) {
    const latest = quizHistory[quizHistory.length - 1];
    document.getElementById('past-matches').innerHTML = (latest.results || []).slice(0, 3).map(r => `
      <div class="match-chip">
        <img class="match-chip-img" src="${r.imageUrl}" onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=60'" />
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
  document.getElementById('profile-email-big').textContent = currentUser.isGuest ? 'Guest Account' : currentUser.email;
  document.getElementById('profile-info-grid').innerHTML = [
    { label: 'Age Group', value: userProfile.age || '—' },
    { label: 'Gender', value: userProfile.gender || '—' },
    { label: 'Location', value: userProfile.location || '—' },
    { label: 'Education', value: userProfile.education || '—' },
    { label: 'Quizzes Taken', value: quizHistory.length },
    { label: 'Interests', value: (userProfile.hobbies || []).join(', ') || '—' },
  ].map(i => `<div class="profile-info-item"><div class="profile-info-label">${i.label}</div><div class="profile-info-value">${i.value}</div></div>`).join('');
}

function updateHistoryPage() {
  const list = document.getElementById('history-list');
  if (quizHistory.length === 0) {
    list.innerHTML = `<div class="empty-matches" style="margin:2rem 1.25rem"><div style="font-size:2rem">📋</div><p>No quiz history yet</p></div>`;
    return;
  }
  list.innerHTML = [...quizHistory].reverse().map(q => `
    <div class="history-item">
      <div class="history-date">${new Date(q.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · Attempt #${q.attempt||1}</div>
      <div class="history-top">🏆 ${q.personality ? q.personality.name : 'Top Match'}: ${q.results&&q.results[0]?q.results[0].title:'N/A'}</div>
      <div class="history-chips">${(q.results||[]).slice(0,3).map(r=>`<span class="history-chip">${r.title}</span>`).join('')}</div>
    </div>`).join('');
}

function renderSpotlight() {
  const shuffled = [...allCareers].sort(() => Math.random() - 0.5).slice(0, 6);
  document.getElementById('spotlight-scroll').innerHTML = shuffled.map(c => `
    <div class="spotlight-card" onclick="showToast('Take the quiz to explore ${c.title}!')">
      <img src="${c.imageUrl}" onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=60'" />
      <div class="spotlight-card-overlay"></div>
      <div class="spotlight-card-name"><div class="spotlight-card-cluster">${c.cluster}</div>${c.title}</div>
    </div>`).join('');
}

// ==========================================
//  TAB NAVIGATION
// ==========================================
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
  const target = document.getElementById('tab-' + tab);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-' + tab);
  if (nb) nb.classList.add('active');
  const notif = document.getElementById('quiz-notification');
  if (notif) notif.style.display = tab === 'quiz' ? 'none' : 'flex';
}

function goToDashboard() { switchTab('dashboard'); updateDashboard(); }

// ==========================================
//  QUIZ FLOW + CARD ROTATION FIX
// ==========================================
function startQuizFlow() {
  document.getElementById('instructions-modal').classList.remove('hidden');
}

function closeInstructions() {
  document.getElementById('instructions-modal').classList.add('hidden');
  beginQuiz();
}

// KEY FIX: use a seeded shuffle so different attempts give different cards
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuizQueue() {
  const interests = userProfile.hobbies || [];
  const batchSize = 12;

  // Interest-matched careers (always prioritized)
  const matched = allCareers.filter(c =>
    interests.length === 0 || (c.interests || []).some(i => interests.includes(i))
  );
  const others = allCareers.filter(c => !matched.find(m => m._id === c._id));

  // Use attempt number as seed so each attempt shuffles differently
  const seed = Date.now() ^ (quizAttempt * 0x12345678);
  const shuffledMatched = seededShuffle(matched, seed);
  const shuffledOthers = seededShuffle(others, seed ^ 0xDEADBEEF);

  // Build queue: up to 7 matched + rest from others, all unique
  const raw = [...shuffledMatched.slice(0, 7), ...shuffledOthers];
  const seen = new Set();
  const queue = raw.filter(c => { if (seen.has(c._id)) return false; seen.add(c._id); return true; });

  return queue.slice(0, batchSize);
}

// Inject micro-quiz cards at regular intervals
function buildFullQueue(careerQueue) {
  const fullQueue = [];
  let mqCount = 0;
  const availableMQs = MICRO_QUESTIONS.filter(q => !microQInserted.has(q.id));

  careerQueue.forEach((career, idx) => {
    fullQueue.push({ type: 'career', data: career });
    // Insert micro quiz every MICRO_QUIZ_INTERVAL cards, if any available
    if ((idx + 1) % MICRO_QUIZ_INTERVAL === 0 && mqCount < availableMQs.length) {
      fullQueue.push({ type: 'micro', data: availableMQs[mqCount] });
      mqCount++;
    }
  });

  return fullQueue;
}

function beginQuiz() {
  swipeHistory = [];
  microQuizAnswers = {};
  microQIdx = 0;

  const careerQueue = buildQuizQueue();
  const fullQueue = buildFullQueue(careerQueue);
  cardQueue = fullQueue;
  totalCards = careerQueue.length; // counter shows career cards only

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

  // Show top 3 items (skip micro-quizzes for stacking, only careers stack behind)
  let rendered = 0;
  for (let i = 0; i < cardQueue.length && rendered < 3; i++) {
    const item = cardQueue[i];
    if (item.type === 'career') {
      cardStack.appendChild(createCareerCard(item.data, rendered));
      rendered++;
    } else if (i === 0 && item.type === 'micro') {
      // If top card is a micro-quiz, show it (it covers the stack)
      cardStack.appendChild(createMicroQuizCard(item.data));
      break;
    }
  }

  if (cardQueue[0].type === 'career') attachDragListeners();
}

function createCareerCard(career, stackIndex) {
  const card = document.createElement('div');
  card.className = `swipe-card card-${stackIndex + 1}`;
  card.dataset.id = career._id;
  card.dataset.type = 'career';
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

function createMicroQuizCard(question) {
  const card = document.createElement('div');
  card.className = 'micro-quiz-card';
  card.dataset.type = 'micro';
  card.dataset.qid = question.id;
  card.innerHTML = `
    <div class="mq-badge">⚡ Quick Check-in</div>
    <div class="mq-emoji">${question.emoji}</div>
    <div class="mq-question">${question.q}</div>
    <div class="mq-sub">Helps us refine your matches</div>
    <div class="mq-options">
      <button class="mq-btn yes" onclick="answerMicroQuiz('${question.id}','yes')">✓ Yes</button>
      <button class="mq-btn no"  onclick="answerMicroQuiz('${question.id}','no')">✕ No</button>
    </div>
    <button class="mq-skip" onclick="answerMicroQuiz('${question.id}','skip')">Skip →</button>`;
  return card;
}

function answerMicroQuiz(qId, answer) {
  if (answer !== 'skip') microQuizAnswers[qId] = answer;
  // Mark as inserted so it doesn't repeat
  microQInserted.add(qId);
  // Remove the micro-quiz card and advance
  cardQueue.shift();
  renderCards();
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
  startX = p.clientX; startY = p.clientY; currentX = 0; currentY = 0;
  const top = document.getElementById('card-stack').querySelector('.card-1');
  if (top) top.style.transition = 'none';
}

function onDragMove(e) {
  if (!isDragging) return;
  if (e.cancelable) e.preventDefault();
  const p = e.touches ? e.touches[0] : e;
  currentX = p.clientX - startX; currentY = p.clientY - startY;
  const top = document.getElementById('card-stack').querySelector('.card-1');
  if (!top) return;
  top.style.transform = `translate(${currentX}px,${currentY}px) rotate(${currentX * 0.08}deg)`;
  resetIndicators();
  const ax = Math.abs(currentX), ay = Math.abs(currentY), th = 60;
  const gL = top.querySelector('.glow-like'), gD = top.querySelector('.glow-dislike');
  if (ay > ax * 1.5) {
    if (currentY < -th) document.getElementById('super-indicator').style.opacity = Math.min(1, (-currentY-th)/80);
    else if (currentY > th) document.getElementById('superdown-indicator').style.opacity = Math.min(1, (currentY-th)/80);
  } else if (currentX > th) {
    document.getElementById('like-indicator').style.opacity = Math.min(1, (currentX-th)/80);
    if (gL) gL.style.opacity = Math.min(0.6, (currentX-th)/120);
  } else if (currentX < -th) {
    document.getElementById('dislike-indicator').style.opacity = Math.min(1, (-currentX-th)/80);
    if (gD) gD.style.opacity = Math.min(0.6, (-currentX-th)/120);
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
  const ax = Math.abs(currentX), ay = Math.abs(currentY), th = 80;
  if (ay > ax * 1.5) {
    if (currentY < -th) { swipeCard('superlike'); return; }
    if (currentY > th)  { swipeCard('superDislike'); return; }
  } else {
    if (currentX > th)  { swipeCard('like'); return; }
    if (currentX < -th) { swipeCard('dislike'); return; }
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

  // Update counter (only career cards count)
  const swipedCareers = swipeHistory.length;
  document.getElementById('swipe-count').textContent = swipedCareers;

  setTimeout(() => {
    clone.remove();
    if (cardQueue.length === 0) {
      showResults();
    } else {
      // Check if next item is micro-quiz
      if (cardQueue[0].type === 'micro') {
        cardStack.innerHTML = '';
        cardStack.appendChild(createMicroQuizCard(cardQueue[0].data));
      } else {
        updateCardStack();
        // Add next career card at back if available
        const nextCareerIdx = cardQueue.findIndex((item, i) => i >= 2 && item.type === 'career');
        if (nextCareerIdx !== -1) {
          cardStack.appendChild(createCareerCard(cardQueue[nextCareerIdx].data, 2));
        }
        attachDragListeners();
      }
    }
  }, 480);
}

function updateCardStack() {
  let rank = 1;
  document.getElementById('card-stack').querySelectorAll('.swipe-card').forEach(c => {
    c.className = `swipe-card card-${rank++}`;
  });
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
//  RESULTS + PERSONALITY
// ==========================================
function showResults() {
  switchTab('results');
  quizAttempt++;

  document.getElementById('results-container').innerHTML = '';
  document.getElementById('results-container').closest('.results-page').querySelector('.results-header').insertAdjacentHTML('afterend',`
    <div style="text-align:center;padding:1.5rem;color:var(--text-muted);position:relative;z-index:1">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">🤖</div>
      <div style="font-family:'Syne',sans-serif;font-size:1rem">Building your career profile...</div>
    </div>`);

  setTimeout(() => {
    // Remove loading
    const loading = document.querySelector('.results-page > div:not(.results-bg):not(.results-header):not(.results-container):not(.results-actions)');
    if (loading) loading.remove();

    const recs = computeRecommendations();
    const personality = computePersonality(swipeHistory);
    renderPersonality(personality);
    renderResults(recs);

    const entry = {
      date: new Date().toISOString(),
      attempt: quizAttempt,
      swipeCount: swipeHistory.length,
      personality: { name: personality.name, emoji: personality.emoji },
      results: recs.map(r => ({ ...r, matchPct: computeMatchPct(r) }))
    };
    quizHistory.push(entry);
    localStorage.setItem('swipepath_history', JSON.stringify(quizHistory));
    if (currentUser && !currentUser.isGuest) {
      localStorage.setItem('swipepath_history_' + currentUser.email, JSON.stringify(quizHistory));
    }
    document.getElementById('nav-results').style.display = 'flex';
    updateDashboard();
  }, 1200);
}

function renderPersonality(p) {
  const container = document.getElementById('results-container');
  const el = document.createElement('div');
  el.className = 'personality-card';
  el.innerHTML = `
    <div class="personality-header">
      <div class="personality-emoji">${p.emoji}</div>
      <div class="personality-badge-wrap">
        <div class="personality-label">🧠 Your Career Personality</div>
        <div class="personality-name">${p.name}</div>
      </div>
    </div>
    <div class="personality-desc">${p.desc}</div>
    <div class="personality-traits">
      ${p.positiveTraits.map(t => `<span class="personality-trait trait-positive">✓ ${t}</span>`).join('')}
      ${p.negativeTraits.map(t => `<span class="personality-trait trait-negative">✗ ${t}</span>`).join('')}
      ${p.neutralTraits.map(t => `<span class="personality-trait trait-neutral">◈ ${t}</span>`).join('')}
    </div>`;
  container.appendChild(el);
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

  // Boost from micro-quiz answers
  Object.entries(microQuizAnswers).forEach(([qId, ans]) => {
    const q = MICRO_QUESTIONS.find(x => x.id === qId);
    if (!q) return;
    const clusters = ans === 'yes' ? q.yes : q.no;
    clusters.forEach(cl => { likedClusters[cl] = (likedClusters[cl] || 0) + 1; });
  });

  const superDislikedIds = swipeHistory.filter(s => s.action === 'superDislike').map(s => s.careerId);
  const pool = superDislikedIds.length < allCareers.length
    ? allCareers.filter(c => !superDislikedIds.includes(c._id)) : allCareers;

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
  const tagMax = Math.max(...Object.values(likedTags).filter(v => v > 0), 1);
  career.tags.forEach(t => { maxScore += tagMax; score += Math.max(0, likedTags[t] || 0); });
  const clMax = Math.max(...Object.values(likedClusters).filter(v => v > 0), 1);
  maxScore += clMax * 2;
  score += Math.max(0, likedClusters[career.cluster] || 0) * 2;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 65 + Math.floor(Math.random() * 20);
  return Math.min(99, Math.max(62, pct));
}

const RANKS = ['🥇 Best Match', '🥈 Great Fit', '🥉 Good Match'];
const RANK_CLS = ['rank-1', 'rank-2', 'rank-3'];

function renderResults(recs) {
  const container = document.getElementById('results-container');
  if (!recs || recs.length === 0) {
    container.innerHTML += `<div class="empty-state"><div style="font-size:2rem">🤔</div><h3>Not enough data</h3><p>Try swiping more cards!</p></div>`;
    return;
  }
  recs.forEach((career, i) => {
    const pct = computeMatchPct(career);
    const path = (career.studyPath || []).slice(0, 4).map((s, j, a) =>
      `<span class="path-step">${s}</span>${j < a.length-1 ? '<span class="path-arrow">→</span>' : ''}`).join('');
    const tags = (career.tags || []).map(t => `<span class="result-tag">${t}</span>`).join('');
    const linkedin = (career.linkedinProfiles || []).map(p => `
      <a class="linkedin-profile" href="${p.url}" target="_blank" rel="noopener noreferrer"
         onclick="openExternalLink(event,'${p.url}')">
        <img class="linkedin-avatar" src="${p.avatar}"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=7c3aed&color=fff&size=40'" />
        <div class="linkedin-info">
          <div class="linkedin-name">${p.name}</div>
          <div class="linkedin-role">${p.title}</div>
        </div>
        <div class="linkedin-icon">in</div>
      </a>`).join('');

    const el = document.createElement('div');
    el.className = 'result-card';
    el.style.animationDelay = (0.3 + i * 0.15) + 's';
    el.innerHTML = `
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
      </div>`;
    container.appendChild(el);
  });
}

document.getElementById('restart-btn').addEventListener('click', () => {
  swipeHistory = [];
  microQuizAnswers = {};
  microQInserted = new Set();
  beginQuiz();
});

// ==========================================
//  TOAST
// ==========================================
function showToast(msg) {
  const old = document.getElementById('toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  t.style.cssText = `position:fixed;top:1.5rem;left:50%;transform:translateX(-50%);background:rgba(18,18,26,0.97);color:#fff;padding:0.65rem 1.3rem;border-radius:99px;font-size:0.82rem;font-weight:500;z-index:9999;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(12px);white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:fadeInDown 0.3s ease;pointer-events:none;`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 2500);
}

// ==========================================
//  LINKEDIN DEEP LINK
// ==========================================
function openExternalLink(e, url) {
  e.preventDefault();
  e.stopPropagation();
  // Try LinkedIn app deep link, fallback to browser
  const app = url.replace('https://www.linkedin.com', 'linkedin://');
  const start = Date.now();
  window.location.href = app;
  setTimeout(() => {
    if (Date.now() - start < 1500) window.open(url, '_blank');
  }, 800);
}

// ==========================================
//  FALLBACK CAREER DATA
// ==========================================
function getFallbackCareers() {
  return [
    {_id:'1',title:'AI/ML Engineer',description:'Build intelligent systems that learn from data.',tags:['Python','TensorFlow','Deep Learning','Math'],cluster:'Technology',interests:['Tech & Coding','Science & Research'],studyPath:['Python','Statistics','ML Fundamentals','Deep Learning','MLOps'],imageUrl:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',avgSalary:'₹18-45 LPA',growth:'40%',linkedinProfiles:[{name:'Andrew Ng',title:'AI Pioneer & Coursera Co-founder',url:'https://www.linkedin.com/in/andrewyng/',avatar:'https://i.pravatar.cc/150?img=1'},{name:'Andrej Karpathy',title:'Ex-Tesla AI Director',url:'https://www.linkedin.com/in/andrej-karpathy-9a650716/',avatar:'https://i.pravatar.cc/150?img=2'}]},
    {_id:'2',title:'Product Manager',description:'Own the vision and bridge business, design, and engineering.',tags:['Strategy','Leadership','Analytics','UX'],cluster:'Business',interests:['Business & Money'],studyPath:['Business Basics','UX Research','Agile','Data Analytics','Product Strategy'],imageUrl:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',avgSalary:'₹15-40 LPA',growth:'25%',linkedinProfiles:[{name:'Shreyas Doshi',title:'Ex-PM Stripe, Twitter, Google',url:'https://www.linkedin.com/in/shreyasdoshi/',avatar:'https://i.pravatar.cc/150?img=4'}]},
    {_id:'3',title:'Full-Stack Developer',description:'Build complete web applications from database to UI.',tags:['React','Node.js','Databases','APIs'],cluster:'Technology',interests:['Tech & Coding'],studyPath:['HTML/CSS/JS','React','Node.js','Databases','Cloud'],imageUrl:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',avgSalary:'₹8-30 LPA',growth:'22%',linkedinProfiles:[{name:'Dan Abramov',title:'React Core Team at Meta',url:'https://www.linkedin.com/in/dan-abramov/',avatar:'https://i.pravatar.cc/150?img=7'}]},
    {_id:'4',title:'UX/UI Designer',description:'Craft experiences that feel magical.',tags:['Figma','Prototyping','Research','Psychology'],cluster:'Design',interests:['Art & Design'],studyPath:['Design Principles','Figma','UX Research','Prototyping','Design Systems'],imageUrl:'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',avgSalary:'₹6-25 LPA',growth:'20%',linkedinProfiles:[{name:'Julie Zhuo',title:'Ex-VP Design at Facebook',url:'https://www.linkedin.com/in/juliezhuo/',avatar:'https://i.pravatar.cc/150?img=10'}]},
    {_id:'5',title:'Data Scientist',description:'Uncover hidden patterns in massive datasets.',tags:['Python','Statistics','SQL','Visualization'],cluster:'Technology',interests:['Tech & Coding','Science & Research'],studyPath:['Statistics','Python','SQL','ML Basics','Data Storytelling'],imageUrl:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',avgSalary:'₹12-40 LPA',growth:'28%',linkedinProfiles:[{name:'Cassie Kozyrkov',title:'Chief Decision Scientist, Google',url:'https://www.linkedin.com/in/cassiekozyrkov/',avatar:'https://i.pravatar.cc/150?img=18'}]},
    {_id:'6',title:'Digital Marketer',description:'Grow brands in the digital age.',tags:['SEO','Social Media','Analytics','Content'],cluster:'Marketing',interests:['Business & Money','Writing & Media'],studyPath:['Marketing','SEO/SEM','Social Media','Paid Ads','Analytics'],imageUrl:'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',avgSalary:'₹5-20 LPA',growth:'18%',linkedinProfiles:[{name:'Neil Patel',title:'Co-founder Neil Patel Digital',url:'https://www.linkedin.com/in/neilkpatel/',avatar:'https://i.pravatar.cc/150?img=19'}]},
    {_id:'7',title:'Cloud Architect',description:'Design the backbone of the internet.',tags:['AWS','Azure','DevOps','Kubernetes'],cluster:'Technology',interests:['Tech & Coding'],studyPath:['Linux','Networking','AWS/Azure','DevOps','Kubernetes'],imageUrl:'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',avgSalary:'₹20-60 LPA',growth:'35%',linkedinProfiles:[{name:'Kelsey Hightower',title:'Distinguished Engineer at Google',url:'https://www.linkedin.com/in/kelseyhightower/',avatar:'https://i.pravatar.cc/150?img=23'}]},
    {_id:'8',title:'Entrepreneur',description:'Build something from nothing.',tags:['Vision','Leadership','Fundraising','Hustle'],cluster:'Business',interests:['Business & Money'],studyPath:['Business Basics','Lean Startup','Fundraising','Product Dev','Marketing'],imageUrl:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',avgSalary:'Unlimited',growth:'Self-determined',linkedinProfiles:[{name:'Kunal Shah',title:'Founder & CEO of CRED',url:'https://www.linkedin.com/in/kunalshah1/',avatar:'https://i.pravatar.cc/150?img=36'}]},
    {_id:'9',title:'Content Creator',description:'Build an audience around your passion.',tags:['Video Editing','Storytelling','SEO','Branding'],cluster:'Media',interests:['Writing & Media','Music & Arts'],studyPath:['Video Production','Editing','SEO','Audience Growth','Monetization'],imageUrl:'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80',avgSalary:'₹2-50 LPA',growth:'30%',linkedinProfiles:[{name:'Ali Abdaal',title:'Doctor turned YouTuber & Author',url:'https://www.linkedin.com/in/aliabdaal/',avatar:'https://i.pravatar.cc/150?img=39'}]},
    {_id:'10',title:'Doctor / Physician',description:'Diagnose, treat, and heal patients.',tags:['Medicine','Diagnosis','Anatomy','Empathy'],cluster:'Health',interests:['Helping People','Science & Research'],studyPath:['NEET','MBBS (5.5 yrs)','Internship','PG / Specialization','Practice'],imageUrl:'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',avgSalary:'₹8-80 LPA',growth:'18%',linkedinProfiles:[{name:'Atul Gawande',title:'Surgeon, Author & Public Health Leader',url:'https://www.linkedin.com/in/atul-gawande/',avatar:'https://i.pravatar.cc/150?img=59'}]},
    {_id:'11',title:'Clinical Psychologist',description:'Heal minds and help people overcome challenges.',tags:['Empathy','CBT','Research','Counselling'],cluster:'Health',interests:['Helping People','Science & Research'],studyPath:['Psychology Degree','Clinical Training','CBT','Internship','Licensure'],imageUrl:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',avgSalary:'₹5-25 LPA',growth:'22%',linkedinProfiles:[{name:'Adam Grant',title:'Organizational Psychologist, Wharton',url:'https://www.linkedin.com/in/adammgrant/',avatar:'https://i.pravatar.cc/150?img=40'}]},
    {_id:'12',title:'Music Producer',description:'Create the soundtracks of culture.',tags:['DAW','Music Theory','Mixing','Sound Design'],cluster:'Creative',interests:['Music & Arts'],studyPath:['Music Theory','DAW (Ableton/FL)','Mixing','Sound Design','Music Business'],imageUrl:'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',avgSalary:'₹3-40 LPA',growth:'15%',linkedinProfiles:[{name:'A.R. Rahman',title:'Oscar-winning Composer & Producer',url:'https://www.linkedin.com/in/arrahman/',avatar:'https://i.pravatar.cc/150?img=49'}]}
  ];
}

// ==========================================
//  PWA
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    setTimeout(() => { if (deferredPrompt && currentUser) showInstallBanner(deferredPrompt); }, 12000);
  });
}
function showInstallBanner(prompt) {
  const b = document.createElement('div');
  b.innerHTML = `<div style="position:fixed;bottom:calc(var(--nav-h) + 14px);left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:0.6rem 1.1rem;border-radius:99px;z-index:999;display:flex;align-items:center;gap:0.45rem;font-family:'Syne',sans-serif;font-weight:700;font-size:0.8rem;box-shadow:0 8px 30px rgba(124,58,237,0.5);cursor:pointer;white-space:nowrap;">📲 Install SwipePath App</div>`;
  b.querySelector('div').onclick = async () => { prompt.prompt(); b.remove(); };
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 10000);
}