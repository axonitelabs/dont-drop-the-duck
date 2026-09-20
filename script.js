// ======================================================
// DON'T DROP THE DUCK
// 30 LEVEL GAME ENGINE
// ======================================================
const STORM_WAIT_TIME = 180000; // 3 minutes
const STORM_DURATION = 30000;   // 30 seconds

function startStorm() {
  stormActive = true;
  stormTimer = 0;

  document.body.classList.add("thunderstorm");

  makeSound(80, 1.2, "sawtooth");
}

function stopStorm() {
  stormActive = false;
  stormTimer = 0;

  document.body.classList.remove("thunderstorm");
}

function updateStorm(delta) {
  stormTimer += delta;

  if (!stormActive && stormTimer >= STORM_WAIT_TIME) {
    startStorm();
  }

  if (stormActive && stormTimer >= STORM_DURATION) {
    stopStorm();
  }
}

let stormTimer = 0;
let stormActive = false;

const viewport = document.getElementById("viewport");
const world = document.getElementById("world");
const objects = document.getElementById("objects");

const player = document.getElementById("player");
const duck = document.getElementById("duck");

const titleScreen = document.getElementById("titleScreen");
const levelSelectScreen = document.getElementById("levelSelectScreen");
const gameScreen = document.getElementById("gameScreen");

const gameOverScreen = document.getElementById("gameOverScreen");
const completeScreen = document.getElementById("completeScreen");

const levelTitle = document.getElementById("levelTitle");
const worldTitle = document.getElementById("worldTitle");

const windAmount = document.getElementById("windAmount");
const checkpointMessage = document.getElementById("checkpointMessage");

const levelButtonsContainer = document.getElementById("levelButtons");

const playButton = document.getElementById("playButton");
const levelSelectButton = document.getElementById("levelSelectButton");
const loadButton = document.getElementById("loadButton");
const resetSaveButton = document.getElementById("resetSaveButton");

const saveButton = document.getElementById("saveButton");
const restartButton = document.getElementById("restartButton");
const menuButton = document.getElementById("menuButton");

const retryButton = document.getElementById("retryButton");
const deathMenuButton = document.getElementById("deathMenuButton");

const nextButton = document.getElementById("nextButton");
const completeSaveButton = document.getElementById("completeSaveButton");
const completeMenuButton = document.getElementById("completeMenuButton");

const backButton = document.getElementById("backButton");

const completeText = document.getElementById("completeText");
const deathMessage = document.getElementById("deathMessage");
const saveInfo = document.getElementById("saveInfo");

// ======================================================
// CONSTANTS
// ======================================================

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 75;

const GRAVITY = 0.78;
const JUMP_POWER = 15.5;

let currentLevel = 0;
let unlockedLevel = 0;

let playerX = 120;
let playerY = 120;

let checkpointX = 120;
let checkpointY = 120;

let velocityX = 0;
let velocityY = 0;

let moveLeft = false;
let moveRight = false;

let onGround = false;

let duckBalance = 0;
let duckVelocity = 0;

let gameRunning = false;
let levelFinished = false;

let cameraX = 0;

let activePlatforms = [];
let activeHazards = [];
let activeMovingPlatforms = [];

let fallingObjects = [];

let lastTime = 0;
let animationId = null;

let fallingTimer = 0;

let audioContext = null;

// ======================================================
// SOUND
// ======================================================

function makeSound(frequency, duration, type = "sine") {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    gain.gain.value = 0.07;

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.stop(audioContext.currentTime + duration);

  } catch (error) {}
}

function jumpSound() {
  makeSound(330, 0.13, "square");
}

function checkpointSound() {
  makeSound(650, 0.15);
  setTimeout(() => makeSound(850, 0.15), 90);
}

function finishSound() {
  makeSound(600, 0.15);
  setTimeout(() => makeSound(800, 0.15), 120);
  setTimeout(() => makeSound(1050, 0.25), 240);
}

function deathSound() {
  makeSound(160, 0.5, "sawtooth");
}

