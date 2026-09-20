const player = document.getElementById("player");
const duck = document.getElementById("duck");
const gameOverScreen = document.getElementById("gameOver");
const levelCompleteScreen = document.getElementById("levelComplete");

let x = 100;
let y = 120;
let velocityY = 0;

let movingLeft = false;
let movingRight = false;
let jumping = false;

let duckBalance = 0;
let gameStopped = false;

const playerWidth = 60;
const playerHeight = 80;

const obstacles = [
  { x: 400, width: 70, height: 70 },
  { x: 700, width: 100, height: 100 },
  { x: 1050, width: 70, height: 150 }
];

document.addEventListener("keydown", (event) => {
  if (gameStopped) return;

  if (event.code === "KeyA" || event.code === "ArrowLeft") {
    movingLeft = true;
  }

  if (event.code === "KeyD" || event.code === "ArrowRight") {
    movingRight = true;
  }

  if (
    (event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "KeyW") &&
    !jumping
  ) {
    velocityY = 16;
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

function rectanglesTouch(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.bottom < b.top &&
    a.top > b.bottom
  );
}

function checkObstacleCollision(newX, newY) {
  const playerBox = {
    left: newX,
    right: newX + playerWidth,
    bottom: newY,
    top: newY + playerHeight
  };

  for (const obstacle of obstacles) {
    const obstacleBox = {
      left: obstacle.x,
      right: obstacle.x + obstacle.width,
      bottom: 120,
      top: 120 + obstacle.height
    };

    if (rectanglesTouch(playerBox, obstacleBox)) {
      return true;
    }
  }

  return false;
}

function updateGame() {
  if (gameStopped) return;

  let newX = x;

  if (movingLeft) {
    newX -= 5;
    duckBalance -= 1.4;
  }

  if (movingRight) {
    newX += 5;
    duckBalance += 1.4;
  }

  if (!checkObstacleCollision(newX, y)) {
    x = newX;
  }

  velocityY -= 0.8;

  let newY = y + velocityY;

  if (!checkObstacleCollision(x, newY)) {
    y = newY;
  } else {
    if (velocityY < 0) {
      velocityY = 0;
      jumping = false;
    } else {
      velocityY = 0;
    }
  }

  if (y <= 120) {
    y = 120;
    velocityY = 0;
    jumping = false;
  }

  if (x < 0) {
    x = 0;
  }

  duckBalance *= 0.97;

  duck.style.transform = `rotate(${duckBalance}deg)`;

  if (Math.abs(duckBalance) > 55) {
    dropDuck();
    return;
  }

  if (x >= 1300) {
    completeLevel();
    return;
  }

  player.style.left = x + "px";
  player.style.bottom = y + "px";

  requestAnimationFrame(updateGame);
}

function dropDuck() {
  gameStopped = true;

  duck.style.transform = "translateY(250px) rotate(180deg)";

  setTimeout(() => {
    gameOverScreen.style.display = "flex";
  }, 500);
}

function completeLevel() {
  gameStopped = true;
  levelCompleteScreen.style.display = "flex";
}

function restartLevel() {
  location.reload();
}

function nextLevel() {
  alert("LEVEL 2 IS COMING NEXT 😭🦆");
}

updateGame();
