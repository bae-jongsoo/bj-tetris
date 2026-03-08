import {
  BOARD_WIDTH,
  VISIBLE_HEIGHT,
  HIDDEN_HEIGHT,
  VFX_ROTATE_MS,
  VFX_LINE_CLEAR_MS,
  VFX_IMPACT_MS,
} from './constants.js';

function getBoardBounds() {
  const shell = document.querySelector('.board-area');
  const shellW = shell ? shell.clientWidth : window.innerWidth;
  const shellH = window.innerHeight - 220;
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

function drawCell(ctx, x, y, size, color, glow = false) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
  if (glow) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x * size + size * 0.12, y * size + size * 0.12, size * 0.76, size * 0.76);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x * size + size * 0.15, y * size + size * 0.15, size * 0.65, size * 0.65);
  }
}

function drawLineClearFlash(ctx, state, layout, now) {
  const { lineFlashUntil, lineFlashRows } = state.vfx;
  const remaining = lineFlashUntil - now;
  if (remaining <= 0 || !lineFlashRows.length) {
    return;
  }

  const alpha = Math.min(0.5, Math.max(0.05, remaining / VFX_LINE_CLEAR_MS));
  const { cell } = layout;
  ctx.save();
  ctx.fillStyle = `rgba(255, 120, 120, ${alpha})`;
  lineFlashRows.forEach((row) => {
    if (row >= 0 && row < VISIBLE_HEIGHT) {
      ctx.fillRect(0, row * cell, BOARD_WIDTH * cell, cell);
    }
  });
  ctx.restore();
}

function drawImpactPulse(ctx, state, layout, now) {
  const remaining = state.vfx.impactUntil - now;
  if (remaining <= 0) {
    return;
  }

  const { cell } = layout;
  const alpha = Math.min(0.4, Math.max(0.05, remaining / VFX_IMPACT_MS));
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillRect(0, 0, BOARD_WIDTH * cell, VISIBLE_HEIGHT * cell);
  ctx.restore();
}

function drawRotatePulse(ctx, state, layout, now) {
  if (!state.active || state.vfx.rotateUntil <= now) {
    return;
  }

  const alpha = Math.min(0.5, Math.max(0.06, (state.vfx.rotateUntil - now) / VFX_ROTATE_MS));
  const { cell } = layout;
  const bounds = {
    x: 0,
    y: 0,
    width: state.active.shape[0].length * cell,
    height: state.active.shape.length * cell,
  };

  const px = state.active.x * cell;
  const py = (state.active.y - HIDDEN_HEIGHT) * cell;

  bounds.x = px - 2;
  bounds.y = py - 2;
  bounds.width += 4;
  bounds.height += 4;

  ctx.save();
  ctx.strokeStyle = `rgba(130, 210, 255, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

export function render(state, layout, ctx, now = Date.now()) {
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
    const rotating = state.vfx.rotateUntil > now;
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
        drawCell(ctx, x, y, cell, state.active.color, rotating);
      });
    });
  }

  drawRotatePulse(ctx, state, layout, now);
  drawLineClearFlash(ctx, state, layout, now);
  drawImpactPulse(ctx, state, layout, now);
  drawGrid(ctx, layout);
}
