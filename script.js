"use strict";

/* ==========================================================================
   Configurações Gerais e Definição dos 5 Níveis
   ========================================================================== */
const GRID_SIZE = 20;
const POINTS_PER_FOOD = 10;
const STORAGE_RANKING_KEY = "cobrinha_ranking_v1";
const STORAGE_PLAYER_KEY = "cobrinha_last_player_v1";
const MAX_RANKING_ENTRIES = 20;

/**
 * Cada nível aumenta a velocidade (menor tickMs), adiciona obstáculos simétricos
 * sem fechar passagens e define uma meta de pontos para avançar.
 */
const LEVELS = [
  {
    level: 1,
    name: "Nível 1 · Arena Livre",
    shortLabel: "Velocidade inicial · Sem obstáculos",
    targetScore: 50,
    tickMs: 155,
    obstacles: []
  },
  {
    level: 2,
    name: "Nível 2 · Cantos",
    shortLabel: "Mais rápido · 4 obstáculos",
    targetScore: 120,
    tickMs: 130,
    obstacles: [
      { x: 4, y: 4 },
      { x: 15, y: 4 },
      { x: 4, y: 15 },
      { x: 15, y: 15 }
    ]
  },
  {
    level: 3,
    name: "Nível 3 · Pilares",
    shortLabel: "Ritmo ágil · 8 obstáculos",
    targetScore: 210,
    tickMs: 108,
    obstacles: [
      { x: 4, y: 4 },
      { x: 15, y: 4 },
      { x: 4, y: 15 },
      { x: 15, y: 15 },
      { x: 9, y: 5 },
      { x: 10, y: 5 },
      { x: 9, y: 14 },
      { x: 10, y: 14 }
    ]
  },
  {
    level: 4,
    name: "Nível 4 · Corredor",
    shortLabel: "Veloz · 14 obstáculos",
    targetScore: 320,
    tickMs: 90,
    obstacles: [
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 15, y: 4 },
      { x: 16, y: 4 },
      { x: 3, y: 15 },
      { x: 4, y: 15 },
      { x: 15, y: 15 },
      { x: 16, y: 15 },
      { x: 9, y: 5 },
      { x: 10, y: 5 },
      { x: 9, y: 14 },
      { x: 10, y: 14 },
      { x: 6, y: 9 },
      { x: 13, y: 10 }
    ]
  },
  {
    level: 5,
    name: "Nível 5 · Desafio Máximo",
    shortLabel: "Velocidade máxima · 20 obstáculos",
    targetScore: null,
    tickMs: 74,
    obstacles: [
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 15, y: 4 },
      { x: 16, y: 4 },
      { x: 3, y: 15 },
      { x: 4, y: 15 },
      { x: 15, y: 15 },
      { x: 16, y: 15 },
      { x: 9, y: 4 },
      { x: 10, y: 4 },
      { x: 9, y: 15 },
      { x: 10, y: 15 },
      { x: 6, y: 8 },
      { x: 6, y: 9 },
      { x: 13, y: 10 },
      { x: 13, y: 11 },
      { x: 3, y: 9 },
      { x: 3, y: 10 },
      { x: 16, y: 9 },
      { x: 16, y: 10 }
    ]
  }
];

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

/* ==========================================================================
   Referências do DOM
   ========================================================================== */
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game-canvas"));
const ctx = canvas.getContext("2d");

const hudPlayer = document.getElementById("hud-player");
const hudScore = document.getElementById("hud-score");
const hudLevel = document.getElementById("hud-level");
const hudTarget = document.getElementById("hud-target");
const levelProgressFill = document.getElementById("level-progress-fill");

const btnPause = /** @type {HTMLButtonElement} */ (document.getElementById("btn-pause"));
const btnRestart = /** @type {HTMLButtonElement} */ (document.getElementById("btn-restart"));
const btnResume = /** @type {HTMLButtonElement} */ (document.getElementById("btn-resume"));
const btnPauseRestart = /** @type {HTMLButtonElement} */ (document.getElementById("btn-pause-restart"));
const btnPlayAgain = /** @type {HTMLButtonElement} */ (document.getElementById("btn-play-again"));
const btnChangePlayer = /** @type {HTMLButtonElement} */ (document.getElementById("btn-change-player"));
const btnClearRanking = /** @type {HTMLButtonElement} */ (document.getElementById("btn-clear-ranking"));

