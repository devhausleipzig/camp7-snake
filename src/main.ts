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

const keyDirectionMap: Record<string, keyof typeof dirVecMap> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
};

class GameGrid {
    gridElement: HTMLElement;
    squareClassName: string;
    gridSquareElements: Array<HTMLElement>;
    columns: number;
    rows: number;

    constructor(
        gridId: string,
        squareClassName: string,
        rows: number,
        columns: number
    ) {
        this.gridElement = querySelector(`#${gridId}`);
        this.squareClassName = squareClassName;
        this.gridSquareElements = [];

        this.rows = rows;
        this.columns = columns;

        this.resetGrid();
    }

    resetGrid() {
        removeChildren(this.gridElement);

        for (let j = this.rows - 1; j >= 0; j--) {
            for (let i = 0; i < this.columns; i++) {
                const element = document.createElement("div");
                element.id = coordToId([i, j]);
                toggleClass(this.squareClassName, [element]);
                this.gridElement.appendChild(element);
            }
        }

        this.gridSquareElements = Array.from(
            this.gridElement.querySelectorAll(this.squareClassName)
        );
    }
}

type SnakeGameConfig = {
    delay?: number;
    rows?: number;
    columns?: number;
};

type SnakeGameState = {
    score: number;
    done: boolean;
    currentDirection: string;
    lastIndicatedDirection: string;
};

class SnakeGame {
    gameGrid: GameGrid;
    scoreElement: HTMLElement;
    snake: Array<Coordinate2D>;
    snakeClassName: string;
    appleClassName: string;
    apples: Array<Coordinate2D>;

    config: SnakeGameConfig;
    state: SnakeGameState;

    defaultSnake = [
        [10, 9],
        [10, 10],
        [10, 11],
    ] as Readonly<Array<Coordinate2D>>;

    constructor(
        config: SnakeGameConfig,
        gridId: string,
        scoreId: string,
        squareClassName: string,
        snakeClassName: string,
        appleClassName: string
    ) {
        const defaultConfig = {
            delay: 200, // milliseconds
            rows: 20,
            columns: 20,
        };

        this.config = { ...defaultConfig, ...config };

        const defaultState = {
            done: false,
            score: 0,
            currentDirection: "up",
            lastIndicatedDirection: "up",
        };

        this.state = { ...defaultState };

        this.snakeClassName = snakeClassName;
        this.appleClassName = appleClassName;

        this.snake = [...this.defaultSnake];
        this.apples = [this.generateApple()];

        this.gameGrid = new GameGrid(
            gridId,
            squareClassName,
            //@ts-ignore
            this.config.rows,
            this.config.columns
        );

        this.scoreElement = querySelector(`#${scoreId}`);
    }

    reset() {
        this.gameGrid.resetGrid();

        const snakeSquares = this.snake.map(coordToIdToElement);
        toggleClass(this.snakeClassName, snakeSquares);

        const appleSquares = this.apples.map(coordToIdToElement);
        toggleClass(this.appleClassName, appleSquares);

        this.state.score = 0;
        this.displayScore();
    }

    generateApple(): Coordinate2D {
        while (true) {
            const [x1, y1] = randomCoordinate(
                //@ts-ignore
                this.config.columns,
                this.config.rows
            );

            const collision = this.snake.some(([x2, y2]) => {
                return x1 == x2 && y1 == y2;
            });

            if (!collision) {
                return [x1, y1];
            }
        }
    }

    displayScore() {
        this.scoreElement.innerText = String(this.state.score);
    }

    moveSnake(movement: Coordinate2D) {
        const oldHead = this.snake[this.snake.length - 1];
        const newHead = vecAdd2Torus(
            //@ts-ignore
            [this.config.columns, this.config.rows],
            oldHead,
            movement
        );

        const [x1, y1] = newHead;

        const selfCollision = this.snake.some(([x2, y2]: Coordinate2D) => {
            return x1 == x2 && y1 == y2;
        });

        if (selfCollision) {
            snakeGame.reset();

            this.snake = [...this.defaultSnake];
            const snakeSquares = this.snake.map(coordToIdToElement);
            toggleClass("snake-square", snakeSquares);

            this.apples = [this.generateApple()];
            const appleSquares = this.apples.map(coordToIdToElement);
            toggleClass("apple-square", appleSquares);
        }

        this.snake.push(newHead);
        const headId = coordToId(newHead);
        const headSquare = querySelector(`#${headId}`);
        headSquare.classList.add("snake-square");

        const [x2, y2] = this.apples[0];

        const appleCollision = x1 == x2 && y1 == y2;

        if (appleCollision) {
            this.state.score++;
            this.displayScore();

            const oldApple = this.apples.pop() as Coordinate2D;
            const oldAppleSquare = coordToIdToElement(oldApple);

            oldAppleSquare.classList.remove("apple-square");

            const newApple = this.generateApple();
            this.apples.push(newApple);
            const newAppleSquare = coordToIdToElement(newApple);

            newAppleSquare.classList.add("apple-square");
            appleBiteSound.play();
        } else {
            const tail = this.snake.shift() as Coordinate2D;
            const tailId = coordToId(tail);
            const tailSquare = querySelector(`#${tailId}`);
            tailSquare.classList.remove("snake-square");
        }
    }

    updateGameState() {
        this.state.currentDirection = this.state.lastIndicatedDirection;
        const movement = dirVecMap[this.state.currentDirection];
        this.moveSnake(movement);
    }

    gameLoop() {
        if (!this.state.done) {
            this.updateGameState();
            setTimeout(() => {
                window.requestAnimationFrame(this.gameLoop.bind(this));
            }, this.config.delay);
        }
    }
}

///////////////
//// Board ////
///////////////

const snakeGame = new SnakeGame(
    {},
    "game-grid",
    "score",
    "grid-square",
    "snake-square",
    "apple-square"
);

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

///////////////////
//// Game Loop ////
///////////////////

/////////////////////////////
//// Add Event Listeners ////
////////////////////////////

document.addEventListener("keydown", (event) => {
    const key = event.key;
    const indicatedDirection = keyDirectionMap[key];

    if (!indicatedDirection) return;

    switch (indicatedDirection) {
        case "left":
            if (snakeGame.state.currentDirection == "right") return;
            break;
        case "right":
            if (snakeGame.state.currentDirection == "left") return;
            break;
        case "up":
            if (snakeGame.state.currentDirection == "down") return;
            break;
        case "down":
            if (snakeGame.state.currentDirection == "up") return;
            break;
    }
    console.log("past switch statement");
    snakeGame.state.lastIndicatedDirection = indicatedDirection;
});

snakeGame.gameLoop();
