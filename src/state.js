import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  HIDDEN_HEIGHT,
  PIECE_TYPES,
  PIECE_SHAPES,
  PIECE_COLOR,
} from './constants.js';

export function makeBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

function randomPieceType() {
  const index = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[index];
}

function createPiece(type) {
  const pieceType = type || randomPieceType();
  const shape = PIECE_SHAPES[pieceType];
  const width = shape[0].length;
  return {
    type: pieceType,
    shape,
    color: PIECE_COLOR[pieceType],
    x: Math.floor((BOARD_WIDTH - width) / 2),
    y: 0,
  };
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
    dropMs: 800,
    dropAccumulator: 0,
    lastTick: 0,
    softDrop: false,
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

export function spawnNextPiece(state) {
  state.active = state.next;
  state.next = createPiece();
}

export function stepDrop(state) {
  const next = { ...state.active, y: state.active.y + 1 };
  if (canPlacePiece(state, next)) {
    state.active = next;
    return;
  }

  const overflow = lockActivePiece(state);
  if (overflow) {
    state.status = 'gameover';
    return;
  }

  spawnNextPiece(state);
  if (!canPlacePiece(state, state.active)) {
    state.status = 'gameover';
  }
}

export function stepPhysics(state, deltaMs) {
  if (state.status !== 'playing') {
    return;
  }

  state.dropAccumulator += deltaMs;
  while (state.dropAccumulator >= state.dropMs && state.status === 'playing') {
    state.dropAccumulator -= state.dropMs;
    stepDrop(state);
  }
}
