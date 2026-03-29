/* =========================================================
   Empty Your Mind — Interactive Meditation Experience
   ========================================================= */

// ── State ──────────────────────────────────────────────────
const state = {
  eyesClosed: false,
  level: 1,
  lookCount: 0,
  closedTime: 0,         // ms eyes have been closed this level
  totalClosedTime: 0,    // cumulative ms
  lastTimestamp: null,
  levelFails: 0,         // consecutive opens at same level
  maxFails: 10,          // opens before "gave up"
  running: false,
  usingCamera: false,
  completed: false,
  gaveUp: false,
};

const LEVELS = [
  null, // 1-indexed
  {
    name: 'Level 1 — Small Desires (소욕)',
    duration: 8000,
    temptations: [
      '1 new notification',
      'someone liked your photo',
      'free shipping ending soon',
      'new message received',
      'breaking news alert',
    ],
    emojis: ['✨', '💎', '❄️'],
    particleCount: 150,
    temptationInterval: 2500,
    emojiInterval: 1800,
    colors: { sparkle: 'rgba(255,255,255,0.9)', accent: '#C9B8E8' },
  },
  {
    name: 'Level 2 — Social Hunger (갈애)',
    duration: 12000,
    temptations: [
      'your crush is typing...',
      'you were mentioned in a story',
      '47 unread messages',
      'someone screenshot your post',
      '♥ ♥ ♥ ♥ ♥',
      'new follower request',
      'they posted a story 2m ago',
    ],
    emojis: ['❤️', '🦋', '💬', '✨', '🌈'],
    particleCount: 250,
    temptationInterval: 1800,
    emojiInterval: 1200,
    colors: { sparkle: 'rgba(255,200,255,0.9)', accent: '#FFE4F3' },
  },
  {
    name: 'Level 3 — Material World (물질)',
    duration: 15000,
    temptations: [
      'SALE: 70% off everything',
      '$2,847 deposited into your account',
      'You won a free trip to Bali',
      'Limited edition — only 3 left',
      'Your package has shipped',
      'Congratulations! You\'ve been selected',
      'Luxury awaits — claim your reward',
    ],
    emojis: ['💰', '💎', '🏰', '🦄', '👑', '✨', '🌙'],
    particleCount: 320,
    temptationInterval: 1400,
    emojiInterval: 800,
    colors: { sparkle: 'rgba(255,215,0,0.8)', accent: '#FFD700' },
  },
  {
    name: 'Level 4 — Ego (아만)',
    duration: 20000,
    temptations: [
      'Everyone is watching your story',
      'You went viral — 2.4M views',
      'They said you\'re the most talented one',
      'You were right all along',
      'Standing ovation — they love you',
      'You\'re the main character',
      '"I wish I were you"',
      'You\'re irreplaceable',
    ],
    emojis: ['👑', '💎', '✨', '🌟', '🏰', '🦋', '🌈', '🔮', '💫'],
    particleCount: 400,
    temptationInterval: 1000,
    emojiInterval: 500,
    colors: { sparkle: 'rgba(255,215,0,1)', accent: '#ff9ff3' },
  },
  {
    name: 'Level 5 — The Final Temptation (마지막 유혹)',
    duration: 25000,
    temptations: [
      'Open your eyes. You\'re missing everything.',
    ],
    emojis: [],
    particleCount: 0,
    temptationInterval: 8000,
    emojiInterval: 99999,
    colors: { sparkle: 'rgba(200,200,220,0.3)', accent: '#16213e' },
  },
];

// ── DOM Refs ───────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const landing        = $('#landing');
const experience     = $('#experience');
const ending         = $('#ending');
const beginBtn       = $('#beginBtn');
const samsaraLayer   = $('#samsaraLayer');
const emptinessLayer = $('#emptinessLayer');
const samsaraCanvas  = $('#samsaraCanvas');
const emptinessCanvas= $('#emptinessCanvas');
const temptationTexts= $('#temptationTexts');
const floatingEmojis = $('#floatingEmojis');
const ensoEl         = $('#enso');
const breathingText  = $('#breathingText');
const levelDisplay   = $('#levelDisplay');
const lookCountEl    = $('#lookCount');
const progressBar    = $('#progressBar');
const progressFill   = $('#progressFill');
const webcamEl       = $('#webcam');
const fallbackControls = $('#fallbackControls');
const toggleEyesBtn  = $('#toggleEyesBtn');
const cameraNote     = $('#cameraNote');

