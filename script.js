/* Jogo simplificado: perguntas embutidas */
let QUESTIONS = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    QUESTIONS = data;
    console.log("Perguntas carregadas:", QUESTIONS);
    renderRound(); // Render the first round after loading questions
  })
  .catch(err => {
    console.error("Erro ao carregar perguntas:", err);
  });


let current = 0;
let scoreA = 0, scoreB = 0;
let turn = "A"; // A ou B

const qEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const scoreAEl = document.getElementById('scoreA');
const scoreBEl = document.getElementById('scoreB');
const turnLabel = document.getElementById('turnLabel');
const guessInput = document.getElementById('guessInput');

/* util: normaliza removendo acentos, espaços e lower */
function normalize(s) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function renderRound() {
  const q = QUESTIONS[current];
  qEl.textContent = q.question;
  answersEl.innerHTML = "";
  q.answers.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = "answer hidden";
    div.dataset.index = i;
    div.innerHTML = `<span class="ans-text">${a.text}</span> <strong class="ans-pts">${a.pts}</strong>`;
    // inicialmente ocultamos texto (visual)
    // clicar revela manualmente
    div.addEventListener('click', () => {
      if (div.classList.contains('hidden')) {
        revealAnswer(i);
      } else {
        // se já revelada, adicionar pontos ao time atual (manual)
        addPointsToTurn(a.pts);
      }
    });
    answersEl.appendChild(div);
  });
  updateTurnLabel();
}

function revealAnswer(index) {
  const box = answersEl.querySelector(`.answer[data-index="${index}"]`);
  if (!box) return;
  box.classList.remove('hidden');
  box.classList.add('revealed');
}

function revealNext() {
  const hidden = answersEl.querySelector('.answer.hidden');
  if (hidden) {
    const idx = hidden.dataset.index;
    revealAnswer(idx);
  }
}

function addPointsToTurn(pts) {
  if (turn === "A") { scoreA += pts; scoreAEl.textContent = scoreA; }
  else { scoreB += pts; scoreBEl.textContent = scoreB; }
}

function updateTurnLabel() {
  turnLabel.textContent = "Time " + turn;
}

document.getElementById('revealBtn').addEventListener('click', () => revealNext());

document.getElementById('checkBtn').addEventListener('click', () => {
  const guess = guessInput.value.trim();
  if (!guess) return;
  const n = normalize(guess);
  const q = QUESTIONS[current];
  let matched = false;
  for (let i=0;i<q.answers.length;i++){
    if (normalize(q.answers[i].text) === n) {
      // revelar e marcar pontos
      revealAnswer(i);
      addPointsToTurn(q.answers[i].pts);
      matched = true;
      break;
    }
  }
  if (!matched) {
    alert("Resposta não encontrada (strike). Use o botão 'Trocar Vez' se quiser alternar.");
  }
  guessInput.value = "";
});

  // renderRound() is now called after questions are loaded in the fetch block
  turn = (turn === "A") ? "B" : "A";
updateTurnLabel();

document.getElementById('nextRound').addEventListener('click', () => {
  current = (current + 1) % QUESTIONS.length;
  renderRound();
});

renderRound();