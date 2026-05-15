const words = {
  natur: ["Ahorn", "Bergsee", "Gewitter", "Kiesel", "Moos", "Sonnenblume"],
  stadt: ["Bahnhof", "Brunnen", "Fahrradweg", "Museum", "Laterne", "Marktplatz"],
  technik: ["Browser", "Datenbank", "Kabel", "Roboter", "Tastatur", "Werkzeug"],
  essen: ["Apfelkuchen", "Brezel", "Eintopf", "Kartoffel", "Marmelade", "Zitronen"],
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("");
const difficulties = {
  easy: { label: "Einfach", maxMistakes: 10, gallowsMistakes: 4 },
  normal: { label: "Normal", maxMistakes: 8, gallowsMistakes: 2 },
  hard: { label: "Schwer", maxMistakes: 4 },
};

const stage = document.querySelector(".stage");
const wordEl = document.querySelector("#word");
const keyboardEl = document.querySelector("#keyboard");
const mistakesEl = document.querySelector("#mistakes");
const attemptsEl = document.querySelector("#attempts");
const statusLabelEl = document.querySelector("#status-label");
const statusTextEl = document.querySelector("#status-text");
const hintEl = document.querySelector("#hint");
const categoryEl = document.querySelector("#category");
const difficultyEl = document.querySelector("#difficulty");
const newRoundButton = document.querySelector("#new-round");
const failStickerEl = document.querySelector("#fail-sticker");
const gallowsParts = [...document.querySelectorAll("[data-gallows-part]")];
const gallowsSupport = document.querySelector("[data-gallows-support]");
const bodyParts = [...document.querySelectorAll(".body-part")];

let answer = "";
let guessed = new Set();
let mistakes = 0;
let maxMistakes = difficulties.normal.maxMistakes;
let isGameOver = false;

function normalizeLetter(letter) {
  return letter.toLocaleUpperCase("de-DE");
}

function getPool() {
  if (categoryEl.value === "all") {
    return Object.values(words).flat();
  }

  return words[categoryEl.value];
}

function chooseWord() {
  const pool = getPool();
  return pool[Math.floor(Math.random() * pool.length)];
}

function createKeyboard() {
  keyboardEl.innerHTML = "";

  alphabet.forEach((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key";
    button.textContent = letter;
    button.dataset.letter = letter;
    button.setAttribute("aria-label", `Buchstabe ${letter}`);
    button.addEventListener("click", () => guess(letter));
    keyboardEl.append(button);
  });
}

function renderWord(reveal = false) {
  wordEl.innerHTML = "";

  [...answer].forEach((character) => {
    const slot = document.createElement("span");
    slot.className = "letter-slot";
    const normalized = normalizeLetter(character);
    slot.textContent = reveal || guessed.has(normalized) ? character : "";
    slot.setAttribute("aria-label", slot.textContent || "offen");
    wordEl.append(slot);
  });
}

function renderKeyboard() {
  document.querySelectorAll(".key").forEach((button) => {
    const letter = button.dataset.letter;
    const wasGuessed = guessed.has(letter);
    button.disabled = wasGuessed || isGameOver;
    button.classList.toggle("is-correct", wasGuessed && answer.toLocaleUpperCase("de-DE").includes(letter));
    button.classList.toggle("is-wrong", wasGuessed && !answer.toLocaleUpperCase("de-DE").includes(letter));
  });
}

function renderDrawing() {
  const difficulty = difficulties[difficultyEl.value];
  const gallowsMistakes = difficulty.gallowsMistakes ?? 0;
  const bodyMistakes = Math.max(0, mistakes - gallowsMistakes);
  const visibleBodyParts = isGameOver && mistakes >= maxMistakes
    ? bodyParts.length
    : Math.ceil((bodyMistakes / (maxMistakes - gallowsMistakes)) * bodyParts.length);

  gallowsParts.forEach((part, index) => {
    part.classList.toggle("is-visible", gallowsMistakes === 0 || index < mistakes);
  });

  gallowsSupport.classList.toggle("is-visible", gallowsMistakes === 0 || mistakes >= 2);

  bodyParts.forEach((part, index) => {
    part.classList.toggle("is-visible", index < visibleBodyParts);
  });
}

function updateStats() {
  mistakesEl.textContent = `${mistakes} / ${maxMistakes}`;
  attemptsEl.textContent = guessed.size;
}

function setStatus(label, text) {
  statusLabelEl.textContent = label;
  statusTextEl.textContent = text;
}

function playFailTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.42);

  [220, 165].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.16);
    oscillator.connect(gain);
    oscillator.start(audioContext.currentTime + index * 0.16);
    oscillator.stop(audioContext.currentTime + index * 0.16 + 0.22);
  });

  window.setTimeout(() => audioContext.close(), 520);
}

function hasWon() {
  return [...answer].every((character) => guessed.has(normalizeLetter(character)));
}

function endGame(won) {
  isGameOver = true;
  stage.classList.toggle("is-won", won);
  stage.classList.toggle("is-lost", !won);
  renderWord(true);
  renderKeyboard();

  if (won) {
    setStatus("Gewonnen", "Stark geraten. Noch eine Runde?");
    hintEl.textContent = `Das Wort war: ${answer}`;
  } else {
    failStickerEl.setAttribute("aria-hidden", "false");
    playFailTone();
    setStatus("Verloren", "Der Galgen ist komplett. Direkt Revanche?");
    hintEl.textContent = `Gesucht war: ${answer}`;
  }
}

function guess(letter) {
  if (isGameOver || guessed.has(letter)) {
    return;
  }

  guessed.add(letter);

  if (!answer.toLocaleUpperCase("de-DE").includes(letter)) {
    mistakes += 1;
  }

  renderWord();
  renderKeyboard();
  renderDrawing();
  updateStats();

  if (hasWon()) {
    endGame(true);
    return;
  }

  if (mistakes >= maxMistakes) {
    endGame(false);
    return;
  }

  const remaining = maxMistakes - mistakes;
  setStatus("Am Zug", remaining === 1 ? "Nur noch ein Fehlversuch." : `Noch ${remaining} Fehlversuche.`);
}

function startRound() {
  answer = chooseWord();
  guessed = new Set();
  mistakes = 0;
  maxMistakes = difficulties[difficultyEl.value].maxMistakes;
  isGameOver = false;
  failStickerEl.setAttribute("aria-hidden", "true");
  stage.classList.remove("is-won", "is-lost", "is-building-gallows");
  stage.classList.toggle("is-building-gallows", Boolean(difficulties[difficultyEl.value].gallowsMistakes));
  setStatus("Bereit", `Modus ${difficulties[difficultyEl.value].label}: Errate das Wort.`);
  hintEl.textContent = "Tipp: Du kannst auch deine Tastatur benutzen.";
  renderWord();
  renderKeyboard();
  renderDrawing();
  updateStats();
}

newRoundButton.addEventListener("click", startRound);
categoryEl.addEventListener("change", startRound);
difficultyEl.addEventListener("change", startRound);

document.addEventListener("keydown", (event) => {
  const letter = normalizeLetter(event.key);

  if (alphabet.includes(letter)) {
    guess(letter);
  }
});

createKeyboard();
startRound();