// ── Canvas Setup ───────────────────────────────────────────
const sCtx = samsaraCanvas.getContext('2d');
const eCtx = emptinessCanvas.getContext('2d');
let W, H;

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  samsaraCanvas.width = W;
  samsaraCanvas.height = H;
  emptinessCanvas.width = W;
  emptinessCanvas.height = H;
}
window.addEventListener('resize', resize);
resize();

// ── Particle Systems ───────────────────────────────────────
let samsaraParticles = [];
let emptinessStars = [];

function createSamsaraParticles(count) {
  samsaraParticles = [];
  for (let i = 0; i < count; i++) {
    samsaraParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.3 + 0.1,
      size: Math.random() * 3 + 1,
      opacity: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
      hue: Math.random() * 60 + 280,  // purple-pink range
    });
  }
}

function createEmptinessStars() {
  emptinessStars = [];
  for (let i = 0; i < 50; i++) {
    emptinessStars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.005 + 0.002,
    });
  }
}

let samsaraAlpha = 1;
let emptinessAlpha = 0;

function drawSamsaraParticles(time) {
  sCtx.clearRect(0, 0, W, H);
  const level = LEVELS[state.level];
  if (!level) return;

  for (const p of samsaraParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.phase += p.speed;
    const twinkle = (Math.sin(p.phase) + 1) / 2;

    if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;

    const alpha = twinkle * 0.8 * samsaraAlpha;
    if (state.level <= 2) {
      sCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    } else if (state.level === 3) {
      sCtx.fillStyle = `rgba(255, ${200 + Math.floor(twinkle * 55)}, ${Math.floor(twinkle * 100)}, ${alpha})`;
    } else {
      sCtx.fillStyle = `hsla(${p.hue + time * 0.01}, 80%, 80%, ${alpha})`;
    }

    sCtx.beginPath();
    // Draw as a 4-pointed star
    const s = p.size * (0.7 + twinkle * 0.6);
    sCtx.moveTo(p.x, p.y - s);
    sCtx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
    sCtx.lineTo(p.x + s, p.y);
    sCtx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
    sCtx.lineTo(p.x, p.y + s);
    sCtx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
    sCtx.lineTo(p.x - s, p.y);
    sCtx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
    sCtx.closePath();
    sCtx.fill();

    // Glow
    if (s > 2) {
      sCtx.shadowBlur = s * 3;
      sCtx.shadowColor = sCtx.fillStyle;
      sCtx.fill();
      sCtx.shadowBlur = 0;
    }
  }
}

function drawEmptinessStars(time) {
  eCtx.clearRect(0, 0, W, H);
  for (const s of emptinessStars) {
    s.phase += s.speed;
    const twinkle = (Math.sin(s.phase) + 1) / 2;
    const alpha = twinkle * 0.4 * emptinessAlpha;
    eCtx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
    eCtx.beginPath();
    eCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    eCtx.fill();
  }
}