const overlayStart = document.getElementById("overlay-start");
const overlayPause = document.getElementById("overlay-pause");
const overlayGameover = document.getElementById("overlay-gameover");

const startForm = /** @type {HTMLFormElement} */ (document.getElementById("start-form"));
const playerNameInput = /** @type {HTMLInputElement} */ (document.getElementById("player-name-input"));
const nameError = document.getElementById("name-error");

const gameoverReason = document.getElementById("gameover-reason");
const finalScoreEl = document.getElementById("final-score");
const finalLevelEl = document.getElementById("final-level");
const finalBestEl = document.getElementById("final-best");

const levelToast = document.getElementById("level-toast");
const levelToastTitle = document.getElementById("level-toast-title");
const levelToastDesc = document.getElementById("level-toast-desc");

const rankingEmpty = document.getElementById("ranking-empty");
const rankingTableWrap = document.getElementById("ranking-table-wrap");
const rankingBody = document.getElementById("ranking-body");
const levelsList = document.getElementById("levels-list");

const dpadButtons = document.querySelectorAll(".dpad-btn");

/* ==========================================================================
   Estado do Jogo
   ========================================================================== */
/** @type {"MENU" | "PLAYING" | "PAUSED" | "GAMEOVER"} */
let gameState = "MENU";
let playerName = "";
let score = 0;
let currentLevelIndex = 0;

/** @type {Array<{x: number, y: number}>} */
let snake = [];
/** @type {{x: number, y: number}} */
let direction = DIRECTIONS.RIGHT;
/** @type {Array<{x: number, y: number}>} */
let directionQueue = [];
/** @type {{x: number, y: number}} */
let food = { x: 14, y: 10 };
/** @type {Array<{x: number, y: number}>} */
let activeObstacles = [];

let lastFrameTime = 0;
let tickAccumulator = 0;
let animationFrameId = 0;
let toastTimeoutId = 0;
let lastRecordedId = null;

// Controle de gestos por toque no tabuleiro
let touchStartX = 0;
let touchStartY = 0;

// Contexto de áudio leve (Web Audio API) sem arquivos externos
let audioCtx = null;

/* ==========================================================================
   Áudio Sintetizado Sutil
   ========================================================================== */
function playTone(frequency, durationSec, type = "sine", volume = 0.06) {
  try {
    const AudioContextClass = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationSec);
  } catch {
    // Ignora falhas de áudio caso o navegador bloqueie reprodução automática
  }
}

/* ==========================================================================
   Persistência do Ranking no localStorage
   ========================================================================== */
