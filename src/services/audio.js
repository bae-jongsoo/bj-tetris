import { SFX_KEYS } from '../constants.js';

const SFX_DEFINITIONS = {
  [SFX_KEYS.MOVE]: { type: 'square', freq: 420, dur: 45, gain: 0.08, cooldown: 80 },
  [SFX_KEYS.ROTATE]: { type: 'triangle', freq: 660, dur: 48, gain: 0.09, cooldown: 120 },
  [SFX_KEYS.SOFT_DROP_TICK]: { type: 'square', freq: 300, dur: 20, gain: 0.05, cooldown: 70 },
  [SFX_KEYS.HARD_DROP]: { type: 'triangle', freq: 860, dur: 60, gain: 0.11, cooldown: 100 },
  [SFX_KEYS.LOCK]: { type: 'sine', freq: 240, dur: 50, gain: 0.07, cooldown: 70 },
  [SFX_KEYS.LINE_CLEAR_1]: { type: 'triangle', freq: 520, dur: 80, gain: 0.13, cooldown: 50 },
  [SFX_KEYS.LINE_CLEAR_2]: { type: 'triangle', freq: 650, dur: 85, gain: 0.14, cooldown: 40 },
  [SFX_KEYS.LINE_CLEAR_3]: { type: 'triangle', freq: 760, dur: 90, gain: 0.15, cooldown: 40 },
  [SFX_KEYS.LINE_CLEAR_4]: { type: 'triangle', freq: 900, dur: 110, gain: 0.17, cooldown: 40 },
  [SFX_KEYS.GAME_OVER]: { type: 'sawtooth', freq: 180, dur: 130, gain: 0.15, cooldown: 0 },
  [SFX_KEYS.LEVEL_UP]: { type: 'triangle', freq: 700, dur: 100, gain: 0.12, cooldown: 100 },
  [SFX_KEYS.PAUSE]: { type: 'sine', freq: 260, dur: 40, gain: 0.08, cooldown: 0 },
  [SFX_KEYS.RESUME]: { type: 'sine', freq: 460, dur: 40, gain: 0.08, cooldown: 0 },
  [SFX_KEYS.START]: { type: 'triangle', freq: 600, dur: 90, gain: 0.1, cooldown: 0 },
  [SFX_KEYS.RESTART]: { type: 'triangle', freq: 640, dur: 80, gain: 0.1, cooldown: 0 },
};

let ctx = null;
let enabled = true;
const lastPlayed = new Map();

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function ensureContext() {
  if (ctx) {
    return ctx;
  }

  const AudioApi = (globalThis && (globalThis.AudioContext || globalThis.webkitAudioContext)) || null;
  if (!AudioApi) {
    return null;
  }

  ctx = new AudioApi();
  return ctx;
}

export function initAudio() {
  const audioContext = ensureContext();
  if (audioContext && audioContext.state === 'suspended' && typeof audioContext.resume === 'function') {
    audioContext.resume().catch(() => {});
  }
}

export function setAudioEnabled(isEnabled) {
  enabled = !!isEnabled;
}

export function isAudioEnabled() {
  return enabled;
}

export function canPlayAudio() {
  return !!ensureContext();
}

function playTone(def) {
  if (!ctx || ctx.state !== 'running') {
    return;
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = def.type || 'square';
  osc.frequency.setValueAtTime(def.freq || 440, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(def.gain || 0.08, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (def.dur || 60) / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (def.dur || 60) / 1000 + 0.01);
}

export function play(effect) {
  if (!enabled || !ctx) {
    return;
  }

  const def = SFX_DEFINITIONS[effect];
  if (!def) {
    return;
  }

  const cd = def.cooldown || 0;
  const key = `${effect}`;
  const last = lastPlayed.get(key) || 0;
  const t = nowMs();
  if (cd > 0 && t - last < cd) {
    return;
  }

  lastPlayed.set(key, t);
  playTone(def);
}
