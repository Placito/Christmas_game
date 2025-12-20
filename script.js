/* ==============================
   Game: questions
============================== */

let QUESTIONS = [];
let current = 0;

/* ==============================
   SCORES
============================== */

// TOTAL
let scoreA = 0;
let scoreB = 0;

// ROUND
let roundA = 0;
let roundB = 0;

let turn = "A"; // A | B

/* ==============================
   STRIKES
============================== */

let strikes = { A: 0, B: 0 };

/* ==============================
   DOM ELEMENTS
============================== */

const qEl = document.getElementById('question');
const answersEl = document.getElementById('answers');

const scoreAEl = document.getElementById('scoreA');
const scoreAEl1 = document.getElementById('scoreA1');
const scoreBEl = document.getElementById('scoreB');
const scoreBEl1 = document.getElementById('scoreB1');

const turnLabel = document.getElementById('turnLabel');
const guessInput = document.getElementById('guessInput');

/* ==============================
   AUDIO
============================== */

const cheerSound = new Audio('/static/applause.mp3');
const errorSound = new Audio('/static/error.mp3');

/* ==============================
   FETCH QUESTIONS
============================== */

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    QUESTIONS = data;
    console.log("Perguntas carregadas:", QUESTIONS);
    renderRound();
  })
  .catch(err => console.error(err));

/* ==============================
   UTIL
============================== */

function normalize(s) {
  return s.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[a.length][b.length];
}

/* ==============================
   GAME RENDER
============================== */

function renderRound() {
  const q = QUESTIONS[current];
  if (!q) return;

  qEl.textContent = q.question;
  answersEl.innerHTML = "";

  q.answers.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = "answer hidden";
    div.dataset.index = i;

    div.innerHTML = `
      <span class="ans-number">${i + 1}</span>
      <span class="ans-text">${a.text}</span>
      <strong class="ans-pts">${a.pts}</strong>
    `;

    div.addEventListener('click', () => {
      if (div.classList.contains('hidden')) {
        revealAnswer(i);
      } else {
        addPointsToTurn(a.pts);
      }
    });

    answersEl.appendChild(div);
  });

  updateTurnLabel();
}

/* ==============================
   ANSWERS
============================== */

function revealAnswer(index) {
  const box = answersEl.querySelector(`.answer[data-index="${index}"]`);
  if (!box || box.classList.contains('revealed')) return;

  box.classList.remove('hidden');
  box.classList.add('revealed');

  const number = box.querySelector('.ans-number');
  if (number) number.style.display = 'none';
}

function revealNext() {
  const hidden = answersEl.querySelector('.answer.hidden');
  if (hidden) revealAnswer(hidden.dataset.index);
}

/* ==============================
   SCORING
============================== */

function addPointsToTurn(pts) {
  if (turn === "A") {
    roundA += pts;
    scoreAEl1.textContent = roundA;
  } else {
    roundB += pts;
    scoreBEl1.textContent = roundB;
  }
}

function endRound() {
  scoreA += roundA;
  scoreB += roundB;

  roundA = 0;
  roundB = 0;

  scoreAEl.textContent = scoreA;
  scoreBEl.textContent = scoreB;
  scoreAEl1.textContent = 0;
  scoreBEl1.textContent = 0;
}

/* ==============================
   TURN
============================== */

function updateTurnLabel() {
  turnLabel.textContent = "Equipa " + turn;
}

/* ==============================
  STRIKES
============================== */

function wrongAnswer() {
  strikes[turn]++;

  errorSound.play();

  const img = document.createElement('img');
  img.src = '/static/strike.png';
  img.style.position = 'fixed';
  img.style.top = '50%';
  img.style.left = '50%';
  img.style.transform = 'translate(-50%, -50%)';
  img.style.width = '30rem';
  img.style.zIndex = '9999';

  document.body.appendChild(img);
  setTimeout(() => img.remove(), 2000);

  updateStrikesDisplay();
}

function resetStrikes() {
  strikes.A = 0;
  strikes.B = 0;
  updateStrikesDisplay();
}

function updateStrikesDisplay() {
  const strikesAEl = document.getElementById('strikesA');
  const strikesBEl = document.getElementById('strikesB');

  if (strikesAEl) strikesAEl.textContent = strikes.A;
  if (strikesBEl) strikesBEl.textContent = strikes.B;
}

/* ==============================
   BUTTONS (SAFE)
============================== */

document.getElementById('swapTurn')?.addEventListener('click', () => {
  turn = turn === "A" ? "B" : "A";
  updateTurnLabel();
});

document.getElementById('revealBtn')?.addEventListener('click', () => {
  const hidden = answersEl.querySelector('.answer.hidden');
  hidden ? (revealNext(), cheerSound.play()) : errorSound.play();
});

document.getElementById('checkBtn')?.addEventListener('click', () => {
  const guess = guessInput.value.trim();
  if (!guess) return;

  const n = normalize(guess);
  const q = QUESTIONS[current];
  let matched = false;

  for (let i = 0; i < q.answers.length; i++) {
    const a = q.answers[i];
    const na = normalize(a.text);

    if (na.includes(n) || n.includes(na) || levenshteinDistance(na, n) <= 2) {
      revealAnswer(i);
      addPointsToTurn(a.pts);
      cheerSound.play();
      matched = true;
      break;
    }
  }

  if (!matched) wrongAnswer();
  guessInput.value = "";
});

/* ==============================
  steal BUTTON
============================== */

document.getElementById('stealBtn')?.addEventListener('click', () => {
  // Add points from the other team's round
  if (turn === "A") {
   scoreA += roundB + roundA;
  } else {
   scoreB += roundA + roundB;
  }

  // Reset round scores
  roundA = 0;
  roundB = 0;

  // Update the scores on the DOM
  scoreAEl.textContent = scoreA;
  scoreBEl.textContent = scoreB;
  scoreAEl1.textContent = 0;
  scoreBEl1.textContent = 0;

  // Reset strikes and move to the next question
  resetStrikes();
  current = (current + 1) % QUESTIONS.length;
  renderRound();
});