function loadRanking() {
  try {
    const raw = localStorage.getItem(STORAGE_RANKING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRanking(entries) {
  try {
    localStorage.setItem(STORAGE_RANKING_KEY, JSON.stringify(entries));
  } catch {
    // Ignora caso o armazenamento esteja indisponível
  }
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  });
}

function recordMatchScore() {
  const entries = loadRanking();
  const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newEntry = {
    id: entryId,
    name: playerName,
    score: score,
    level: currentLevelIndex + 1,
    date: new Date().toISOString()
  };

  entries.push(newEntry);

  // Ordena pela maior pontuação; em caso de empate, maior nível e data mais recente
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const trimmed = entries.slice(0, MAX_RANKING_ENTRIES);
  saveRanking(trimmed);
  lastRecordedId = entryId;
  renderRanking();

  return trimmed[0] ? trimmed[0].score : score;
}

function renderRanking() {
  const entries = loadRanking();
  const hasEntries = entries.length > 0;

  rankingEmpty.hidden = hasEntries;
  rankingTableWrap.hidden = !hasEntries;
  btnClearRanking.hidden = !hasEntries;

  if (!hasEntries) {
    rankingBody.innerHTML = "";
    return;
  }

  rankingBody.innerHTML = entries
    .map((entry, index) => {
      const rankNum = index + 1;
      const isRecent = entry.id === lastRecordedId;
      const topClass = rankNum === 1 ? "top-1" : "";
      const rowClass = isRecent ? "is-recent" : "";

      const safeName = escapeHtml(entry.name || "Jogador");
      const safeDate = escapeHtml(formatDateTime(entry.date));

      return `
        <tr class="${rowClass}">
          <td class="rank-pos ${topClass}">${rankNum}º</td>
          <td class="rank-name" title="${safeName}">${safeName}</td>
          <td class="rank-level">Nv. ${Number(entry.level) || 1}</td>
          <td class="num-col">${Number(entry.score) || 0}</td>
          <td class="date-col">${safeDate}</td>
        </tr>
      `;
    })
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

/* ==========================================================================
   Inicialização e Controle de Níveis
   ========================================================================== */
function getActiveLevelConfig() {
  return LEVELS[currentLevelIndex];
}

/**
 * Filtra os obstáculos do nível garantindo que nenhum bloco surja em cima da
 * cobra ou diretamente à frente da cabeça no instante da transição de nível.
 */
function buildSafeObstacles(levelIndex) {
  const candidateObstacles = LEVELS[levelIndex].obstacles;
  const head = snake[0];

  return candidateObstacles.filter((obs) => {
    const hitsSnake = snake.some((seg) => seg.x === obs.x && seg.y === obs.y);
    if (hitsSnake) return false;

    if (head) {
      for (let step = 1; step <= 3; step += 1) {
        if (head.x + direction.x * step === obs.x && head.y + direction.y * step === obs.y) {
          return false;
        }
      }
    }
    return true;
  });
}

function spawnFood() {
  const freeCells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const onSnake = snake.some((seg) => seg.x === x && seg.y === y);
      const onObstacle = activeObstacles.some((obs) => obs.x === x && obs.y === y);
      if (!onSnake && !onObstacle) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) return;
  const randomIndex = Math.floor(Math.random() * freeCells.length);
  food = freeCells[randomIndex];
}

function resetGameVariables() {
  score = 0;
  currentLevelIndex = 0;
  snake = [
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 }
  ];
  direction = DIRECTIONS.RIGHT;
  directionQueue = [];
  activeObstacles = buildSafeObstacles(0);
  spawnFood();
  tickAccumulator = 0;
  hideLevelToast();
  updateHud();
  renderLevelsList();
}

function showLevelToast(title, description) {
  if (toastTimeoutId) {
    window.clearTimeout(toastTimeoutId);
  }
  levelToastTitle.textContent = title;
  levelToastDesc.textContent = description;
  levelToast.hidden = false;

  toastTimeoutId = window.setTimeout(() => {
    levelToast.hidden = true;
  }, 2400);
}

function hideLevelToast() {
  if (toastTimeoutId) {
    window.clearTimeout(toastTimeoutId);
    toastTimeoutId = 0;
  }
  levelToast.hidden = true;
}

function checkLevelAdvancement() {
  const currentConfig = getActiveLevelConfig();
  if (currentConfig.targetScore !== null && score >= currentConfig.targetScore) {
    if (currentLevelIndex < LEVELS.length - 1) {
      currentLevelIndex += 1;
      const nextConfig = getActiveLevelConfig();
      activeObstacles = buildSafeObstacles(currentLevelIndex);

      // Se a comida atual coincidir com um novo obstáculo, reposiciona imediatamente
      if (activeObstacles.some((obs) => obs.x === food.x && obs.y === food.y)) {
        spawnFood();
      }

      playTone(660, 0.14, "triangle", 0.08);
      window.setTimeout(() => playTone(880, 0.18, "triangle", 0.08), 110);
      showLevelToast(nextConfig.name, nextConfig.shortLabel);
      renderLevelsList();
    }
  }
}

