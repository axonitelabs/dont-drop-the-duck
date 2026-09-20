const player = document.getElementById("player");
const duck = document.getElementById("duck");
const gameOverScreen = document.getElementById("gameOver");

let x = 200;
let y = 120;
let velocityY = 0;

let movingLeft = false;
let movingRight = false;
let jumping = false;

let duckBalance = 0;
let gameOver = false;

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyA" || event.code === "ArrowLeft") {
    movingLeft = true;
  }

  if (event.code === "KeyD" || event.code === "ArrowRight") {
    movingRight = true;
  }

  if (
    (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") &&
    !jumping
  ) {
    velocityY = 15;
    jumping = true;
  }

  event.preventDefault();
});

document.addEventListener("keyup", (event) => {
  if (event.code === "KeyA" || event.code === "ArrowLeft") {
    movingLeft = false;
  }

  if (event.code === "KeyD" || event.code === "ArrowRight") {
    movingRight = false;
  }
});

function updateGame() {
  if (gameOver) return;

  if (movingLeft) {
    x -= 5;
    duckBalance -= 1;
  }

  if (movingRight) {
    x += 5;
    duckBalance += 1;
  }

  velocityY -= 0.7;
  y += velocityY;

  if (y <= 120) {
    y = 120;
    velocityY = 0;
    jumping = false;
  }

  if (x < 0) {
    x = 0;
  }

  if (x > window.innerWidth - 60) {
    x = window.innerWidth - 60;
  }

  duckBalance *= 0.96;

  duck.style.transform = `rotate(${duckBalance}deg)`;

  if (Math.abs(duckBalance) > 45) {
    dropDuck();
  }

  player.style.left = x + "px";
  player.style.bottom = y + "px";

  requestAnimationFrame(updateGame);
}

function dropDuck() {
  gameOver = true;

  duck.style.transform = "translateY(200px) rotate(180deg)";

  setTimeout(() => {
    gameOverScreen.style.display = "flex";
  }, 500);
}

function restartGame() {
  location.reload();
}

updateGame();
