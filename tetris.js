const playerNameKey = "playerName";
const scoreKey = "score";
const scoresKey = "scores";
const boardViewKey = "boardView";
const nextFigureViewKey = "nextFigureView";
const twoDimensionKey = "2d";

const boardRowsCount = 20;
const boardColumnsCount = 10;
const squareSize = 25;
const scoresCount = 10;
const nextFigureRowsCount = 4;
const nextFigureColumnsCount = 4;

const colors = {
    0: "#EAECEE",
    1: "#F4D03F",
    2: "#58D68D",
    3: "#A569BD",
    4: "#5DADE2",
    5: "#E67E22",
    6: "#E74C3C",
    7: "#148F77",
    8: "#ABB2B9"
};

const emptyColor = 0;
const strokeColor = 8;

let player = localStorage[playerNameKey];
let scoreboard = localStorage[scoresKey];

document.getElementById(playerNameKey).innerText = `Player's name: ${player}`;

let scoreElement = document.getElementById(scoreKey);
scoreboard = scoreboard !== undefined ? JSON.parse(scoreboard) : [];

let boardCvs = document.getElementById(boardViewKey);
let boardCtx = boardCvs.getContext(twoDimensionKey);

let nextCvs = document.getElementById(nextFigureViewKey);
let nextCtx = nextCvs.getContext(twoDimensionKey);

const structures = {
    I: {
        struct: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: 1
    },
    J: {
        struct: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 2
    },
    L: {
        struct: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 3
    },
    O: {
        struct: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        color: 4
    },
    S: {
        struct: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: 5
    },
    T: {
        struct: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 6
    },
    Z: {
        struct: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: 7
    }
};

const statesCount = 4;

const kicks = [
    [[0, 0], [-1, 0], [-1, 1], [0,-2], [-1,-2]],
    [[0, 0], [ 1, 0], [ 1,-1], [0, 2], [ 1, 2]],
    [[0, 0], [ 1, 0], [ 1, 1], [0,-2], [ 1,-2]],
    [[0, 0], [-1, 0], [-1,-1], [0, 2], [-1, 2]]
];

const I_kicks = [
    [[0, 0], [-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
    [[0, 0], [-1, 0], [ 2, 0], [-1, 2], [ 2,-1]],
    [[0, 0], [ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
    [[0, 0], [ 1, 0], [-2, 0], [ 1,-2], [-2, 1]]
];

function drawSquare(ctx, x, y, colorIndex) {
    ctx.fillStyle = colors[colorIndex];
    ctx.fillRect(x * squareSize,y * squareSize, squareSize, squareSize);

    ctx.strokeStyle = colors[strokeColor];
    ctx.strokeRect(x * squareSize,y * squareSize, squareSize, squareSize);
}

function* generateFigure() {
    let structTypes = Object.keys(structures);
    while (true) {
        let randomType = structTypes[Math.floor(Math.random() * structTypes.length)];
        yield new Figure(randomType, structures[randomType].struct, structures[randomType].color);
    }
}

function findSortedIndex(elem, array, compareFn) {
    if (array.length < 1 || compareFn(elem, array[0])) {
        return 0;
    }

    let i;
    for (i = 1; i < array.length; i++) {
        if (compareFn(elem, array[i]) && !compareFn(elem, array[i - 1])) {
            break;
        }
    }
    return i;
}

function rotateMatrix(matrix) {
    matrix = [...matrix].reverse();
    return matrix[0].map((column, index) => (
        matrix.map(row => row[index])
    ));
}

class Grid {
    constructor(ctx, rows, cols) {
        this.ctx = ctx;
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(emptyColor));
        this.figure = null;
        this.draw();
    }

    draw() {
        for (let [i, row] of this.grid.entries()) {
            for (let [j, square] of row.entries()) {
                drawSquare(this.ctx, j, i, square);
            }
        }
    }

    fillFigure(color) {
        for (let [i, row] of this.figure.struct.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 1) {
                    drawSquare(this.ctx, this.figure.x + j, this.figure.y + i, color);
                }
            }
        }
    }

    drawFigure() {
        this.fillFigure(this.figure.color);
    }

    eraseFigure() {
        this.fillFigure(emptyColor);
    }
}

class Next extends Grid {
    constructor(nextCtx, rows, cols) {
        super(nextCtx, rows, cols);
        this.generator = generateFigure();
        this.figure = this.nextFigure;
    }

    get nextFigure() {
        return this.generator.next().value;
    }

    get currentFigure() {
        let currentFigure = this.figure;
        this.eraseFigure();

        this.figure = this.nextFigure;
        this.drawFigure();

        return currentFigure;
    }
}

class Board extends Grid {
    constructor(boardCtx, rows, cols, next) {
        super(boardCtx, rows, cols);
        this.next = next;
        this.figure = this.getNextFigure();
    }

    getNextFigure() {
        let figure = this.next.currentFigure;
        figure.x = 3;
        figure.y = -2;
        figure.board = this;
        return figure
    }

    checkCollision(newX, newY, nextState=null) {
        let state = nextState === null ? this.figure.struct : nextState;
        for (let [i, row] of state.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 0) {
                    continue;
                }

                let newSquareX = newX + j;
                let newSquareY = newY + i;

                if (newSquareX < 0 || newSquareX >= boardColumnsCount || newSquareY >= boardRowsCount) {
                    return true;
                }

                if (newSquareY < 0) {
                    continue;
                }

                if (this.grid[newSquareY][newSquareX] !== emptyColor) {
                    return true;
                }
            }
        }
        return false;
    }

    lockFigure() {
        for (let [i, row] of this.figure.struct.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 0) {
                    continue;
                }

                if (this.figure.y + i <= 0) {
                    clearInterval(timerId);
                    document.removeEventListener("keydown", handleKeydown);

                    let newScore = {
                        player: player,
                        score: score
                    };

                    let scoreIndex = findSortedIndex(newScore, scoreboard, (a, b) => a.score > b.score);
                    scoreboard.splice(scoreIndex, 0, newScore);
                    if (scoreboard.length > scoresCount) {
                        scoreboard = scoreboard.slice(0, scoresCount);
                    }

                    localStorage["newScoreIndex"] = scoreIndex;
                    localStorage["scores"] = JSON.stringify(scoreboard);

                    let gameOverDialog = document.getElementById('gameOverDialog');
                    gameOverDialog.style.display = "block";

                    return;
                }

                this.grid[this.figure.y + i][this.figure.x + j] = this.figure.color;
            }
        }

        this.removeFullRows(this.figure.y, this.figure.y + this.figure.struct.length);
        this.draw();

        this.figure = this.getNextFigure();
    }

    removeFullRows(from, to) {
        to = to > this.grid.length ? this.grid.length : to;
        for (let i = from; i < to; i++) {
            let row = this.grid[i];
            let isRowFull = true;
            for (let square of row) {
                isRowFull = isRowFull && (square !== emptyColor);
            }

            if (isRowFull === true) {
                let newRow = Array(boardColumnsCount).fill(emptyColor);
                this.grid.splice(i, 1);
                this.grid.unshift(newRow);

                score += 100;
                scoreElement.innerText = `Score: ${score}`;

                clearInterval(timerId);
                if (delay > 200) {
                    delay -= 50;
                }
                timerId = setInterval(() => this.figure.moveDown(), delay);
            }
        }
    }
}