// ======================================================
// LEVEL HELPERS
// ======================================================

function platform(x, y, width, height = 45, type = "") {
  return {
    x,
    y,
    width,
    height,
    type,
    moving: false
  };
}

function movingPlatform(
  x,
  y,
  width,
  height = 35,
  distance = 150,
  speed = 1,
  axis = "x",
  type = ""
) {
  return {
    x,
    y,
    width,
    height,
    type,
    moving: true,
    startX: x,
    startY: y,
    distance,
    speed,
    axis,
    phase: Math.random() * Math.PI * 2
  };
}

function hazard(type, x, y, width = 60, height = 60) {
  return {
    type,
    x,
    y,
    width,
    height
  };
}

// ======================================================
// LEVEL GENERATOR
// ======================================================

function createRoofLevel(options) {

  const platforms = [];

  let x = 0;

  platforms.push(
    platform(
      0,
      70,
      550,
      80,
      options.platformType
    )
  );

  x = 620;

  for (let i = 0; i < options.sections; i++) {

    const difficulty = options.difficulty;

    const width =
      230 +
      ((i * 47) % 150);

    const height =
      70 +
      ((i * 31) % (100 + difficulty * 5));

    if (
      options.movingEvery &&
      i > 0 &&
      i % options.movingEvery === 0
    ) {

      platforms.push(
        movingPlatform(
          x,
          height,
          width,
          35,
          90 + difficulty * 8,
          0.8 + difficulty * 0.08,
          i % 2 === 0 ? "x" : "y",
          options.platformType
        )
      );

    } else {

      platforms.push(
        platform(
          x,
          height,
          width,
          45,
          options.platformType
        )
      );

    }

    x += width + options.gap + ((i * 17) % 45);
  }

  const finishX = x + 100;

  platforms.push(
    platform(
      finishX - 150,
      80,
      500,
      80,
      options.platformType
    )
  );

  const hazards = [];

  for (let i = 1; i < options.sections; i++) {

    if (i % 2 === 0) {
      hazards.push(
        hazard(
          i % 4 === 0 ? "vent" : "crate",
          700 + i * 330,
          120,
          70,
          60
        )
      );
    }

  }

  return {
    name: options.name,
    world: options.world,
    theme: options.theme,

    width: finishX + 500,

    wind: options.wind || 0,
    windGust: options.windGust || 0,

    falling: options.falling || false,

    difficulty: options.difficulty,

    platforms,
    hazards,

    checkpoints: [
      Math.floor(finishX * 0.38),
      Math.floor(finishX * 0.7)
    ],

    finishX
  };
}

// ======================================================
// 30 LEVELS
// ======================================================