/* ==========================================================================
   Atualização de Interface (HUD, Lista de Níveis e Overlays)
   ========================================================================== */
function updateHud() {
  const config = getActiveLevelConfig();
  hudPlayer.textContent = playerName || "—";
  hudScore.textContent = String(score);
  hudLevel.textContent = `${config.level} / ${LEVELS.length}`;

  if (config.targetScore !== null) {
    hudTarget.textContent = `${config.targetScore} pts`;
    const prevTarget = currentLevelIndex > 0 ? LEVELS[currentLevelIndex - 1].targetScore || 0 : 0;
    const span = config.targetScore - prevTarget;
    const progress = Math.min(100, Math.max(0, ((score - prevTarget) / span) * 100));
    levelProgressFill.style.width = `${progress}%`;
  } else {
    hudTarget.textContent = "Livre";
    levelProgressFill.style.width = "100%";
  }
}

function renderLevelsList() {
  levelsList.innerHTML = LEVELS.map((lvl, idx) => {
    const isActive = idx === currentLevelIndex && gameState !== "MENU";
    const isCompleted = idx < currentLevelIndex && gameState !== "MENU";
    const classes = [
      "level-row",
      isActive ? "is-active" : "",
      isCompleted ? "is-completed" : ""
    ]
      .filter(Boolean)
      .join(" ");

    const metaText = lvl.targetScore !== null ? `Meta: ${lvl.targetScore} pts` : "Nível máximo";

    return `
      <li class="${classes}">
        <span class="level-row-name">${escapeHtml(lvl.name)}</span>
        <span class="level-row-meta">${metaText}</span>
      </li>
    `;
  }).join("");
}

function syncOverlays() {
  overlayStart.hidden = gameState !== "MENU";
  overlayPause.hidden = gameState !== "PAUSED";
  overlayGameover.hidden = gameState !== "GAMEOVER";

  const canControl = gameState === "PLAYING" || gameState === "PAUSED";
  btnPause.disabled = !canControl;
  btnRestart.disabled = !canControl && gameState !== "GAMEOVER";
  btnPause.textContent = gameState === "PAUSED" ? "Continuar" : "Pausar";
}

/* ==========================================================================
   Loop Principal e Lógica da Cobrinha
   ========================================================================== */
function startGame() {
  resetGameVariables();
  gameState = "PLAYING";
  syncOverlays();
  updateHud();
  renderLevelsList();
  lastFrameTime = performance.now();
}

function togglePause() {
  if (gameState === "PLAYING") {
    gameState = "PAUSED";
    syncOverlays();
  } else if (gameState === "PAUSED") {
    gameState = "PLAYING";
    lastFrameTime = performance.now();
    syncOverlays();
  }
}

function triggerGameOver(reasonText) {
  gameState = "GAMEOVER";
  playTone(180, 0.25, "sawtooth", 0.07);

  const bestScore = recordMatchScore();

  gameoverReason.textContent = reasonText;
  finalScoreEl.textContent = String(score);
  finalLevelEl.textContent = `${currentLevelIndex + 1} / ${LEVELS.length}`;
  finalBestEl.textContent = String(bestScore);

  syncOverlays();
  renderLevelsList();
}

function queueDirection(newDir) {
  if (gameState !== "PLAYING") return;

  const lastPlanned =
    directionQueue.length > 0 ? directionQueue[directionQueue.length - 1] : direction;

  // Impede reversão de 180 graus ou direção repetida
  if (newDir.x === -lastPlanned.x && newDir.y === -lastPlanned.y) return;
  if (newDir.x === lastPlanned.x && newDir.y === lastPlanned.y) return;

  if (directionQueue.length < 2) {
    directionQueue.push(newDir);
  }
}