class Figure {
    constructor(type, struct, color) {
        this.board = null;
        this.type = type;
        this.struct = struct;
        this.stateN = 0;
        this.x = 0;
        this.y = 0;
        this.color = color;
    }

    move(newX, newY, nextState=null) {
        let isCollided = this.board.checkCollision(newX, newY, nextState);
        if (isCollided === false) {
            this.board.eraseFigure();
            this.x = newX;
            this.y = newY;
            if (nextState !== null) {
                this.struct = nextState;
                this.stateN = ++this.stateN % statesCount;
            }
            this.board.drawFigure();
        }
        return !isCollided;
    }

    moveLeft() {
        this.move(this.x - 1, this.y)
    }

    moveRight() {
        this.move(this.x + 1, this.y)
    }

    moveDown() {
        let isMoved = this.move(this.x, this.y + 1);
        if (isMoved === false) {
            this.board.lockFigure();
        }
    }

    rotate() {
        let nextState = rotateMatrix(this.struct);
        let tempkicks;
        if (structures[this.type] === structures.O) {
            return;
        } else if (structures[this.type] === structures.I) {
            tempkicks = I_kicks[this.stateN];
        } else {
            tempkicks = kicks[this.stateN];
        }

        for (let kick of tempkicks) {
            let [kickX, kickY] = kick;
            let isMoved = this.move(this.x + kickX, this.y + kickY, nextState);
            if (isMoved === true) {
                break;
            }
        }
    }
}

let next = new Next(nextCtx, nextFigureRowsCount, nextFigureColumnsCount);

let board = new Board(boardCtx, boardRowsCount, boardColumnsCount, next);

const KEYS_ACTIONS = {
    ArrowLeft: () => board.figure.moveLeft(),
    ArrowRight: () => board.figure.moveRight(),
    ArrowUp:  () => board.figure.rotate(),
    ArrowDown: () => board.figure.moveDown()
};

function handleKeydown(event) {
    if (event.key in KEYS_ACTIONS) {
        event.preventDefault();
        KEYS_ACTIONS[event.key]();
    }
}

document.addEventListener("keydown", handleKeydown);

let score = 0;
let delay = 1000;
let timerId = setInterval(() => board.figure.moveDown(), delay);