const levelDefinitions = [

  {
    name: "First Day",
    world: "School Rooftops",
    theme: "school",
    platformType: "school",
    sections: 5,
    gap: 85,
    difficulty: 1
  },

  {
    name: "Vent Trouble",
    world: "School Rooftops",
    theme: "school",
    platformType: "school",
    sections: 6,
    gap: 100,
    difficulty: 2
  },

  {
    name: "Science Block",
    world: "School Rooftops",
    theme: "school",
    platformType: "school",
    sections: 7,
    gap: 110,
    difficulty: 3,
    movingEvery: 4
  },

  {
    name: "Assembly Hall",
    world: "School Rooftops",
    theme: "school",
    platformType: "school",
    sections: 8,
    gap: 115,
    difficulty: 4,
    wind: 0.04
  },

  {
    name: "School Tower",
    world: "School Rooftops",
    theme: "school",
    platformType: "school",
    sections: 9,
    gap: 120,
    difficulty: 5,
    wind: 0.07,
    movingEvery: 3
  },

  {
    name: "Apartment Jump",
    world: "City Heights",
    theme: "city",
    sections: 8,
    gap: 125,
    difficulty: 6,
    movingEvery: 4
  },

  {
    name: "Office Roofs",
    world: "City Heights",
    theme: "city",
    sections: 9,
    gap: 130,
    difficulty: 7,
    wind: 0.08
  },

  {
    name: "Window Washers",
    world: "City Heights",
    theme: "city",
    sections: 10,
    gap: 135,
    difficulty: 8,
    movingEvery: 2
  },

  {
    name: "Crane Crossing",
    world: "City Heights",
    theme: "city",
    sections: 10,
    gap: 145,
    difficulty: 9,
    wind: 0.11,
    movingEvery: 3
  },

  {
    name: "Skyline",
    world: "City Heights",
    theme: "city",
    sections: 11,
    gap: 150,
    difficulty: 10,
    wind: 0.13,
    windGust: 0.08,
    movingEvery: 2
  },

  {
    name: "Scaffolding",
    world: "Construction Chaos",
    theme: "construction",
    platformType: "construction",
    sections: 9,
    gap: 140,
    difficulty: 11,
    movingEvery: 3
  },

  {
    name: "Half Built",
    world: "Construction Chaos",
    theme: "construction",
    platformType: "construction",
    sections: 10,
    gap: 150,
    difficulty: 12,
    movingEvery: 2
  },

  {
    name: "Falling Tools",
    world: "Construction Chaos",
    theme: "construction",
    platformType: "construction",
    sections: 10,
    gap: 155,
    difficulty: 13,
    falling: true
  },

  {
    name: "Swinging Heights",
    world: "Construction Chaos",
    theme: "construction",
    platformType: "construction",
    sections: 11,
    gap: 160,
    difficulty: 14,
    falling: true,
    movingEvery: 2
  },

  {
    name: "Mega Crane",
    world: "Construction Chaos",
    theme: "construction",
    platformType: "construction",
    sections: 12,
    gap: 170,
    difficulty: 15,
    falling: true,
    movingEvery: 2,
    wind: 0.1
  },

  {
    name: "Mall Roof",
    world: "Shopping District",
    theme: "mall",
    platformType: "mall",
    sections: 10,
    gap: 145,
    difficulty: 16
  },

  {
    name: "Cinema Signs",
    world: "Shopping District",
    theme: "mall",
    platformType: "mall",
    sections: 11,
    gap: 155,
    difficulty: 17,
    movingEvery: 3
  },

  {
    name: "Car Park",
    world: "Shopping District",
    theme: "mall",
    platformType: "mall",
    sections: 11,
    gap: 165,
    difficulty: 18,
    wind: 0.08
  },

  {
    name: "Neon Run",
    world: "Shopping District",
    theme: "night",
    platformType: "mall",
    sections: 12,
    gap: 170,
    difficulty: 19,
    movingEvery: 2
  },

  {
    name: "Giant Billboard",
    world: "Shopping District",
    theme: "night",
    platformType: "mall",
    sections: 13,
    gap: 175,
    difficulty: 20,
    movingEvery: 2,
    windGust: 0.1
  },

  {
    name: "Station Roof",
    world: "Transport Trouble",
    theme: "transport",
    platformType: "train",
    sections: 11,
    gap: 160,
    difficulty: 21
  },

  {
    name: "Moving Train",
    world: "Transport Trouble",
    theme: "transport",
    platformType: "train",
    sections: 12,
    gap: 170,
    difficulty: 22,
    movingEvery: 2
  },

  {
    name: "Bus Depot",
    world: "Transport Trouble",
    theme: "transport",
    platformType: "train",
    sections: 12,
    gap: 175,
    difficulty: 23,
    wind: 0.1
  },

  {
    name: "Airport Service",
    world: "Transport Trouble",
    theme: "transport",
    platformType: "train",
    sections: 13,
    gap: 180,
    difficulty: 24,
    movingEvery: 2,
    wind: 0.13
  },

  {
    name: "Terminal Dash",
    world: "Transport Trouble",
    theme: "transport",
    platformType: "train",
    sections: 14,
    gap: 185,
    difficulty: 25,
    movingEvery: 2,
    windGust: 0.12
  },

  {
    name: "Container Yard",
    world: "Harbour",
    theme: "harbour",
    platformType: "harbour",
    sections: 12,
    gap: 175,
    difficulty: 26
  },

  {
    name: "Dock Cranes",
    world: "Harbour",
    theme: "harbour",
    platformType: "harbour",
    sections: 13,
    gap: 185,
    difficulty: 27,
    movingEvery: 2,
    wind: 0.15
  },

  {
    name: "Storm Harbour",
    world: "Storm City",
    theme: "storm",
    platformType: "harbour",
    sections: 14,
    gap: 195,
    difficulty: 28,
    falling: true,
    wind: 0.17,
    windGust: 0.14,
    movingEvery: 2
  },

  {
    name: "Lightning City",
    world: "Storm City",
    theme: "storm",
    sections: 15,
    gap: 205,
    difficulty: 29,
    falling: true,
    wind: 0.2,
    windGust: 0.18,
    movingEvery: 2
  },

  {
    name: "THE TOWER",
    world: "Final Madness",
    theme: "final",
    platformType: "final",
    sections: 18,
    gap: 215,
    difficulty: 30,
    falling: true,
    wind: 0.23,
    windGust: 0.22,
    movingEvery: 2
  }

];

