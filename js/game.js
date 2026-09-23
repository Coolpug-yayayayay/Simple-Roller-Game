/* =====================================================================
   game.js  --  THE RULES AND THE LOOP.

   The game is always in exactly ONE mode: "playing", "dead", or "won".
   Which mode it is in decides what happens each frame.

   The loop runs about 60 times a second, forever. Every time it runs it
   does the same two things: UPDATE (change the numbers) and DRAW (show
   the numbers).
   ===================================================================== */

var Game = {
  mode: "playing",   // "playing", "dead", or "won"
  levelNumber: 0,
  currentScore: 0,
  highScore: 0,
  highScoreKey: "roller-high-score",
  bullets: [],
  shootTimer: 0
};

Game.loadHighScore = function () {
  var saved = 0;
  if (typeof localStorage !== "undefined") {
    saved = Number(localStorage.getItem(Game.highScoreKey) || 0);
  }
  if (isNaN(saved)) { saved = 0; }
  Game.highScore = saved;
  Game.showScore();
};

Game.saveHighScore = function () {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(Game.highScoreKey, String(Game.highScore));
  }
};

Game.resetCurrentScore = function () {
  Game.currentScore = 0;
  Game.showScore();
};

Game.addScore = function (amount) {
  Game.currentScore = Game.currentScore + amount;
  if (Game.currentScore > Game.highScore) {
    Game.highScore = Game.currentScore;
    Game.saveHighScore();
  }
  Game.showScore();
};

Game.showScore = function () {
  var scoreEl = document.getElementById("score");
  if (scoreEl) { scoreEl.textContent = "Current: " + Game.currentScore + "   High: " + Game.highScore; }
};

Game.startLevel = function (levelNumber, resetScore) {
  Game.levelNumber = levelNumber;
  if (resetScore) { Game.resetCurrentScore(); }
  Level.build(levelNumber);
  Player.reset();
  Game.bullets = [];
  Game.shootTimer = 0;
  Game.mode = "playing";
  Game.showGameOverScreen(false);
  Game.showMessage("");
  Game.showScore();
};

Game.showMessage = function (text) {
  document.getElementById("message").textContent = text;
};

Game.showGameOverScreen = function (show) {
  var overlay = document.getElementById("game-over-screen");
  if (!overlay) { return; }
  overlay.classList.toggle("hidden", !show);
  var scoreEl = document.getElementById("game-over-score");
  if (scoreEl) {
    scoreEl.textContent = "Current score: " + Game.currentScore + "   High score: " + Game.highScore;
  }
};

Game.shoot = function () {
  if (!Input.shoot || Game.shootTimer > 0) { return; }
  Game.bullets.push({
    x: Player.x + CONFIG.PLAYER_SIZE,
    y: Player.y + CONFIG.PLAYER_SIZE / 2 - 3,
    width: 12,
    height: 6,
    vx: CONFIG.BULLET_SPEED
  });
  Game.shootTimer = CONFIG.SHOOT_COOLDOWN;
};

Game.updateBullets = function () {
  if (Game.shootTimer > 0) { Game.shootTimer--; }
  Game.shoot();
  for (var i = Game.bullets.length - 1; i >= 0; i--) {
    var bullet = Game.bullets[i];
    bullet.x += bullet.vx;
    if (Collide.hitsSolid(bullet.x, bullet.y, bullet.width, bullet.height)) {
      Game.bullets.splice(i, 1);
      continue;
    }
    for (var enemyIndex = Level.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      var enemy = Level.enemies[enemyIndex];
      if (enemy.alive && Collide.overlaps(bullet, enemy)) {
        enemy.alive = false;
        Game.bullets.splice(i, 1);
        break;
      }
    }
  }
};

Game.updateEnemies = function () {
  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    if (!enemy.alive) { continue; }
    var distance = Player.x - enemy.x;
    if (Math.abs(distance) < CONFIG.ENEMY_DASH_DISTANCE &&
        Math.abs(Player.y - enemy.y) < CONFIG.TILE) {
      enemy.dashing = true;
    }
    enemy.vx = enemy.dashing ? (distance < 0 ? -CONFIG.ENEMY_DASH_SPEED : CONFIG.ENEMY_DASH_SPEED) :
      (distance < 0 ? -CONFIG.ENEMY_SPEED : CONFIG.ENEMY_SPEED);
    if (!Collide.hitsSolid(enemy.x + enemy.vx, enemy.y, enemy.width, enemy.height)) {
      enemy.x += enemy.vx;
    } else {
      enemy.dashing = false;
    }
    if (Collide.overlaps(Player, enemy)) { Game.mode = "dead"; }
  }
};

// --- ONE FRAME --------------------------------------------------------
Game.update = function () {

  // R always restarts, no matter what mode we are in.
  if (Input.restart) {
    Game.showGameOverScreen(false);
    Game.resetCurrentScore();
    Game.startLevel(Game.levelNumber, false);
    return;
  }

  // If we are not playing, nothing moves. We just wait for R.
  if (Game.mode !== "playing") { return; }

  Player.update();
  Game.updateBullets();
  Game.updateEnemies();

  if (Player.isDead() || Game.mode === "dead") {
    Game.mode = "dead";
    Game.showMessage("You hit something. Press R to try again.");
    Game.showGameOverScreen(true);
    Game.resetCurrentScore();
    return;
  }

  if (Player.hasWon()) {
    if (Game.levelNumber < Level.levels.length - 1) {
      Game.startLevel(Game.levelNumber + 1, false);
      Game.showMessage("Nice! Moving to the next level.");
      return;
    }

    Game.mode = "won";
    Game.showGameOverScreen(false);
    Game.showMessage("You beat every level! Final score: " + Game.currentScore + ". Press R to play again.");
    return;
  }
};

// --- THE LOOP ITSELF --------------------------------------------------
Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
