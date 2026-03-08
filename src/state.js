import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  HIDDEN_HEIGHT,
  PIECE_TYPES,
  PIECE_SHAPES,
  PIECE_COLOR,
  BASE_DROP_MS,
  SOFT_DROP_FACTOR,
  MIN_DROP_MS,
  SCORE_BY_LINES,
} from './constants.js';

function cloneShape(shape) {
  return shape.map((row) => row.slice());
}

export function makeBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

function randomPieceType() {
  const index = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[index];
}

function rotateShapeCW(shape) {
  const h = shape.length;
  const w = shape[0].length;
  const next = Array.from({ length: w }, () => Array(h).fill(0));

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!shape[y][x]) {
        continue;
      }
      next[x][h - 1 - y] = 1;
    }
  }

  return next;
}

function computeDropMs(level) {
  return Math.max(MIN_DROP_MS, Math.floor(BASE_DROP_MS * Math.pow(0.9, level - 1)));
}

function createPiece(type) {
  const pieceType = type || randomPieceType();
  const shape = cloneShape(PIECE_SHAPES[pieceType]);
  const width = shape[0].length;

  return {
    type: pieceType,
    shape,
    color: PIECE_COLOR[pieceType],
    x: Math.floor((BOARD_WIDTH - width) / 2),
    y: 0,
  };
}

function getDropMsForState(state) {
  return Math.max(MIN_DROP_MS, Math.floor(state.softDrop ? state.dropMs * SOFT_DROP_FACTOR : state.dropMs));
}

export function createInitialState() {
  return {
    status: 'playing',
    board: makeBoard(),
    active: createPiece(),
    next: createPiece(),
    score: 0,
    lines: 0,
    level: 1,
    dropMs: BASE_DROP_MS,
    dropAccumulator: 0,
    softDrop: false,
    lastClearLines: 0,
  };
}

export function canPlacePiece(state, piece) {
  const { shape, x, y } = piece;

  for (let py = 0; py < shape.length; py += 1) {
    for (let px = 0; px < shape[py].length; px += 1) {
      if (!shape[py][px]) {
        continue;
      }

      const nx = x + px;
      const ny = y + py;

      if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) {
        return false;
      }
      if (ny < 0) {
        continue;
      }
      if (state.board[ny][nx] !== 0) {
        return false;
      }
    }
  }

  return true;
}

function lockActivePiece(state) {
  const piece = state.active;
  if (!piece) {
    return false;
  }

  let overflow = false;

  piece.shape.forEach((row, py) => {
    row.forEach((cell, px) => {
      if (!cell) {
        return;
      }

      const x = piece.x + px;
      const y = piece.y + py;
      if (y < 0) {
        return;
      }
      if (y < HIDDEN_HEIGHT) {
        overflow = true;
      }
      state.board[y][x] = piece.color;
    });
  });

  return overflow;
}

function clearFullLines(state) {
  let cleared = 0;
  for (let y = state.board.length - 1; y >= 0; y -= 1) {
    const isLineFull = state.board[y].every((cell) => cell !== 0);
    if (!isLineFull) {
      continue;
    }

    state.board.splice(y, 1);
    state.board.unshift(Array(BOARD_WIDTH).fill(0));
    cleared += 1;
  }

  if (cleared > 0) {
    state.score += SCORE_BY_LINES[Math.min(cleared, 4)] * state.level;
    state.lines += cleared;
    const nextLevel = Math.floor(state.lines / 10) + 1;
    if (nextLevel !== state.level) {
      state.level = nextLevel;
      state.dropMs = computeDropMs(state.level);
    }
  }

  state.lastClearLines = cleared;
  return cleared;
}

export function spawnNextPiece(state) {
  state.active = state.next;
  state.next = createPiece();
  if (!canPlacePiece(state, state.active)) {
    state.status = 'gameover';
  }
}

function settleActive(state) {
  const overflow = lockActivePiece(state);
  clearFullLines(state);

  if (overflow) {
    state.status = 'gameover';
    return;
  }

  spawnNextPiece(state);
}

export function stepDrop(state) {
  if (state.status !== 'playing') {
    return;
  }

  const next = { ...state.active, y: state.active.y + 1 };
  if (canPlacePiece(state, next)) {
    state.active = next;
    return;
  }

  settleActive(state);
}

export function moveActivePiece(state, direction) {
  if (state.status !== 'playing' || !state.active) {
    return false;
  }

  const dx = direction === 'left' ? -1 : 1;
  const next = { ...state.active, x: state.active.x + dx };
  if (!canPlacePiece(state, next)) {
    return false;
  }

  state.active = next;
  return true;
}

export function rotateActivePiece(state) {
  if (state.status !== 'playing' || !state.active) {
    return false;
  }

  const rotated = {
    ...state.active,
    shape: rotateShapeCW(state.active.shape),
  };

  const attempts = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let i = 0; i < attempts.length; i += 1) {
    const [dx, dy] = attempts[i];
    const candidate = {
      ...rotated,
      x: rotated.x + dx,
      y: rotated.y + dy,
    };

    if (canPlacePiece(state, candidate)) {
      state.active = candidate;
      return true;
    }
  }

  return false;
}

export function setSoftDrop(state, enabled) {
  if (state.status !== 'playing') {
    state.softDrop = false;
    return;
  }
  state.softDrop = !!enabled;
}

export function hardDropPiece(state) {
  if (state.status !== 'playing' || !state.active) {
    return 0;
  }

  let distance = 0;
  while (true) {
    const next = { ...state.active, y: state.active.y + 1 };
    if (!canPlacePiece(state, next)) {
      break;
    }
    state.active = next;
    distance += 1;
  }

  if (distance > 0) {
    state.score += distance * 2;
  }

  settleActive(state);
  return distance;
}

export function togglePause(state) {
  if (state.status === 'playing') {
    state.status = 'paused';
    state.softDrop = false;
    state.dropAccumulator = 0;
    return true;
  }

  if (state.status === 'paused') {
    state.status = 'playing';
    state.dropAccumulator = 0;
    return true;
  }

  return false;
}

export function stepPhysics(state, deltaMs) {
  if (state.status !== 'playing') {
    return;
  }

  state.dropAccumulator += deltaMs;
  const dropMs = getDropMsForState(state);
  while (state.dropAccumulator >= dropMs && state.status === 'playing') {
    state.dropAccumulator -= dropMs;
    stepDrop(state);
    if (state.status === 'gameover') {
      break;
    }
  }
}
