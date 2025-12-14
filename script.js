/* Jogo simplificado: perguntas embutidas */
let QUESTIONS = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    QUESTIONS = data;
    console.log("Perguntas carregadas:", QUESTIONS);
    renderRound();
  })
  .catch(err => {
    console.error("Erro ao carregar perguntas:", err);
  });

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

function revealAnswer(index) {
  const box = answersEl.querySelector(`.answer[data-index="${index}"]`);
  if (!box || box.classList.contains('revealed')) return;

  box.classList.remove('hidden');
  box.classList.add('revealed');
}

function revealNext() {
  const hidden = answersEl.querySelector('.answer.hidden');
  if (hidden) revealAnswer(hidden.dataset.index);
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
const errorSound = new Audio('/static/error.mp3');

document.getElementById('revealBtn').addEventListener('click', () => {
  const hidden = answersEl.querySelector('.answer.hidden');
  if (hidden) {
    revealNext();
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
    if (normalize(q.answers[i].text) === n) {
      revealAnswer(i);
      addPointsToTurn(q.answers[i].pts);
      cheerSound.play();
      matched = true;
      break;
    }
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
});

// 🔁 STEAL POINTS
function stealPoints() {
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
