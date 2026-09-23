const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = [
  'js/level.js',
  'js/game.js'
].map(file => fs.readFileSync(file, 'utf8')).join('\n');

const storage = {};
const context = {
  console,
  document: {
    getElementById: () => ({ textContent: '' })
  },
  fetch: async () => ({ json: async () => ({}) }),
  window: {
    requestAnimationFrame: () => {}
  },
  localStorage: {
    getItem: (key) => (key in storage ? storage[key] : null),
    setItem: (key, value) => { storage[key] = String(value); },
    removeItem: (key) => { delete storage[key]; }
  },
  Input: {
    left: false,
    right: false,
    jump: false,
    restart: false
  },
  CONFIG: {
    ROWS: 10,
    TILE: 40,
    PIECE_COLS: 8,
    CANVAS_W: 800,
    CANVAS_H: 400,
    START_LEVEL: 0,
    PLAYER_SIZE: 32,
    PLAYER_RADIUS: 16,
    LINE_WIDTH: 3,
    DOT_DISTANCE: 0.55,
    MOVE_SPEED: 4,
    JUMP_POWER: 15,
    GRAVITY: 0.8,
    MAX_FALL: 16
  },
  Level: {},
  Game: {}
};

vm.createContext(context);
vm.runInContext(source, context);

assert.strictEqual(typeof context.Level.collectCoinAt, 'function');
assert.strictEqual(typeof context.Game.addScore, 'function');
assert.strictEqual(typeof context.Game.showScore, 'function');
assert.strictEqual(typeof context.Game.resetCurrentScore, 'function');
assert.strictEqual(typeof context.Game.loadHighScore, 'function');

context.Game.currentScore = 0;
context.Game.highScore = 0;
context.Game.addScore(1);
assert.strictEqual(context.Game.currentScore, 1);
assert.strictEqual(context.Game.highScore, 1);

context.Game.resetCurrentScore();
assert.strictEqual(context.Game.currentScore, 0);
assert.strictEqual(context.Game.highScore, 1);

console.log('coin score tests passed');