const levels = levelDefinitions.map(createRoofLevel);

// ======================================================
// UI
// ======================================================

function showOnly(screen) {

  titleScreen.classList.remove("active");
  levelSelectScreen.classList.remove("active");
  gameScreen.classList.remove("active");

  gameOverScreen.classList.remove("active");
  completeScreen.classList.remove("active");

  if (screen) {
    screen.classList.add("active");
  }

}

function openMenu() {

  gameRunning = false;

  showOnly(titleScreen);

  updateSaveText();
  buildLevelButtons();

}

function openLevelSelect() {

  gameRunning = false;

  buildLevelButtons();

  showOnly(levelSelectScreen);

}

function buildLevelButtons() {

  levelButtonsContainer.innerHTML = "";

  levels.forEach((level, index) => {

    const button = document.createElement("button");

    button.className = "level-button";

    if (index > unlockedLevel) {
      button.classList.add("locked");
    }

    if (index === currentLevel) {
      button.classList.add("current");
    }

    button.innerHTML =
      `<strong>${index + 1}</strong><br>${level.name}`;

    button.addEventListener("click", () => {

      if (index > unlockedLevel) {
        return;
      }

      loadLevel(index);

    });

    levelButtonsContainer.appendChild(button);

  });

}

// ======================================================
// SAVE SYSTEM
// ======================================================

function saveGame() {

  const data = {
    unlockedLevel,
    currentLevel
  };

  localStorage.setItem(
    "dontDropTheDuckSave",
    JSON.stringify(data)
  );

  saveInfo.textContent =
    `Saved! Level ${unlockedLevel + 1} unlocked.`;

  makeSound(900, 0.15);

}

function loadSavedGame() {

  const saved =
    localStorage.getItem("dontDropTheDuckSave");

  if (!saved) {

    saveInfo.textContent =
      "No saved game yet.";

    return;

  }

  try {

    const data = JSON.parse(saved);

    unlockedLevel =
      Math.max(
        0,
        Math.min(
          levels.length - 1,
          data.unlockedLevel || 0
        )
      );

    currentLevel =
      Math.max(
        0,
        Math.min(
          unlockedLevel,
          data.currentLevel || 0
        )
      );

    loadLevel(currentLevel);

  } catch (error) {

    saveInfo.textContent =
      "Save file could not be loaded.";

  }

}

function resetSave() {

  const yes = confirm(
    "Reset ALL saved progress and return to Level 1?"
  );

  if (!yes) {
    return;
  }

  localStorage.removeItem(
    "dontDropTheDuckSave"
  );

  unlockedLevel = 0;
  currentLevel = 0;

  updateSaveText();
  buildLevelButtons();

}

