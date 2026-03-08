import { resizeCanvas, render } from './render.js';
import { createInitialState, stepPhysics } from './state.js';

const canvas = document.getElementById('gameCanvas');
const statusText = document.getElementById('statusText');
const levelText = document.getElementById('levelText');
const linesText = document.getElementById('linesText');
const scoreText = document.getElementById('scoreText');
const restartBtn = document.getElementById('restartBtn');
const ctx = canvas.getContext('2d');

let gameState = createInitialState();
let lastTime = 0;
let layout = resizeCanvas(canvas);

function applyHud() {
  statusText.textContent = gameState.status.toUpperCase();
  levelText.textContent = String(gameState.level);
  linesText.textContent = String(gameState.lines);
  scoreText.textContent = String(gameState.score);
}

function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;
  stepPhysics(gameState, Number.isFinite(delta) ? delta : 0);
  render(gameState, layout, ctx);
  applyHud();
  requestAnimationFrame(gameLoop);
}

function restart() {
  gameState = createInitialState();
  gameState.status = 'playing';
}

restartBtn.addEventListener('click', restart);
window.addEventListener('resize', () => {
  layout = resizeCanvas(canvas);
});

layout = resizeCanvas(canvas);
requestAnimationFrame((time) => {
  lastTime = time;
  gameLoop(time);
});
