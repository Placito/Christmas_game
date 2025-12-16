/* Jogo simplificado: perguntas embutidas */
let QUESTIONS = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    QUESTIONS = data;
    console.log("Perguntas carregadas:", QUESTIONS);
    renderRound(); // Ensure renderRound is used to display the first round
  })
  .catch(err => {
    console.error("Erro ao carregar perguntas:", err);
  });

// Example usage of endRound to ensure it's invoked
document.getElementById('endRoundBtn').addEventListener('click', () => {
  endRound();
});

  async function loadSynonyms() {
  try {
    const response = await fetch('synonyms.json');
    if (!response.ok) throw new Error('Failed to fetch synonyms');
    const synonyms = await response.json();
    return synonyms;
  } catch (err) {
    console.error(err);
    return {};
  }
}

let current = 0;

// TOTAL SCORES
let scoreA = 0;
let scoreB = 0;

// ROUND SCORES
let roundA = 0;
let roundB = 0;

let turn = "A"; // A ou B

const qEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const scoreAEl = document.getElementById('scoreA');   // total A
const scoreAEl1 = document.getElementById('scoreA1'); // round A
const scoreBEl = document.getElementById('scoreB');   // total B
const scoreBEl1 = document.getElementById('scoreB1'); // round B
const turnLabel = document.getElementById('turnLabel');
const guessInput = document.getElementById('guessInput');

//function to add strike
let strikesA = 0;
let strikesB = 0;

const strikeAEl = document.getElementById("strikeA");
const strikeBEl = document.getElementById("strikeB");
function updateStrikesDisplay() {
  strikeAEl.textContent = "Strikes: " + "X".repeat(strikesA);
  strikeBEl.textContent = "Strikes: " + "X".repeat(strikesB);

/* util: normaliza removendo acentos, espaços e lower */
function normalize(s) {
  return s.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function renderRound() {
  const q = QUESTIONS[current];
  qEl.textContent = q.question;
  answersEl.innerHTML = "";

  q.answers.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = "answer hidden";
    div.dataset.index = i;

    // 🔢 NUMBER + TEXT + POINTS
    div.innerHTML = `
      <span class="ans-number" style="display: inline-block; width: 2rem; height: 2rem; border: 2px solid black; border-radius: 50%; text-align: center; line-height: 2rem; background-color: yellow; color: black; font-weight: bold;">
      ${i + 1}
      </span>
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

function revealAnswer(index) {
  const box = answersEl.querySelector(`.answer[data-index="${index}"]`);
  if (!box || box.classList.contains('revealed')) return;

  box.classList.remove('hidden');
  box.classList.add('revealed');

  // 🔥 hide the number
  const number = box.querySelector('.ans-number');
  if (number) number.style.display = 'none';
}

function revealNext() {
  const hidden = answersEl.querySelector('.answer.hidden');
  resetStrikes();
  if (hidden) {
    revealAnswer(hidden.dataset.index);
    // 🔥 hide the number
    const number = hidden.querySelector('.ans-number');
    if (number) number.style.display = 'none';
  }
}

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

function updateTurnLabel() {
  turnLabel.textContent = "Equipa " + turn;
}

const swapTurnBtn = document.getElementById('swapTurn');
swapTurnBtn.addEventListener('click', () => {
  turn = (turn === "A") ? "B" : "A";
  updateTurnLabel();
});

const cheerSound = new Audio('/static/applause.mp3');
cheerSound.onerror = () => console.error("Failed to load cheer sound.");

const errorSound = new Audio('/static/error.mp3');
errorSound.onerror = () => console.error("Failed to load error sound.");

document.getElementById('revealBtn').addEventListener('click', () => {
  const hidden = answersEl.querySelector('.answer.hidden');
  if (hidden) {
    revealNext();
    hidden.querySelector('.ans-number').style.visibility = 'hidden'; // Hide the number
    cheerSound.play();
  } else {
    errorSound.play();
  }
});

document.getElementById('checkBtn').addEventListener('click', () => {
  const guess = guessInput.value.trim();
  if (!guess) return;

  const n = normalize(guess);
  const q = QUESTIONS[current];
  let matched = false;

  for (let i = 0; i < q.answers.length; i++) {
    const normalizedAnswer = normalize(q.answers[i].text);

    // Check if the guess is similar to the answer
    if (
      normalizedAnswer.includes(n) || // Partial match
      n.includes(normalizedAnswer) || // Reverse partial match
      levenshteinDistance(normalizedAnswer, n) <= 2 // Allow small typos
    ) {
      revealAnswer(i);
      addPointsToTurn(q.answers[i].pts);
      cheerSound.play();
      matched = true;
      break;
    }
  }

  if (!matched) {
    errorSound.play();
    wrongAnswer();
  }
});

// Helper function to calculate Levenshtein Distance
function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[a.length][b.length];
}

  // ❌ STRIKE
  if (!matched) {
    errorSound.play();

    const strikeImg = document.createElement('img');
    strikeImg.src = '/static/strike.png';
    strikeImg.alt = 'Strike!';
    strikeImg.style.position = 'fixed';
    strikeImg.style.top = '50%';
    strikeImg.style.left = '50%';
    strikeImg.style.transform = 'translate(-50%, -50%)';
    strikeImg.style.zIndex = '9999';
    strikeImg.style.width = '30rem';
    strikeImg.style.pointerEvents = 'none';

    document.body.appendChild(strikeImg);
    setTimeout(() => strikeImg.remove(), 2000);
  }

  guessInput.value = "";
}

//count strikes
let currentTurn = "A";
let strikes = {
  A: 0,
  B: 0
};

function wrongAnswer() {
  strikes[currentTurn]++;
  updateStrikeUI();

  animateStrikeToTeam(currentTurn);
}

function updateStrikeUI() {
  document.getElementById("strikeCountA").textContent = strikes.A;
  document.getElementById("strikeCountB").textContent = strikes.B;
}
//reset strikes
function resetStrikes() {
  strikes.A = 0;
  strikes.B = 0;
  updateStrikeUI();
}

// 🔁 STEAL POINTS
function stealPoints() {
  resetStrikes();
  if (turn === "A") {
    scoreA += roundB;
    roundB = 0;
  } else {
    scoreB += roundA;
    roundA = 0;
  }

  scoreAEl.textContent = scoreA;
  scoreBEl.textContent = scoreB;
  scoreAEl1.textContent = roundA;
  scoreBEl1.textContent = roundB;
}

document.getElementById('stealBtn').addEventListener('click', stealPoints);

document.getElementById('nextRound').addEventListener('click', () => {
  endRound();
  current = (current + 1) % QUESTIONS.length;
  renderRound();
});