function updateSaveText() {

  const saved =
    localStorage.getItem("dontDropTheDuckSave");

  if (!saved) {

    saveInfo.textContent =
      "No saved progress.";

    return;

  }

  try {

    const data = JSON.parse(saved);

    saveInfo.textContent =
      `Saved progress: Level ${
        (data.unlockedLevel || 0) + 1
      } unlocked.`;

  } catch {

    saveInfo.textContent =
      "Saved data found.";

  }

}

// ======================================================
// LEVEL BUILDING
// ======================================================

function clearLevel() {

  objects.innerHTML = "";

  activePlatforms = [];
  activeHazards = [];
  activeMovingPlatforms = [];

  fallingObjects = [];
  fallingTimer = 0;

}

function loadLevel(index) {

  currentLevel = index;

  clearLevel();

  const level = levels[index];

  document.body.className =
    `theme-${level.theme}`;

  levelTitle.textContent =
    `LEVEL ${index + 1}: ${level.name}`;

  worldTitle.textContent =
    level.world;

  world.style.width =
    `${level.width}px`;

  level.platforms.forEach(
    createPlatformElement
  );

  level.hazards.forEach(
    createHazardElement
  );

  level.checkpoints.forEach(
    createCheckpoint
  );

  createFinish(level.finishX);

  playerX = 120;
  playerY = 170;

  checkpointX = playerX;
  checkpointY = playerY;

  velocityX = 0;
  velocityY = 0;

  duckBalance = 0;
  duckVelocity = 0;

  cameraX = 0;

  levelFinished = false;
  gameRunning = true;

  duck.style.transform =
    "rotate(0deg)";

  player.style.left =
    playerX + "px";

  player.style.bottom =
    playerY + "px";

  world.style.transform =
    "translateX(0px)";

  showOnly(gameScreen);

}

function createPlatformElement(data) {

  const element =
    document.createElement("div");

  element.className =
    `platform ${data.type || ""}`;

  if (data.moving) {
    element.classList.add(
      "moving-platform"
    );
  }

  element.style.left =
    data.x + "px";

  element.style.bottom =
    data.y + "px";

  element.style.width =
    data.width + "px";

  element.style.height =
    data.height + "px";

  objects.appendChild(element);

  const object = {
    ...data,
    element,
    currentX: data.x,
    currentY: data.y
  };

  activePlatforms.push(object);

  if (data.moving) {
    activeMovingPlatforms.push(object);
  }

}

function createHazardElement(data) {

  const element =
    document.createElement("div");

  element.className =
    `hazard ${data.type}`;

  element.style.left =
    data.x + "px";

  element.style.bottom =
    data.y + "px";

  element.style.width =
    data.width + "px";

  element.style.height =
    data.height + "px";

  objects.appendChild(element);

  activeHazards.push({
    ...data,
    element
  });

}

function createCheckpoint(x) {

  const element =
    document.createElement("div");

  element.className =
    "checkpoint";

  element.style.left =
    x + "px";

  element.style.bottom =
    "150px";

  element.dataset.used =
    "false";

  objects.appendChild(element);

  activeHazards.push({
    type: "checkpoint",
    x,
    y: 120,
    width: 35,
    height: 120,
    element
  });

}

function createFinish(x) {

  const element =
    document.createElement("div");

  element.className =
    "finish-door";

  element.style.left =
    x + "px";

  element.style.bottom =
    "150px";

  objects.appendChild(element);

}

// ======================================================
// INPUT
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (!gameRunning) {
      return;
    }

    if (
      event.code === "KeyA" ||
      event.code === "ArrowLeft"
    ) {

      moveLeft = true;

    }

    if (
      event.code === "KeyD" ||
      event.code === "ArrowRight"
    ) {

      moveRight = true;

    }

    if (
      event.code === "KeyW" ||
      event.code === "ArrowUp" ||
      event.code === "Space"
    ) {

      if (onGround) {

        velocityY = JUMP_POWER;
        onGround = false;

        jumpSound();

      }

    }

    event.preventDefault();

  }
);

