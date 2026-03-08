import { BOARD_WIDTH, VISIBLE_HEIGHT, HIDDEN_HEIGHT } from './constants.js';

function getBoardBounds() {
  const shell = document.querySelector('.board-area');
  const shellW = shell ? shell.clientWidth : window.innerWidth;
  const shellH = window.innerHeight - 180;
  const maxW = Math.max(220, Math.floor(shellW - 20));
  const maxH = Math.max(240, Math.floor(shellH));

  const cellByWidth = Math.floor(maxW / BOARD_WIDTH);
  const cellByHeight = Math.floor(maxH / VISIBLE_HEIGHT);
  const cell = Math.max(10, Math.min(cellByWidth, cellByHeight));

  return {
    cssW: cell * BOARD_WIDTH,
    cssH: cell * VISIBLE_HEIGHT,
    cell,
  };
}

export function resizeCanvas(canvas) {
  const { cssW, cssH, cell } = getBoardBounds();
  const scale = window.devicePixelRatio || 1;

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.floor(cssW * scale);
  canvas.height = Math.floor(cssH * scale);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  return { cell, cssW, cssH };
}

function drawGrid(ctx, layout) {
  const { cell } = layout;
  ctx.strokeStyle = '#28345d';
  ctx.lineWidth = 1;

  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    const px = x * cell + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, VISIBLE_HEIGHT * cell);
    ctx.stroke();
  }

  for (let y = 0; y <= VISIBLE_HEIGHT; y += 1) {
    const py = y * cell + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(BOARD_WIDTH * cell, py);
    ctx.stroke();
  }
}

function drawCell(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x * size + size * 0.15, y * size + size * 0.15, size * 0.65, size * 0.65);
}

export function render(state, layout, ctx) {
  const { cell } = layout;
  const boardW = BOARD_WIDTH * cell;
  const boardH = VISIBLE_HEIGHT * cell;

  ctx.clearRect(0, 0, boardW, boardH);
  ctx.fillStyle = '#091124';
  ctx.fillRect(0, 0, boardW, boardH);

  for (let y = HIDDEN_HEIGHT; y < state.board.length; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const color = state.board[y][x];
      if (!color) {
        continue;
      }
      drawCell(ctx, x, y - HIDDEN_HEIGHT, cell, color);
    }
  }

  if (state.active) {
    state.active.shape.forEach((row, py) => {
      row.forEach((cellOccupied, px) => {
        if (!cellOccupied) {
          return;
        }
        const y = state.active.y + py - HIDDEN_HEIGHT;
        const x = state.active.x + px;
        if (y < 0 || y >= VISIBLE_HEIGHT) {
          return;
        }
        drawCell(ctx, x, y, cell, state.active.color);
      });
    });
  }

  drawGrid(ctx, layout);
}