// ── Enso SVG ───────────────────────────────────────────────
function createEnsoSVG(container) {
  container.innerHTML = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path class="enso-path"
        d="M 100 30 C 140 30, 175 60, 175 100 C 175 140, 140 175, 100 175 C 60 175, 25 140, 25 100 C 25 60, 55 30, 90 35"
      />
    </svg>`;
}

// ── Audio (Web Audio API) ──────────────────────────────────
let audioCtx;
let samsaraGain, emptinessGain, masterGain;
let samsaraDrone, bowlTimeout;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);

  // Samsara ambient drone
  samsaraGain = audioCtx.createGain();
  samsaraGain.gain.value = 0;
  samsaraGain.connect(masterGain);

  // Create ethereal drone
  const freqs = [220, 277.18, 329.63, 440];
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = audioCtx.createGain();
    g.gain.value = 0.06 - i * 0.01;

    // Slow detune for shimmer
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.1 + i * 0.05;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    lfo.start();

    osc.connect(g);
    g.connect(samsaraGain);
    osc.start();
  });

  // Emptiness gain node
  emptinessGain = audioCtx.createGain();
  emptinessGain.gain.value = 0;
  emptinessGain.connect(masterGain);
}

function playSingingBowl() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  // Fundamental + harmonics
  [200, 400, 600].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = audioCtx.createGain();
    const vol = 0.15 / (i + 1);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 6);
    osc.connect(g);
    g.connect(emptinessGain);
    osc.start(now);
    osc.stop(now + 6);
  });
}

function playChime() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.5);
}

function playWhoosh(direction) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const noise = audioCtx.createBufferSource();
  const bufferSize = audioCtx.sampleRate * 1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = direction === 'in' ? 300 : 800;
  filter.Q.value = 1;

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.06, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(now);
  noise.stop(now + 1);
}

// ── Temptation & Emoji Spawners ────────────────────────────
let temptationTimer = null;
let emojiTimer = null;

function spawnTemptation() {
  const level = LEVELS[state.level];
  if (!level || state.eyesClosed) return;

  const text = level.temptations[Math.floor(Math.random() * level.temptations.length)];
  const el = document.createElement('div');
  el.className = 'temptation';

  if (Math.random() > 0.6) el.classList.add('golden');
  if (Math.random() > 0.8) el.classList.add('blurred');

  const fontSize = 0.9 + Math.random() * 1.2;
  el.style.fontSize = fontSize + 'rem';

  const startY = Math.random() * (H - 100) + 50;
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -300 : W + 50;
  const endX = fromLeft ? W + 300 : -500;
  const endY = startY + (Math.random() - 0.5) * 100;
  const rotation = (Math.random() - 0.5) * 15;
  const duration = 8 + Math.random() * 6;

  el.style.setProperty('--startX', startX + 'px');
  el.style.setProperty('--startY', startY + 'px');
  el.style.setProperty('--endX', endX + 'px');
  el.style.setProperty('--endY', endY + 'px');
  el.style.setProperty('--rotation', rotation + 'deg');
  el.style.setProperty('--float-duration', duration + 's');
  el.style.top = '0';
  el.style.left = '0';
  el.textContent = text;

  temptationTexts.appendChild(el);
  setTimeout(() => el.remove(), duration * 1000);
}

function spawnEmoji() {
  const level = LEVELS[state.level];
  if (!level || level.emojis.length === 0 || state.eyesClosed) return;

  const emoji = level.emojis[Math.floor(Math.random() * level.emojis.length)];
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;

  const size = 1.2 + Math.random() * 2;
  const x = Math.random() * (W - 60) + 30;
  const duration = 5 + Math.random() * 5;
  const spin = (Math.random() - 0.5) * 360;

  el.style.left = x + 'px';
  el.style.bottom = '-50px';
  el.style.setProperty('--size', size + 'rem');
  el.style.setProperty('--duration', duration + 's');
  el.style.setProperty('--spin', spin + 'deg');

  floatingEmojis.appendChild(el);
  setTimeout(() => el.remove(), duration * 1000);
}

function startSpawners() {
  stopSpawners();
  const level = LEVELS[state.level];
  if (!level) return;
  temptationTimer = setInterval(spawnTemptation, level.temptationInterval);
  emojiTimer = setInterval(spawnEmoji, level.emojiInterval);
  // Spawn a few immediately
  for (let i = 0; i < 3; i++) { spawnTemptation(); spawnEmoji(); }
}

function stopSpawners() {
  clearInterval(temptationTimer);
  clearInterval(emojiTimer);
}

// ── State Transitions ──────────────────────────────────────
function setEyesClosed(closed) {
  if (closed === state.eyesClosed) return;
  state.eyesClosed = closed;

  if (closed) {
    // Transition to Emptiness
    transitionToEmptiness();
  } else {
    // Transition to Samsara
    transitionToSamsara();
  }
}

function transitionToEmptiness() {
  emptinessLayer.style.opacity = '1';
  samsaraAlpha = 0;
  emptinessAlpha = 1;
  stopSpawners();

  // Fade out existing temptations/emojis
  temptationTexts.querySelectorAll('.temptation').forEach(el => {
    el.style.transition = 'opacity 2s ease';
    el.style.opacity = '0';
  });
  floatingEmojis.querySelectorAll('.floating-emoji').forEach(el => {
    el.style.transition = 'opacity 2s ease';
    el.style.opacity = '0';
  });

  // Show enso
  createEnsoSVG(ensoEl);
  ensoEl.style.opacity = '1';
  setTimeout(() => ensoEl.querySelector('svg').classList.add('enso-drawing'), 100);
  breathingText.style.opacity = '1';

  // HUD dark mode
  document.querySelectorAll('.hud-item').forEach(el => el.classList.add('dark'));
  progressBar.classList.add('dark');
  progressFill.classList.add('dark');

  // Audio
  if (audioCtx) {
    samsaraGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
    emptinessGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1);
    playSingingBowl();
    playWhoosh('out');
  }

  state.lastTimestamp = performance.now();
}

function transitionToSamsara() {
  emptinessLayer.style.opacity = '0';
  samsaraAlpha = 1;
  emptinessAlpha = 0;
  ensoEl.style.opacity = '0';
  breathingText.style.opacity = '0';

  // Reset closed timer for this attempt (keeps progress if partial)
  state.closedTime = 0;

  // Increment look count
  state.lookCount++;
  state.levelFails++;
  lookCountEl.textContent = `👁 You looked: ${state.lookCount}`;

  // HUD light mode
  document.querySelectorAll('.hud-item').forEach(el => el.classList.remove('dark'));
  progressBar.classList.remove('dark');
  progressFill.classList.remove('dark');

  // Update particle count for level
  const level = LEVELS[state.level];
  if (level) createSamsaraParticles(level.particleCount);
  startSpawners();

  // Audio
  if (audioCtx) {
    samsaraGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.5);
    emptinessGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
    playWhoosh('in');
    playChime();
  }

  // Check if gave up
  if (state.levelFails >= state.maxFails) {
    state.gaveUp = true;
    endExperience();
  }
}

// ── Level Management ───────────────────────────────────────
function advanceLevel() {
  state.level++;
  state.closedTime = 0;
  state.levelFails = 0;

  if (state.level > 5) {
    state.completed = true;
    endExperience();
    return;
  }

  const level = LEVELS[state.level];
  levelDisplay.textContent = level.name;
  progressFill.style.width = '0%';

  // Update samsara class
  samsaraLayer.className = `layer samsara-bg level-${state.level}`;

  // Brief celebration — flash of light
  if (audioCtx) playSingingBowl();
}

// ── Main Loop ──────────────────────────────────────────────
function gameLoop(time) {
  if (!state.running) return;

  drawSamsaraParticles(time);
  drawEmptinessStars(time);

  // Track closed time
  if (state.eyesClosed && state.lastTimestamp) {
    const delta = time - state.lastTimestamp;
    state.closedTime += delta;
    state.totalClosedTime += delta;

    const level = LEVELS[state.level];
    if (level) {
      const progress = Math.min(state.closedTime / level.duration, 1);
      progressFill.style.width = (progress * 100) + '%';

      if (state.closedTime >= level.duration) {
        advanceLevel();
      }
    }
  }
  state.lastTimestamp = time;

  requestAnimationFrame(gameLoop);
}

// ── Ending Screen ──────────────────────────────────────────
function endExperience() {
  state.running = false;
  stopSpawners();

  // Stop audio
  if (audioCtx) {
    samsaraGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
    emptinessGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
  }

  // Stop camera
  if (webcamEl.srcObject) {
    webcamEl.srcObject.getTracks().forEach(t => t.stop());
  }

  experience.classList.add('hidden');
  ending.classList.remove('hidden');

  // Enso on ending
  createEnsoSVG($('#ensoEnd'));
  setTimeout(() => {
    const svg = $('#ensoEnd svg');
    if (svg) svg.classList.add('enso-drawing');
  }, 300);

  const totalSec = Math.round(state.totalClosedTime / 1000);
  const visitorNum = (Math.floor(Math.random() * 900000) + 100000).toLocaleString();

  const endMsg = $('#endingMessage');
  const counter = $('#visitorCounter');

  if (state.completed) {
    const categories = ['small desires', 'social hunger', 'the material world', 'ego', 'the fear of missing out'];
    endMsg.innerHTML = `
      <p class="stat">You closed your eyes for ${totalSec} seconds.</p>
      <p class="stat">You looked ${state.lookCount} time${state.lookCount !== 1 ? 's' : ''}.</p>
      <p class="stat">You let go of: ${categories.join(', ')}.</p>
      <br>
      <span class="final-line">Your hand held everything.<br>Now it holds nothing.</span>
      <span class="final-line">And that's enough.</span>
      <span class="lotus">\uD83E\uDEB7</span>
    `;
  } else {
    endMsg.innerHTML = `
      <p>The world was too beautiful to look away from.</p>
      <p>That's okay. Even the Buddha took many lifetimes.</p>
      <br>
      <p class="stat">👁 You looked ${state.lookCount} time${state.lookCount !== 1 ? 's' : ''}.</p>
      <span class="lotus">\uD83E\uDEB7</span>
    `;
  }

  counter.textContent = `✨ Beings who found emptiness: ${visitorNum} ✨`;

  // Buttons
  $('#tryAgainBtn').addEventListener('click', () => location.reload());
  $('#shareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      $('#shareBtn').textContent = 'Link copied!';
      setTimeout(() => $('#shareBtn').textContent = 'Share', 2000);
    });
  });
}

// ── Eye Detection (MediaPipe) ──────────────────────────────
let faceMesh = null;
let camera = null;

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
}

function getEAR(landmarks, indices) {
  // indices: [p1, p2, p3, p4, p5, p6]
  // p1-p4 horizontal, p2-p6 vertical top, p3-p5 vertical bottom
  const v1 = distance(landmarks[indices[1]], landmarks[indices[5]]);
  const v2 = distance(landmarks[indices[2]], landmarks[indices[4]]);
  const h = distance(landmarks[indices[0]], landmarks[indices[3]]);
  return (v1 + v2) / (2.0 * h);
}

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const EAR_THRESHOLD = 0.2;
let earSmoothed = 0.3;
const EAR_SMOOTH = 0.3;

function onFaceResults(results) {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
  const lm = results.multiFaceLandmarks[0];

  const leftEAR = getEAR(lm, LEFT_EYE);
  const rightEAR = getEAR(lm, RIGHT_EYE);
  const avgEAR = (leftEAR + rightEAR) / 2;

  earSmoothed = earSmoothed * (1 - EAR_SMOOTH) + avgEAR * EAR_SMOOTH;

  const closed = earSmoothed < EAR_THRESHOLD;
  if (state.running) setEyesClosed(closed);
}

async function initFaceMesh() {
  return new Promise((resolve, reject) => {
    // Load scripts dynamically
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js';
      script2.onload = () => {
        try {
          faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
          });
          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          faceMesh.onResults(onFaceResults);

          camera = new Camera(webcamEl, {
            onFrame: async () => {
              await faceMesh.send({ image: webcamEl });
            },
            width: 320,
            height: 240,
          });
          camera.start();
          state.usingCamera = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    script1.onerror = reject;
    document.head.appendChild(script1);
  });
}

// ── Fallback Controls ──────────────────────────────────────
function setupFallback() {
  fallbackControls.classList.remove('hidden');
  webcamEl.style.display = 'none';

  let manualClosed = false;
  function toggle() {
    manualClosed = !manualClosed;
    toggleEyesBtn.textContent = manualClosed ? 'Open Eyes (Space)' : 'Close Eyes (Space)';
    if (state.running) setEyesClosed(manualClosed);
  }

  toggleEyesBtn.addEventListener('click', toggle);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && state.running && !landing.parentElement?.querySelector('#landing:not(.hidden)')) {
      e.preventDefault();
      toggle();
    }
  });
}

// ── Landing Page Sparkles ──────────────────────────────────
function createLandingSparkles() {
  const container = $('#landingSparkles');
  for (let i = 0; i < 80; i++) {
    const dot = document.createElement('div');
    dot.className = 'sparkle-dot';
    dot.style.left = Math.random() * 100 + '%';
    dot.style.top = Math.random() * 100 + '%';
    dot.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
    dot.style.animationDelay = Math.random() * 4 + 's';
    container.appendChild(dot);
  }
}

// ── Start Experience ───────────────────────────────────────
async function startExperience() {
  landing.classList.add('hidden');
  experience.classList.remove('hidden');

  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  createEmptinessStars();
  createSamsaraParticles(LEVELS[1].particleCount);
  createEnsoSVG(ensoEl);

  // Set initial level
  samsaraLayer.className = 'layer samsara-bg level-1';
  levelDisplay.textContent = LEVELS[1].name;
  progressFill.style.width = '0%';

  state.running = true;
  state.lastTimestamp = performance.now();

  // Start in Samsara
  samsaraAlpha = 1;
  emptinessAlpha = 0;
  startSpawners();

  // Start audio drone
  if (audioCtx) {
    samsaraGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 2);
  }

  requestAnimationFrame(gameLoop);

  // Try camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
    webcamEl.srcObject = stream;
    webcamEl.play();
    cameraNote.textContent = '';
    await initFaceMesh();
  } catch (e) {
    console.log('Camera not available, using fallback:', e.message);
    setupFallback();
  }
}

// ── Init ───────────────────────────────────────────────────
createLandingSparkles();
beginBtn.addEventListener('click', startExperience);

// Also add spacebar fallback listener globally for when camera works
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && state.running && state.usingCamera) {
    e.preventDefault();
    // Allow spacebar override even with camera
    setEyesClosed(!state.eyesClosed);
  }
});