document.addEventListener(
  "keyup",
  event => {

    if (
      event.code === "KeyA" ||
      event.code === "ArrowLeft"
    ) {

      moveLeft = false;

    }

    if (
      event.code === "KeyD" ||
      event.code === "ArrowRight"
    ) {

      moveRight = false;

    }

  }
);

// ======================================================
// COLLISION
// ======================================================

function overlaps(
  ax,
  ay,
  aw,
  ah,
  bx,
  by,
  bw,
  bh
) {

  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );

}

function updatePlatforms(time) {

  activeMovingPlatforms.forEach(
    platform => {

      const movement =
        Math.sin(
          time * 0.001 *
          platform.speed +
          platform.phase
        ) *
        platform.distance;

      if (platform.axis === "x") {

        platform.currentX =
          platform.startX +
          movement;

      } else {

        platform.currentY =
          platform.startY +
          movement;

      }

      platform.element.style.left =
        platform.currentX + "px";

      platform.element.style.bottom =
        platform.currentY + "px";

    }
  );

}

function handleVerticalCollision(
  oldY,
  newY
) {

  onGround = false;

  if (velocityY > 0) {

    playerY = newY;
    return;

  }

  let landingY = null;

  activePlatforms.forEach(
    platform => {

      const px =
        platform.currentX;

      const py =
        platform.currentY;

      const top =
        py + platform.height;

      const wasAbove =
        oldY >= top - 3;

      const fallingThrough =
        newY <= top;

      const horizontal =
        playerX + PLAYER_WIDTH >
          px + 4 &&
        playerX <
          px + platform.width - 4;

      if (
        wasAbove &&
        fallingThrough &&
        horizontal
      ) {

        if (
          landingY === null ||
          top > landingY
        ) {

          landingY = top;

        }

      }

    }
  );

  if (landingY !== null) {

    playerY = landingY;
    velocityY = 0;
    onGround = true;

  } else {

    playerY = newY;

  }

}

function handleSideCollision(
  oldX,
  newX
) {

  let finalX = newX;

  activePlatforms.forEach(
    platform => {

      const px =
        platform.currentX;

      const py =
        platform.currentY;

      const top =
        py + platform.height;

      if (
        playerY >= top - 5
      ) {
        return;
      }

      if (
        overlaps(
          finalX,
          playerY,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          px,
          py,
          platform.width,
          platform.height
        )
      ) {

        if (newX > oldX) {

          finalX =
            px -
            PLAYER_WIDTH;

        } else {

          finalX =
            px +
            platform.width;

        }

        velocityX = 0;

      }

    }
  );

  playerX = finalX;

}

// ======================================================
// FALLING HAZARDS
// ======================================================

function spawnFallingObject() {

  const level = levels[currentLevel];

  if (!level.falling) {
    return;
  }

  const element =
    document.createElement("div");

  element.className =
    "falling-object";

  const x =
    playerX +
    200 +
    Math.random() * 600;

  const y =
    window.innerHeight + 200;

  element.style.left =
    x + "px";

  element.style.bottom =
    y + "px";

  objects.appendChild(element);

  fallingObjects.push({
    x,
    y,
    velocity: 0,
    width: 50,
    height: 50,
    element
  });

}

function updateFallingObjects(delta) {

  fallingObjects.forEach(
    object => {

      object.velocity +=
        GRAVITY *
        delta *
        0.07;

      object.y -=
        object.velocity *
        delta *
        0.08;

      object.element.style.bottom =
        object.y + "px";

      if (
        overlaps(
          playerX,
          playerY,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          object.x,
          object.y,
          object.width,
          object.height
        )
      ) {

        dropDuck(
          "A falling crate absolutely ruined your day."
        );

      }

    }
  );

  fallingObjects =
    fallingObjects.filter(
      object => {

        if (object.y < -200) {

          object.element.remove();
          return false;

        }

        return true;

      }
    );

}

// ======================================================
// CHECKPOINTS / HAZARDS
// ======================================================

