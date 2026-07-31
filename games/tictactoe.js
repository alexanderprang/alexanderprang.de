const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const OPTIMAL_MOVE_CHANCE = { easy: 0.2, medium: 0.55, hard: 1 };

const boardEl = document.querySelector("#board");
const cells = [...document.querySelectorAll(".ttt-cell")];
const modeEl = document.querySelector("#mode");
const difficultyControl = document.querySelector("#difficulty-control");
const difficultyEl = document.querySelector("#difficulty");
const newRoundButton = document.querySelector("#new-round");
const statusLabelEl = document.querySelector("#status-label");
const statusTextEl = document.querySelector("#status-text");
const scoreXEl = document.querySelector("#score-x");
const scoreOEl = document.querySelector("#score-o");
const scoreDrawEl = document.querySelector("#score-draw");

let board = Array(9).fill(null);
let currentPlayer = "X";
let isGameOver = false;
let isComputerTurn = false;
let scores = { X: 0, O: 0, draw: 0 };

function setStatus(label, text) {
  statusLabelEl.textContent = label;
  statusTextEl.textContent = text;
}

function updateScores() {
  scoreXEl.textContent = String(scores.X);
  scoreOEl.textContent = String(scores.O);
  scoreDrawEl.textContent = String(scores.draw);
}

function findWinningLine(cellState) {
  return WIN_LINES.find(
    ([a, b, c]) => cellState[a] && cellState[a] === cellState[b] && cellState[a] === cellState[c],
  );
}

function renderBoard(winningLine) {
  cells.forEach((cell, index) => {
    const mark = board[index];
    cell.textContent = mark ?? "";
    cell.disabled = Boolean(mark) || isGameOver || isComputerTurn;
    cell.classList.toggle("is-x", mark === "X");
    cell.classList.toggle("is-o", mark === "O");
    cell.classList.toggle("is-winning", Boolean(winningLine) && winningLine.includes(index));
  });
}

function endGame(winningLine) {
  isGameOver = true;

  if (winningLine) {
    scores[currentPlayer] += 1;
    setStatus("Gewonnen", `Spieler ${currentPlayer} hat gewonnen!`);
  } else {
    scores.draw += 1;
    setStatus("Unentschieden", "Kein Feld mehr frei.");
  }

  updateScores();
  renderBoard(winningLine);
}

function bestComputerMove(cellState) {
  function minimax(state, player) {
    const winningLine = findWinningLine(state);
    if (winningLine) {
      return { score: state[winningLine[0]] === "O" ? 10 : -10 };
    }
    if (state.every((mark) => mark)) {
      return { score: 0 };
    }

    const moves = [];
    state.forEach((mark, index) => {
      if (mark) {
        return;
      }
      const next = [...state];
      next[index] = player;
      const result = minimax(next, player === "O" ? "X" : "O");
      moves.push({ index, score: result.score });
    });

    return player === "O"
      ? moves.reduce((best, move) => (move.score > best.score ? move : best))
      : moves.reduce((best, move) => (move.score < best.score ? move : best));
  }

  return minimax(cellState, "O").index;
}

function randomMove(cellState) {
  const emptyIndexes = cellState.reduce((acc, mark, index) => {
    if (!mark) acc.push(index);
    return acc;
  }, []);
  return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
}

function computerChoice(cellState) {
  const optimalChance = OPTIMAL_MOVE_CHANCE[difficultyEl.value] ?? 1;
  return Math.random() < optimalChance ? bestComputerMove(cellState) : randomMove(cellState);
}

function playAt(index) {
  if (isGameOver || isComputerTurn || board[index]) {
    return;
  }

  board[index] = currentPlayer;

  const winningLine = findWinningLine(board);
  if (winningLine) {
    endGame(winningLine);
    return;
  }

  if (board.every((mark) => mark)) {
    endGame(null);
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setStatus("Am Zug", `Spieler ${currentPlayer} ist dran.`);
  renderBoard();

  if (modeEl.value === "computer" && currentPlayer === "O") {
    isComputerTurn = true;
    renderBoard();
    window.setTimeout(computerMove, 400);
  }
}

function computerMove() {
  isComputerTurn = false;

  if (isGameOver) {
    return;
  }

  playAt(computerChoice(board));
}

function updateDifficultyVisibility() {
  difficultyControl.hidden = modeEl.value !== "computer";
}

function startRound() {
  board = Array(9).fill(null);
  currentPlayer = "X";
  isGameOver = false;
  isComputerTurn = false;
  setStatus("Am Zug", "Spieler X ist dran.");
  renderBoard();
}

boardEl.addEventListener("click", (event) => {
  const cell = event.target.closest(".ttt-cell");
  if (cell) {
    playAt(Number(cell.dataset.index));
  }
});

newRoundButton.addEventListener("click", startRound);
modeEl.addEventListener("change", () => {
  updateDifficultyVisibility();
  startRound();
});
difficultyEl.addEventListener("change", startRound);

updateDifficultyVisibility();

startRound();
