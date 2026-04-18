// ========================================
// Keyboard bindings (persisted)
// ========================================

const STORAGE_KEY = 'beeBrave_keybinds';

/** @type {Record<string, string[]>} */
const DEFAULT_BINDINGS = {
  moveUp: ['KeyW', 'ArrowUp'],
  moveDown: ['KeyS', 'KeyX', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  shoot: ['Space'],
  special: ['KeyV'],
  cycle: ['ShiftLeft', 'ShiftRight'],
  heavy: ['KeyB'],
  defensive: ['KeyC'],
  restart: ['KeyR']
};

/** @type {Record<string, string[]>} */
let bindings = cloneBindings(DEFAULT_BINDINGS);

let remapListenActionId = null;

export const BINDING_ROWS = [
  { id: 'moveUp', label: 'Move up' },
  { id: 'moveDown', label: 'Move down' },
  { id: 'moveLeft', label: 'Move left' },
  { id: 'moveRight', label: 'Move right' },
  { id: 'shoot', label: 'Fire' },
  { id: 'special', label: 'Special weapon' },
  { id: 'cycle', label: 'Cycle special' },
  { id: 'heavy', label: 'Heavy ordnance' },
  { id: 'defensive', label: 'Defensive tech' },
  { id: 'restart', label: 'Restart (game over)' }
];

function cloneBindings(src) {
  const out = {};
  for (const k of Object.keys(src)) {
    out[k] = [...src[k]];
  }
  return out;
}

function loadBindings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    const next = cloneBindings(DEFAULT_BINDINGS);
    for (const id of Object.keys(DEFAULT_BINDINGS)) {
      if (!Array.isArray(parsed[id])) continue;
      const codes = parsed[id].filter(c => typeof c === 'string' && c.length > 0);
      if (codes.length) next[id] = codes;
    }
    bindings = next;
  } catch {
    // keep defaults
  }
}

function saveBindings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    console.warn('Could not save key bindings');
  }
}

loadBindings();

export function getRemapListenActionId() {
  return remapListenActionId;
}

export function setRemapListenActionId(id) {
  remapListenActionId = id;
}

export function getBindingsSnapshot() {
  return cloneBindings(bindings);
}

export function resetBindingsToDefaults() {
  bindings = cloneBindings(DEFAULT_BINDINGS);
  saveBindings();
}

export function assignCodeToAction(actionId, code) {
  if (!DEFAULT_BINDINGS[actionId] || !code) return;
  for (const id of Object.keys(bindings)) {
    bindings[id] = bindings[id].filter(c => c !== code);
  }
  bindings[actionId] = [code];
  saveBindings();
}

export function codesForAction(actionId) {
  return bindings[actionId] ? [...bindings[actionId]] : [];
}

export function codeBelongsToAction(actionId, code) {
  const list = bindings[actionId];
  return !!(list && list.includes(code));
}

export function anyCodePressedForAction(actionId, pressedMap) {
  const list = bindings[actionId];
  if (!list) return false;
  return list.some(c => pressedMap[c]);
}

export function formatCodeLabel(code) {
  if (!code) return '—';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Esc';
  if (code.startsWith('Arrow')) {
    const rest = code.slice(5);
    if (rest === 'Up') return '↑';
    if (rest === 'Down') return '↓';
    if (rest === 'Left') return '←';
    if (rest === 'Right') return '→';
    return rest;
  }
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
  if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
  if (code === 'MetaLeft' || code === 'MetaRight') return '⌘';
  if (code === 'Enter' || code === 'NumpadEnter') return 'Enter';
  if (code === 'Backquote') return '`';
  if (code === 'Minus') return '-';
  if (code === 'Equal') return '=';
  if (code === 'BracketLeft') return '[';
  if (code === 'BracketRight') return ']';
  if (code === 'Backslash') return '\\';
  if (code === 'Semicolon') return ';';
  if (code === 'Quote') return "'";
  if (code === 'Comma') return ',';
  if (code === 'Period') return '.';
  if (code === 'Slash') return '/';
  return code;
}

export function formatActionBinding(actionId) {
  const codes = codesForAction(actionId);
  if (!codes.length) return '—';
  const labels = codes.map(formatCodeLabel);
  return [...new Set(labels)].join(' / ');
}