function checkHazards() {

  activeHazards.forEach(
    hazard => {

      if (
        !overlaps(
          playerX,
          playerY,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          hazard.x,
          hazard.y,
          hazard.width,
          hazard.height
        )
      ) {
        return;
      }

      if (
        hazard.type === "checkpoint"
      ) {

        if (
          hazard.element.dataset.used ===
          "false"
        ) {

          hazard.element.dataset.used =
            "true";

          checkpointX =
            hazard.x + 40;

          checkpointY =
            playerY + 20;

          showCheckpoint();

          checkpointSound();

        }

        return;

      }

      if (
        hazard.type === "spikes"
      ) {

        dropDuck(
          "The duck found the sharpest possible landing spot."
        );

      }

    }
  );

}

function showCheckpoint() {

  checkpointMessage.classList.add(
    "show"
  );

  setTimeout(
    () => {

      checkpointMessage.classList.remove(
        "show"
      );

    },
    1000
  );

}

// ======================================================
// DUCK PHYSICS - EASIER VERSION
// ======================================================

function updateDuck(delta) {

  const level =
    levels[currentLevel];

  const gust =
    Math.sin(
      performance.now() *
      0.0025
    ) *
    level.windGust;

  const wind =
    level.wind + gust;

  windAmount.textContent =
    wind.toFixed(2);

  // less movement wobble
  duckVelocity +=
    velocityX *
    0.009 *
    delta;

  // wind affects duck less
  duckVelocity +=
    wind *
    delta *
    0.075;

  // stronger self-balancing
  duckVelocity -=
    duckBalance *
    0.0022 *
    delta;

  // more damping
  duckVelocity *= 0.86;

  // slower tipping
  duckBalance +=
    duckVelocity *
    delta *
    0.04;

  if (onGround) {
    duckBalance *= 0.975;
  }

  duck.style.transform =
    `rotate(${duckBalance}deg)`;

  // much more forgiving
if (
  Math.abs(duckBalance) >
  76
) {

    dropDuck(
      "Gerald has left the building."
    );

  }

}

// ======================================================
// CAMERA
// ======================================================

function updateCamera() {

  const target =
    playerX -
    window.innerWidth *
    0.35;

  const level =
    levels[currentLevel];

  const max =
    Math.max(
      0,
      level.width -
      window.innerWidth
    );

  const clamped =
    Math.max(
      0,
      Math.min(max, target)
    );

  cameraX +=
    (clamped - cameraX) *
    0.09;

  world.style.transform =
    `translateX(${-cameraX}px)`;

}

// ======================================================
// GAMEPLAY
// ======================================================

function updateGame(time) {

  if (!lastTime) {
    lastTime = time;
  }

  const delta =
    Math.min(
      32,
      time - lastTime
    );

  lastTime = time;

  if (gameRunning) {

    updatePlatforms(time);

    const level =
      levels[currentLevel];

    const acceleration =
      0.035 *
      delta;

    const maxSpeed =
      5.2 +
      level.difficulty *
      0.035;

    if (moveLeft) {

      velocityX -=
        acceleration;

    }

    if (moveRight) {

      velocityX +=
        acceleration;

    }

    if (
      !moveLeft &&
      !moveRight
    ) {

      velocityX *=
        0.84;

    }

    velocityX =
      Math.max(
        -maxSpeed,
        Math.min(
          maxSpeed,
          velocityX
        )
      );

    const oldX =
      playerX;

    const newX =
      playerX +
      velocityX *
      delta *
      0.06;

    handleSideCollision(
      oldX,
      newX
    );

    velocityY -=
      GRAVITY *
      delta *
      0.06;

    const oldY =
      playerY;

    const newY =
      playerY +
      velocityY *
      delta *
      0.06;

    handleVerticalCollision(
      oldY,
      newY
    );

    if (playerX < 0) {
      playerX = 0;
    }

    updateDuck(delta);

    checkHazards();

    if (level.falling) {

      fallingTimer += delta;

      const spawnRate =
        Math.max(
          600,
          2300 -
          level.difficulty *
          45
        );

      if (
        fallingTimer >
        spawnRate
      ) {

        fallingTimer = 0;

        spawnFallingObject();

      }

    }

    updateFallingObjects(delta);

    if (
      playerY < -180
    ) {

      dropDuck(
        "Gravity remains undefeated."
      );

    }

    if (
      playerX >=
      level.finishX
    ) {

      finishLevel();

    }

    player.style.left =
      playerX + "px";

    player.style.bottom =
      playerY + "px";

    updateCamera();

  }

  animationId =
    requestAnimationFrame(
      updateGame
    );

}

