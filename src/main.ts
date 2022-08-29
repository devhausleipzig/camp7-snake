import {
    Coordinate2D,
    querySelector,
    coordToId,
    mod,
    randomCoordinate,
    coordToIdToElement,
    toggleClass,
    removeChildren,
} from "./utils";

///////////////////////////////////////
//// Init Game Params & Game State ////
///////////////////////////////////////

const appleBiteSound = new Audio("../assets/apple-bite.mp3");
appleBiteSound.playbackRate = 2;

let delay = 200; //ms
let done = false;

let score = 0;

let rows = 20;
let columns = 20;

const keyDirectionMap: Record<string, keyof typeof dirVecMap> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
};

let currentDirection = "up";
let lastIndicatedDirection = "up";

const defaultSnake = [
    [10, 9],
    [10, 10],
    [10, 11],
] as Readonly<Array<Coordinate2D>>;

let snake = [...defaultSnake];

function generateApple(): Coordinate2D {
    while (true) {
        const [x1, y1] = randomCoordinate(columns, rows);

        const collision = snake.some(([x2, y2]) => {
            return x1 == x2 && y1 == y2;
        });

        if (!collision) {
            return [x1, y1];
        }
    }
}

let apples = [generateApple()];

///////////////
//// Board ////
///////////////

const gameGrid = querySelector("#game-grid");

function setGrid() {
    for (let j = rows - 1; j >= 0; j--) {
        for (let i = 0; i < columns; i++) {
            const element = document.createElement("div");
            element.id = coordToId([i, j]);
            toggleClass("grid-square", [element]);
            gameGrid.appendChild(element);
        }
    }
}

setGrid();

const snakeSquares = snake.map(coordToIdToElement);
toggleClass("snake-square", snakeSquares);

const appleSquares = apples.map(coordToIdToElement);
toggleClass("apple-square", appleSquares);

const dirVecMap: Record<string, Coordinate2D> = {
    left: [-1, 0],
    right: [1, 0],
    up: [0, 1],
    down: [0, -1],
};

function vecAdd2Torus(
    [xRange, yRange]: [number, number],
    [x1, y1]: Coordinate2D,
    [x2, y2]: Coordinate2D
): Coordinate2D {
    return [mod(x1 + x2, xRange), mod(y1 + y2, yRange)];
}

const scoreElement = querySelector("#score");

function displayScore() {
    scoreElement.innerText = String(score);
}

function moveSnake(movement: Coordinate2D) {
    const oldHead = snake[snake.length - 1];
    const newHead = vecAdd2Torus([columns, rows], oldHead, movement);

    const [x1, y1] = newHead;

    const selfCollision = snake.some(([x2, y2]: Coordinate2D) => {
        return x1 == x2 && y1 == y2;
    });

    if (selfCollision) {
        score = 0;
        displayScore();
        removeChildren(gameGrid);
        setGrid();

        snake = [...defaultSnake];
        const snakeSquares = snake.map(coordToIdToElement);
        toggleClass("snake-square", snakeSquares);

        apples = [generateApple()];
        const appleSquares = apples.map(coordToIdToElement);
        toggleClass("apple-square", appleSquares);
    }

    snake.push(newHead);
    const headId = coordToId(newHead);
    const headSquare = querySelector(`#${headId}`);
    headSquare.classList.add("snake-square");

    const [x2, y2] = apples[0];

    const appleCollision = x1 == x2 && y1 == y2;

    if (appleCollision) {
        score++;
        displayScore();

        const oldApple = apples.pop() as Coordinate2D;
        const oldAppleSquare = coordToIdToElement(oldApple);

        oldAppleSquare.classList.remove("apple-square");

        const newApple = generateApple();
        apples.push(newApple);
        const newAppleSquare = coordToIdToElement(newApple);

        newAppleSquare.classList.add("apple-square");
        appleBiteSound.play();
    } else {
        const tail = snake.shift() as Coordinate2D;
        const tailId = coordToId(tail);
        const tailSquare = querySelector(`#${tailId}`);
        tailSquare.classList.remove("snake-square");
    }
}

///////////////////
//// Game Loop ////
///////////////////

function gameLoop() {
    if (!done) {
        updateGameState();
        setTimeout(() => {
            window.requestAnimationFrame(gameLoop);
        }, delay);
    }
}

function updateGameState() {
    currentDirection = lastIndicatedDirection;
    const movement = dirVecMap[currentDirection];
    moveSnake(movement);
}

/////////////////////////////
//// Add Event Listeners ////
////////////////////////////

document.addEventListener("keydown", (event) => {
    const key = event.key;
    const indicatedDirection = keyDirectionMap[key];

    if (!indicatedDirection) return;

    switch (indicatedDirection) {
        case "left":
            if (currentDirection == "right") return;
            break;
        case "right":
            if (currentDirection == "left") return;
            break;
        case "up":
            if (currentDirection == "down") return;
            break;
        case "down":
            if (currentDirection == "up") return;
            break;
    }
    console.log("past switch statement");
    lastIndicatedDirection = indicatedDirection;
});

gameLoop();