function stepGameLogic() {
  if (directionQueue.length > 0) {
    direction = /** @type {{x: number, y: number}} */ (directionQueue.shift());
  }

  const nextHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // Colisão com as paredes da arena
  if (
    nextHead.x < 0 ||
    nextHead.x >= GRID_SIZE ||
    nextHead.y < 0 ||
    nextHead.y >= GRID_SIZE
  ) {
    triggerGameOver("Você colidiu com a parede da arena.");
    return;
  }

  // Colisão com obstáculos do nível
  if (activeObstacles.some((obs) => obs.x === nextHead.x && obs.y === nextHead.y)) {
    triggerGameOver("Você atingiu um obstáculo do nível.");
    return;
  }

  const willEat = nextHead.x === food.x && nextHead.y === food.y;

  // Colisão com o próprio corpo (ignora a ponta da cauda se não for crescer neste passo)
  const bodyToCheck = willEat ? snake : snake.slice(0, -1);
  if (bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y)) {
    triggerGameOver("A cobra colidiu com o próprio corpo.");
    return;
  }

  snake.unshift(nextHead);

  if (willEat) {
    score += POINTS_PER_FOOD;
    playTone(520, 0.08, "sine", 0.06);
    checkLevelAdvancement();
    spawnFood();
    updateHud();
  } else {
    snake.pop();
  }
}

/* ==========================================================================
   Renderização no HTML5 Canvas
   ========================================================================== */