// ======================================================
// DEATH / RESPAWN
// ======================================================

const deathMessages = [
  "The duck is disappointed.",
  "That duck had a family.",
  "HONK.",
  "Duck delivery unsuccessful.",
  "Gravity: 1. You: 0.",
  "The duck would like to speak to management."
];

function dropDuck(message) {

  if (!gameRunning) {
    return;
  }

  gameRunning = false;

  deathSound();

  duck.style.transform =
    `translateY(180px) rotate(220deg)`;

  deathMessage.textContent =
    message ||
    deathMessages[
      Math.floor(
        Math.random() *
        deathMessages.length
      )
    ];

  setTimeout(
    () => {

      gameOverScreen.classList.add(
        "active"
      );

    },
    450
  );

}

function retryFromCheckpoint() {

  gameOverScreen.classList.remove(
    "active"
  );

  playerX =
    checkpointX;

  playerY =
    checkpointY + 80;

  velocityX = 0;
  velocityY = 0;

  duckBalance = 0;
  duckVelocity = 0;

  duck.style.transform =
    "rotate(0deg)";

  fallingObjects.forEach(
    object =>
      object.element.remove()
  );

  fallingObjects = [];

  gameRunning = true;

}

// ======================================================
// LEVEL COMPLETE
// ======================================================

function finishLevel() {

  if (
    levelFinished ||
    !gameRunning
  ) {
    return;
  }

  levelFinished = true;
  gameRunning = false;

  finishSound();

  if (
    currentLevel <
    levels.length - 1
  ) {

    unlockedLevel =
      Math.max(
        unlockedLevel,
        currentLevel + 1
      );

  }

  completeText.textContent =
    currentLevel ===
    levels.length - 1
      ? "YOU FINISHED DON'T DROP THE DUCK!"
      : `Level ${currentLevel + 2} is now unlocked. Remember: progress is NOT saved until you press SAVE.`;

  nextButton.style.display =
    currentLevel ===
    levels.length - 1
      ? "none"
      : "block";

  completeScreen.classList.add(
    "active"
  );

}

// ======================================================
// BUTTONS
// ======================================================

playButton.addEventListener(
  "click",
  () => loadLevel(currentLevel)
);

levelSelectButton.addEventListener(
  "click",
  openLevelSelect
);

backButton.addEventListener(
  "click",
  openMenu
);

loadButton.addEventListener(
  "click",
  loadSavedGame
);

resetSaveButton.addEventListener(
  "click",
  resetSave
);

saveButton.addEventListener(
  "click",
  saveGame
);

completeSaveButton.addEventListener(
  "click",
  saveGame
);

restartButton.addEventListener(
  "click",
  () => loadLevel(currentLevel)
);

menuButton.addEventListener(
  "click",
  openMenu
);

retryButton.addEventListener(
  "click",
  retryFromCheckpoint
);

deathMenuButton.addEventListener(
  "click",
  openMenu
);

completeMenuButton.addEventListener(
  "click",
  openMenu
);

nextButton.addEventListener(
  "click",
  () => {

    completeScreen.classList.remove(
      "active"
    );

    if (
      currentLevel <
      levels.length - 1
    ) {

      loadLevel(
        currentLevel + 1
      );

    }

  }
);

// ======================================================
// START
// ======================================================

updateSaveText();
buildLevelButtons();

animationId =
  requestAnimationFrame(
    updateGame
  );
