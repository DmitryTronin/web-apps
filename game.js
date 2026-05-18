const size = 14;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const wordBank = [
  "BROWSER",
  "SCRIPT",
  "PUZZLE",
  "SEARCH",
  "LETTER",
  "DRAGON",
  "COLUMN",
  "DIAGONAL",
  "HIDDEN",
  "SELECT",
  "VECTOR",
  "RANDOM",
  "SCREEN",
  "BUTTON",
  "MATRIX",
  "PLAYER",
  "CURSOR",
  "LOGIC",
];

const directions = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
  { row: 0, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: -1 },
  { row: -1, col: 1 },
];

const boardEl = document.querySelector("#board");
const wordListEl = document.querySelector("#wordList");
const statusEl = document.querySelector("#status");
const scoreEl = document.querySelector("#score");
const newGameButton = document.querySelector("#newGameButton");

let grid = [];
let placedWords = [];
let foundWords = new Set();
let isDragging = false;
let dragStart = null;
let currentSelection = [];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createEmptyGrid() {
  return Array.from({ length: size }, () => Array(size).fill(""));
}

function isInBounds(row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function getPath(row, col, direction, length) {
  const path = [];

  for (let index = 0; index < length; index += 1) {
    const nextRow = row + direction.row * index;
    const nextCol = col + direction.col * index;

    if (!isInBounds(nextRow, nextCol)) {
      return null;
    }

    path.push({ row: nextRow, col: nextCol });
  }

  return path;
}

function canPlace(word, path) {
  return path.every(({ row, col }, index) => {
    return grid[row][col] === "" || grid[row][col] === word[index];
  });
}

function placeWord(word) {
  const attempts = 260;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const direction = randomItem(directions);
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    const path = getPath(row, col, direction, word.length);

    if (!path || !canPlace(word, path)) {
      continue;
    }

    path.forEach(({ row: pathRow, col: pathCol }, index) => {
      grid[pathRow][pathCol] = word[index];
    });

    placedWords.push({ word, path });
    return true;
  }

  return false;
}

function fillGrid() {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = randomItem(alphabet);
      }
    }
  }
}

function generatePuzzle() {
  grid = createEmptyGrid();
  placedWords = [];
  foundWords = new Set();

  shuffle(wordBank)
    .slice(0, 10)
    .sort((a, b) => b.length - a.length)
    .forEach((word) => placeWord(word));

  fillGrid();
}

function cellKey({ row, col }) {
  return `${row}-${col}`;
}

function getCell(row, col) {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function renderBoard() {
  boardEl.replaceChildren();

  grid.forEach((rowLetters, row) => {
    rowLetters.forEach((letter, col) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.textContent = letter;
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}, ${letter}`);
      boardEl.append(cell);
    });
  });
}

function renderWords() {
  wordListEl.replaceChildren();

  placedWords
    .map(({ word }) => word)
    .sort()
    .forEach((word) => {
      const item = document.createElement("li");
      item.textContent = word;
      item.dataset.word = word;
      if (foundWords.has(word)) {
        item.classList.add("found");
      }
      wordListEl.append(item);
    });
}

function updateScore() {
  scoreEl.textContent = `${foundWords.size} / ${placedWords.length}`;

  if (foundWords.size === placedWords.length) {
    statusEl.textContent = "Grid complete. Start a new one when ready.";
  } else if (foundWords.size === 0) {
    statusEl.textContent = "Find every hidden word.";
  } else {
    statusEl.textContent = `${placedWords.length - foundWords.size} words left.`;
  }
}

function markFoundWord(match) {
  foundWords.add(match.word);

  match.path.forEach(({ row, col }) => {
    getCell(row, col).classList.add("found");
  });

  const wordItem = wordListEl.querySelector(`[data-word="${match.word}"]`);
  wordItem.classList.add("found");
  updateScore();
}

function clearSelection() {
  currentSelection.forEach(({ row, col }) => {
    getCell(row, col).classList.remove("selecting");
  });
  currentSelection = [];
}

function paintSelection(path) {
  clearSelection();
  currentSelection = path;
  currentSelection.forEach(({ row, col }) => {
    getCell(row, col).classList.add("selecting");
  });
}

function straightLinePath(start, end) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const rowDistance = Math.abs(rowDelta);
  const colDistance = Math.abs(colDelta);
  const isHorizontal = rowDelta === 0;
  const isVertical = colDelta === 0;
  const isDiagonal = rowDistance === colDistance;

  if (!isHorizontal && !isVertical && !isDiagonal) {
    return [start];
  }

  const length = Math.max(rowDistance, colDistance) + 1;
  return Array.from({ length }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index,
  }));
}

function samePath(firstPath, secondPath) {
  if (firstPath.length !== secondPath.length) {
    return false;
  }

  return firstPath.every((coords, index) => {
    const otherCoords = secondPath[index];
    return coords.row === otherCoords.row && coords.col === otherCoords.col;
  });
}

function findMatch(path) {
  return placedWords.find(({ word, path: hiddenPath }) => {
    return (
      !foundWords.has(word) &&
      (samePath(path, hiddenPath) || samePath(path, [...hiddenPath].reverse()))
    );
  });
}

function coordinatesFromEvent(event) {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const cell = target?.closest?.(".cell");

  if (!cell || !boardEl.contains(cell)) {
    return null;
  }

  return {
    row: Number(cell.dataset.row),
    col: Number(cell.dataset.col),
  };
}

function startDrag(event) {
  const coords = coordinatesFromEvent(event);

  if (!coords) {
    return;
  }

  event.preventDefault();
  isDragging = true;
  dragStart = coords;
  boardEl.setPointerCapture(event.pointerId);
  paintSelection([coords]);
}

function moveDrag(event) {
  if (!isDragging || !dragStart) {
    return;
  }

  const coords = coordinatesFromEvent(event);

  if (!coords) {
    return;
  }

  paintSelection(straightLinePath(dragStart, coords));
}

function endDrag(event) {
  if (!isDragging) {
    return;
  }

  const match = findMatch(currentSelection);
  if (match) {
    markFoundWord(match);
  }

  clearSelection();
  isDragging = false;
  dragStart = null;

  if (boardEl.hasPointerCapture(event.pointerId)) {
    boardEl.releasePointerCapture(event.pointerId);
  }
}

function startGame() {
  generatePuzzle();
  renderBoard();
  renderWords();
  updateScore();
}

boardEl.addEventListener("pointerdown", startDrag);
boardEl.addEventListener("pointermove", moveDrag);
boardEl.addEventListener("pointerup", endDrag);
boardEl.addEventListener("pointercancel", endDrag);
newGameButton.addEventListener("click", startGame);

startGame();