function configureCanvasResolution() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const logicalSize = 520;
  canvas.width = logicalSize * dpr;
  canvas.height = logicalSize * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBoard(now) {
  const boardSize = 520;
  const cell = boardSize / GRID_SIZE;

  // Fundo limpo do tabuleiro
  ctx.fillStyle = "#090e14";
  ctx.fillRect(0, 0, boardSize, boardSize);

  // Grade discreta para orientação espacial
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < GRID_SIZE; i += 1) {
    const pos = i * cell;
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, boardSize);
    ctx.moveTo(0, pos);
    ctx.lineTo(boardSize, pos);
  }
  ctx.stroke();

  // Obstáculos do nível (blocos âmbar com borda nítida)
  for (const obs of activeObstacles) {
    const ox = obs.x * cell + 2;
    const oy = obs.y * cell + 2;
    const os = cell - 4;
    ctx.fillStyle = "#b45309";
    drawRoundedRect(ox, oy, os, os, 5);
    ctx.fill();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ox + 0.5, oy + 0.5, os - 1, os - 1, 5);
    ctx.stroke();
  }

  // Comida (maçã coral com pulsação suave)
  const pulse = Math.sin(now / 220) * 1.1;
  const fx = food.x * cell + cell / 2;
  const fy = food.y * cell + cell / 2;
  const radius = Math.max(5, cell * 0.34 + pulse);

  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.arc(fx, fy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Detalhe de brilho discreto na fruta
  ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
  ctx.beginPath();
  ctx.arc(fx - radius * 0.3, fy - radius * 0.3, radius * 0.24, 0, Math.PI * 2);
  ctx.fill();

  // Corpo da cobra (do rabo até a cabeça)
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const seg = snake[i];
    const isHead = i === 0;
    const pad = isHead ? 1.5 : 2.5;
    const sx = seg.x * cell + pad;
    const sy = seg.y * cell + pad;
    const size = cell - pad * 2;

    if (isHead) {
      ctx.fillStyle = "#34d399";
    } else {
      const ratio = 1 - Math.min(i / Math.max(snake.length, 6), 0.75) * 0.45;
      ctx.fillStyle = `rgba(16, 185, 129, ${ratio.toFixed(2)})`;
    }

    drawRoundedRect(sx, sy, size, size, isHead ? 7 : 5);
    ctx.fill();

    // Olhos na cabeça indicando a direção
    if (isHead) {
      ctx.fillStyle = "#052e1e";
      const eyeSize = 2.4;
      const centerX = seg.x * cell + cell / 2;
      const centerY = seg.y * cell + cell / 2;
      const forward = 4.5;
      const spread = 4.2;

      const eye1X = centerX + direction.x * forward - direction.y * spread;
      const eye1Y = centerY + direction.y * forward + direction.x * spread;
      const eye2X = centerX + direction.x * forward + direction.y * spread;
      const eye2Y = centerY + direction.y * forward - direction.x * spread;

      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function gameLoop(now) {
  const delta = Math.min(now - lastFrameTime, 100);
  lastFrameTime = now;

  if (gameState === "PLAYING") {
    const tickMs = getActiveLevelConfig().tickMs;
    tickAccumulator += delta;

    while (tickAccumulator >= tickMs && gameState === "PLAYING") {
      tickAccumulator -= tickMs;
      stepGameLogic();
    }
  }

  drawBoard(now);
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

/* ==========================================================================
   Eventos de Teclado, Botões e Toque
   ========================================================================== */
function handleStartSubmit(event) {
  event.preventDefault();
  const trimmedName = playerNameInput.value.trim();

  if (!trimmedName) {
    nameError.hidden = false;
    playerNameInput.focus();
    return;
  }

  nameError.hidden = true;
  playerName = trimmedName;
  try {
    localStorage.setItem(STORAGE_PLAYER_KEY, playerName);
  } catch {
    // Ignora erro de armazenamento
  }

  startGame();
}

function handleKeyDown(event) {
  const target = /** @type {HTMLElement | null} */ (event.target);
  const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
  if (isTyping) return;

  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      if (gameState === "PLAYING") event.preventDefault();
      queueDirection(DIRECTIONS.UP);
      break;
    case "ArrowDown":
    case "KeyS":
      if (gameState === "PLAYING") event.preventDefault();
      queueDirection(DIRECTIONS.DOWN);
      break;
    case "ArrowLeft":
    case "KeyA":
      if (gameState === "PLAYING") event.preventDefault();
      queueDirection(DIRECTIONS.LEFT);
      break;
    case "ArrowRight":
    case "KeyD":
      if (gameState === "PLAYING") event.preventDefault();
      queueDirection(DIRECTIONS.RIGHT);
      break;
    case "Space":
      if (gameState === "PLAYING" || gameState === "PAUSED") {
        event.preventDefault();
        togglePause();
      }
      break;
    default:
      break;
  }
}

function setupTouchSwipe() {
  canvas.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 0) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchend",
    (event) => {
      if (gameState !== "PLAYING" || event.changedTouches.length === 0) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      const minSwipeDistance = 24;

      if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        queueDirection(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
      } else {
        queueDirection(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
      }
    },
    { passive: true }
  );
}

function bindEvents() {
  startForm.addEventListener("submit", handleStartSubmit);

  playerNameInput.addEventListener("input", () => {
    if (playerNameInput.value.trim()) {
      nameError.hidden = true;
    }
  });

  btnPause.addEventListener("click", togglePause);
  btnResume.addEventListener("click", togglePause);

  btnRestart.addEventListener("click", startGame);
  btnPauseRestart.addEventListener("click", startGame);
  btnPlayAgain.addEventListener("click", startGame);

  btnChangePlayer.addEventListener("click", () => {
    gameState = "MENU";
    resetGameVariables();
    syncOverlays();
    playerNameInput.focus();
    playerNameInput.select();
  });

  btnClearRanking.addEventListener("click", () => {
    saveRanking([]);
    lastRecordedId = null;
    renderRanking();
  });

  dpadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dirKey = button.getAttribute("data-dir");
      if (dirKey && DIRECTIONS[dirKey]) {
        queueDirection(DIRECTIONS[dirKey]);
      }
    });
  });

  window.addEventListener("keydown", handleKeyDown);
  setupTouchSwipe();
}

/* ==========================================================================
   Inicialização da Aplicação
   ========================================================================== */
function init() {
  configureCanvasResolution();
  bindEvents();

  try {
    const savedName = localStorage.getItem(STORAGE_PLAYER_KEY);
    if (savedName) {
      playerNameInput.value = savedName;
      playerName = savedName;
    }
  } catch {
    // Ignora caso localStorage esteja bloqueado
  }

  resetGameVariables();
  renderRanking();
  syncOverlays();

  lastFrameTime = performance.now();
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

init();
