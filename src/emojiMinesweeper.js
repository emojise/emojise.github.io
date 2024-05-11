/*
 *  Emoji Minesweeper
 *  Copyright (c) 2024 Michael Kolesidis
 *  GNU Affero General Public License v3.0
 *
 *  minesweeperEmoji.js contains the game functionality,
 *  everything that happens inside the game's board. It
 *  also handles the update of the stats accordingly.
 */

// Prevent right mouse click from opening browser context menu in order to be able to flag
document.addEventListener('contextmenu', event => event.preventDefault());

// Canvas
let cnv; // The canvas element that will contain the game

/**
 * Dark Mode
 */
let darkMode = JSON.parse(localStorage.getItem('darkMode')) ?? false;

/**
 * Emoji
 */
let theme = window.localStorage.getItem('theme') ?? 'mine';
window.localStorage.setItem('mainEmoji', themes[theme]['mine']);

// Emoji images
let CLOSED;
let NUMBERS = [];
let FLAG;
let WRONG;
let TIMER;
let MOVES;
let BEST;
let WON;
let LOST;
let MINE;
let DETONATION;

function preload() {
  CLOSED = darkMode
    ? loadImage(darkTheme.closed)
    : loadImage('../emoji/black_square_button_flat.png');
  NUMBERS[0] = darkMode
    ? loadImage(darkTheme.empty)
    : loadImage('../emoji/white_large_square_flat.png');
  NUMBERS[1] = loadImage('../emoji/keycap_1_flat.png');
  NUMBERS[2] = loadImage('../emoji/keycap_2_flat.png');
  NUMBERS[3] = loadImage('../emoji/keycap_3_flat.png');
  NUMBERS[4] = loadImage('../emoji/keycap_4_flat.png');
  NUMBERS[5] = loadImage('../emoji/keycap_5_flat.png');
  NUMBERS[6] = loadImage('../emoji/keycap_6_flat.png');
  NUMBERS[7] = loadImage('../emoji/keycap_7_flat.png');
  NUMBERS[8] = loadImage('../emoji/keycap_8_flat.png');
  NUMBERS[9] = loadImage('../emoji/keycap_9_flat.png');
  FLAG = loadImage('../emoji/triangular_flag_flat.png');
  WRONG = loadImage('../emoji/cross_mark_flat.png');
  TIMER = loadImage('../emoji/hourglass_done_flat.png');
  MOVES = loadImage('../emoji/abacus_flat.png');
  BEST = loadImage('../emoji/partying_face_flat.png');
  WON = loadImage(themes[theme]['won']);
  LOST = loadImage(themes[theme]['lost']);
  MINE = loadImage(themes[theme]['mine']);
  DETONATION = loadImage(themes[theme]['detonation']);
}

/**
 * Title
 */
window.localStorage.setItem('title', themes[theme]['title']);

/**
 * Settings
 */
let settings = {
  level: {
    // to be overridden by localStorage
    columns: 9,
    rows: 9,
    mines: 10,
  },
  size: {
    squareSize: 33,
  },
};

/**
 * Level
 */
let level = localStorage.getItem('level');

if (
  level !== 'beginner' &&
  level !== 'intermediate' &&
  level !== 'expert' &&
  level !== 'custom'
) {
  localStorage.setItem('level', 'beginner');
}

switch (level) {
  case 'beginner':
    settings.level = {
      columns: 9,
      rows: 9,
      mines: 10,
    };
    break;
  case 'intermediate':
    settings.level = {
      columns: 16,
      rows: 16,
      mines: 40,
    };
    break;
  case 'expert':
    settings.level = {
      columns: 30,
      rows: 16,
      mines: 99,
    };
    break;
  case 'custom':
    let columns = parseInt(localStorage.getItem('columns'), 10);
    let rows = parseInt(localStorage.getItem('rows'), 10);
    let mines = parseInt(localStorage.getItem('mines'), 10);

    if (isNaN(columns)) {
      columns = 9;
      localStorage.setItem('columns', columns);
    } else {
      if (columns < 7) {
        columns = 7;
        localStorage.setItem('columns', columns);
      } else if (columns > 58) {
        columns = 58;
        localStorage.setItem('columns', columns);
      }
    }

    if (isNaN(rows)) {
      rows = 9;
      localStorage.setItem('rows', rows);
    } else {
      if (rows < 7) {
        rows = 7;
        localStorage.setItem('rows', rows);
      } else if (rows > 58) {
        rows = 58;
        localStorage.setItem('rows', rows);
      }
    }

    if (isNaN(mines)) {
      mines = 10;
      localStorage.setItem('mines', mines);
    } else {
      if (mines < 1) {
        mines = 1;
        localStorage.setItem('mines', mines);
      }
      if (mines > columns * rows - 1) {
        mines = columns * rows - 1;
        localStorage.setItem('mines', mines);
      }
    }

    settings.level = {
      columns,
      rows,
      mines,
    };
    break;
}

/**
 * Board dimensions and number of mines
 */
let squares = []; // Array to hold all the square objects
let squareSize = settings.size.squareSize; // The size (in pixels of each square)
let columns = settings.level.columns; // The number of columns in the board
let rows = settings.level.rows; // The number of rows in the board
let numberOfSquares = rows * columns;

let boardSize = {
  width: 33 * 9,
  height: 33 * 9 + 7,
};
let counterHeight = 7;

switch (level) {
  case 'beginner':
    settings.level = {
      columns: 9,
      rows: 9,
      mines: 10,
    };
    boardSize = {
      width: squareSize * settings.level.columns,
      height: squareSize * settings.level.rows + counterHeight,
    };
    break;
  case 'intermediate':
    settings.level = {
      columns: 16,
      rows: 16,
      mines: 40,
    };
    boardSize = {
      width: squareSize * settings.level.columns,
      height: squareSize * settings.level.rows + counterHeight,
    };
    break;
  case 'expert':
    settings.level = {
      columns: 30,
      rows: 16,
      mines: 99,
    };
    boardSize = {
      width: squareSize * settings.level.columns,
      height: squareSize * settings.level.rows + counterHeight,
    };
    break;
  case 'custom':
    let columns = parseInt(localStorage.getItem('columns'), 10);
    if (columns < 7) {
      columns = 7;
      localStorage.setItem('columns', columns);
    } else if (columns > 58) {
      columns = 58;
      localStorage.setItem('columns', columns);
    }

    let rows = parseInt(localStorage.getItem('rows'), 10);
    if (rows < 7) {
      rows = 7;
      localStorage.setItem('rows', rows);
    } else if (rows > 58) {
      rows = 58;
      localStorage.setItem('rows', rows);
    }

    let mines = parseInt(localStorage.getItem('mines'), 10);
    if (mines < 1) {
      mines = 1;
      localStorage.setItem('mines', mines);
    }
    if (mines > columns * rows - 1) {
      mines = columns * rows - 1;
      localStorage.setItem('mines', mines);
    }

    settings.level = {
      columns,
      rows,
      mines,
    };
    boardSize = {
      width: squareSize * settings.level.columns,
      height: squareSize * settings.level.rows + counterHeight,
    };
    break;
}

let initialMines = settings.level.mines; // Used by the mine counter
let numberOfMines = initialMines; // Used to calculate mines to be allocated to squares
let squareCounter = 0; // The unique identifier of each square
let minedSquares = []; // A array containing the unique identifiers of all the squares that will contain mines

let flaggedSquares = 0;
let moves = 0; // total number of moves (left and right clicks on active squares)
let startTime = null; // used to calculate time
let gameFinished = false;
let newBestMoves = false; // used when the player has made a new best moves record
let newBestTime = false; // used when the player has made a new best time

/**
 * Mine allocation
 */
function allocateMines() {
  while (numberOfMines > 0) {
    let targetSquare = Math.floor(Math.random() * numberOfSquares);
    if (!minedSquares.includes(targetSquare)) {
      minedSquares.push(targetSquare);
      numberOfMines -= 1;
    }
  }
}

function generateSquares() {
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      let newSquare = new Square(i, j, squareCounter);
      squareCounter += 1;

      // Check whether square includes mine
      if (minedSquares.includes(newSquare.num)) {
        newSquare.mine = true;
      }
      squares.push(newSquare);
    }
  }
}

// Calculate mines around each square
function calculateMines() {
  squares.forEach(s => {
    // Find squares touching each square
    let neighbors = getNeighbors(s);
    let reducer = (accumulator, currentValue) => accumulator + currentValue;
    s.minesAround = neighbors.map(n => n.mine).reduce(reducer); // Add all mine values to find total
  });
}

// Time counter
let timePassed = 0;
let stopTimer = false;

const startTimer = () => {
  setInterval(() => {
    if (stopTimer) {
      return;
    }
    timePassed += 1;
  }, 1000);
};

/**
 * Setup
 */
function setup() {
  darkMode ? background(25) : background(255);
  cnv = createCanvas(
    boardSize.width,
    boardSize.height + squareSize * 0.75 // Added extra space for the mines, moves, and time counters
  );
  cnv.parent('board');

  // Mine allocation
  if (window.location.hash === '#debug') {
    // Forcer functionality
    const savedMines = JSON.stringify(localStorage.getItem('mines'));
    const mines = JSON.parse(savedMines);
    if (mines) {
      minedSquares = mines;
      const numberOfMines = localStorage.getItem('numberOfMines');
      initialMines = parseInt(numberOfMines, 10);
      localStorage.removeItem('mines');
      localStorage.removeItem('numberOfMines');
    } else {
      allocateMines();
    }
  } else {
    allocateMines();
  }
  generateSquares();
  calculateMines();
}

/**
 * Draw
 */
function draw() {
  darkMode ? background(25) : background(255);

  if (squares.length !== 0) {
    squares.forEach(function (s) {
      s.draw();
    });
  }

  // Show mines, moves, and time
  textSize(squareSize * 0.6);
  textStyle(BOLD);
  textFont('Arial');

  const columns = settings.level.columns;

  // Mine counter
  if (flaggedSquares > initialMines) {
    fill(248, 49, 47);
  } else {
    darkMode ? fill(225) : fill(35);
  }
  image(
    MINE,
    columns < 9
      ? width / 2 - squareSize * 1.975 + squareSize * 0.99 - 2.4 * squareSize
      : width / 2 - squareSize * 1.975 + squareSize * 0.99 - 3.4 * squareSize,
    boardSize.height,
    squareSize * 0.65,
    squareSize * 0.65
  );
  text(
    nf(Math.max(initialMines - flaggedSquares, 0), 3),
    columns < 9
      ? width / 2 - squareSize * 1.975 + squareSize * 0.99 - 1.6 * squareSize
      : width / 2 - squareSize * 1.975 + squareSize * 0.99 - 2.5 * squareSize,
    boardSize.height + 20
  );

  // Moves counter
  darkMode ? fill(225) : fill(35);
  image(
    MOVES,
    width / 2 - squareSize * 1.975 + squareSize * 1.02,
    boardSize.height,
    squareSize * 0.65,
    squareSize * 0.65
  );

  if (newBestMoves) {
    fill(255, 176, 46);
  }
  text(
    nf(moves, 3),
    width / 2 - squareSize * 1.975 + squareSize * 1.85,
    boardSize.height + 20
  );

  // Time counter
  darkMode ? fill(225) : fill(35);
  image(
    TIMER,
    columns < 9
      ? width / 2 - squareSize * 1.975 + squareSize * 0.99 + 2.7 * squareSize
      : width / 2 - squareSize * 1.975 + squareSize * 0.99 + 3.6 * squareSize,
    boardSize.height,
    squareSize * 0.65,
    squareSize * 0.65
  );

  if (newBestTime) {
    fill(255, 176, 46);
  }
  text(
    nf(timePassed, 3),
    columns < 9
      ? width / 2 - squareSize * 1.975 + squareSize * 0.99 + 3.4 * squareSize
      : width / 2 - squareSize * 1.975 + squareSize * 0.99 + 4.35 * squareSize,
    boardSize.height + 20
  );
  textSize(squareSize - squareSize * 0.05);
}

// Get neighbors
function getNeighbors(square) {
  return squares.filter(n => {
    return (
      n.i >= square.i - 1 &&
      n.i <= square.i + 1 &&
      n.j >= square.j - 1 &&
      n.j <= square.j + 1
    );
  });
}

/**
 * Mouse Action Handling
 */
let isFirstClick = true;
let mineReallocated = false;

// What happens every time the player clicks on a square
function openSquare(square) {
  // Make sure first click is not on a mine
  if (isFirstClick) {
    startTimer();
    startTime = new Date();

    // Update local storage
    if (window.location.hash === '') {
      let played;
      switch (level) {
        case 'beginner':
          played = parseInt(localStorage.getItem('beginnerPlayed'));
          played += 1;
          localStorage.setItem('beginnerPlayed', played);
          break;
        case 'intermediate':
          played = parseInt(localStorage.getItem('intermediatePlayed'));
          played += 1;
          localStorage.setItem('intermediatePlayed', played);
          break;
        case 'expert':
          played = parseInt(localStorage.getItem('expertPlayed'));
          played += 1;
          localStorage.setItem('expertPlayed', played);
          break;
      }
    }

    if (square.mine) {
      square.mine = false;
      const originalSquareNum = square.num;

      while (!mineReallocated) {
        let num = Math.floor(Math.random() * numberOfSquares);
        if (num !== originalSquareNum) {
          if (!squares[num].mine) {
            squares[num].mine = true;
            mineReallocated = true;
          }
        }
      }
    }
    isFirstClick = false;

    calculateMines();
    squares.forEach(function (s) {
      s.draw();
    });
  }

  // Open square
  square.opened = true;
  square.clicked = true;
  if (square.mine) {
    // End game
    squares.forEach(s => {
      s.opened = true;
    });
    noLoop();
    return;
  }
  if (square.minesAround == 0) {
    // Recursively open neighbors
    let neighbors = getNeighbors(square);
    neighbors.forEach(s => {
      if (!s.opened) {
        openSquare(s);
        if (s.flagged) {
          s.flagged = false;
          flaggedSquares -= 1;
        }
      }
    });
  }
}

function mousePressed() {
  // Disable click if modal is open
  if (JSON.parse(localStorage.getItem('modalOpen')) === true) {
    return;
  }
  // Flags
  if (mouseButton === RIGHT || JSON.parse(localStorage.getItem('flagMode'))) {
    // Find the square the player clicked on
    let square = squares.find(s => {
      return (
        s.x < mouseX &&
        s.x + squareSize > mouseX &&
        s.y < mouseY &&
        s.y + squareSize > mouseY
      );
    });
    if (square) {
      // Prevent opened squares from being flagged
      if (!square.opened) {
        if (!square.flagged) {
          flaggedSquares += 1;
          moves += 1;
          addMove();
        } else {
          flaggedSquares -= 1;
          moves += 1;
          addMove();
        }
        square.flagged = !square.flagged;
      }
    }
  }

  // Find the square pressed on
  if (mouseButton === LEFT && !JSON.parse(localStorage.getItem('flagMode'))) {
    if (!gameFinished) {
      let square = squares.find(s => {
        return (
          s.x < mouseX &&
          s.x + squareSize > mouseX &&
          s.y < mouseY &&
          s.y + squareSize > mouseY
        );
      });
      if (square) {
        if (square.flagged || square.opened) {
          return; // Do not allow opening when flagged
        }
        openSquare(square);
        moves += 1;
        addMove();
        if (square.mine) {
          if (!gameFinished) {
            gameLost();
            gameEnded();
          }
        } else {
          // Check if the game has been won
          let squaresLeft = squares.filter(s => {
            return !s.mine && !s.opened;
          }).length;
          if (squaresLeft == 0) {
            if (!gameFinished) {
              gameWon();
              gameEnded();
            }
          }
        }
      }
    }
  }
}

/**
 * Endgame
 */
// Handle end
function gameEnded() {
  gameFinished = true;
  if (window.location.hash === '') {
    calculateWinPercentage();

    let totalTime;
    switch (level) {
      case 'beginner':
        totalTime = parseInt(localStorage.getItem('beginnerTotalTime'));
        totalTime += timePassed;
        localStorage.setItem('beginnerTotalTime', totalTime);
        break;
      case 'intermediate':
        totalTime = parseInt(localStorage.getItem('intermediateTotalTime'));
        totalTime += timePassed;
        localStorage.setItem('intermediateTotalTime', totalTime);
        break;
      case 'expert':
        totalTime = parseInt(localStorage.getItem('expertTotalTime'));
        totalTime += timePassed;
        localStorage.setItem('expertTotalTime', totalTime);
        break;
    }
  }
}

// Handle win
function gameWon() {
  NUMBERS[0] = WON;
  squares.forEach(function (s) {
    s.opened = true;
  });

  // Update local storage
  // Won Data
  if (window.location.hash === '') {
    let won;
    switch (level) {
      case 'beginner':
        won = parseInt(localStorage.getItem('beginnerWon'));
        won += 1;
        localStorage.setItem('beginnerWon', won);
        break;
      case 'intermediate':
        won = parseInt(localStorage.getItem('intermediateWon'));
        won += 1;
        localStorage.setItem('intermediateWon', won);
        break;
      case 'expert':
        won = parseInt(localStorage.getItem('expertWon'));
        won += 1;
        localStorage.setItem('expertWon', won);
        break;
    }

    // Moves Data
    let bestMoves;
    switch (level) {
      case 'beginner':
        bestMoves = Number(localStorage.getItem('beginnerBestMoves'));
        break;
      case 'intermediate':
        bestMoves = Number(localStorage.getItem('intermediateBestMoves'));
        break;
      case 'expert':
        bestMoves = Number(localStorage.getItem('expertBestMoves'));
        break;
    }

    if (bestMoves === 0) {
      switch (level) {
        case 'beginner':
          localStorage.setItem('beginnerBestMoves', moves);
          break;
        case 'intermediate':
          localStorage.setItem('intermediateBestMoves', moves);
          break;
        case 'expert':
          localStorage.setItem('expertBestMoves', moves);
          break;
      }
    } else {
      if (moves < bestMoves) {
        const header = document.getElementById('header');
        header.style.color = '#ffaf2e';
        NUMBERS[0] = BEST;
        newBestMoves = true;
        switch (level) {
          case 'beginner':
            localStorage.setItem('beginnerBestMoves', moves);
            break;
          case 'intermediate':
            localStorage.setItem('intermediateBestMoves', moves);
            break;
          case 'expert':
            localStorage.setItem('expertBestMoves', moves);
            break;
        }
        localStorage.setItem('newBestMoves', 'true');
      }
    }

    // Time Data
    const endTime = new Date();
    let time = (endTime - startTime) / 1000; //initially in milliseconds, divide by 1000 for seconds

    let bestTime;
    switch (level) {
      case 'beginner':
        bestTime = Number(localStorage.getItem('beginnerBestTime'));
        break;
      case 'intermediate':
        bestTime = Number(localStorage.getItem('intermediateBestTime'));
        break;
      case 'expert':
        bestTime = Number(localStorage.getItem('expertBestTime'));
        break;
    }

    if (bestTime === 0) {
      switch (level) {
        case 'beginner':
          localStorage.setItem('beginnerBestTime', time);
          break;
        case 'intermediate':
          localStorage.setItem('intermediateBestTime', time);
          break;
        case 'expert':
          localStorage.setItem('expertBestTime', time);
          break;
      }
    } else {
      if (time < bestTime) {
        const header = document.getElementById('header');
        header.style.color = '#ffaf2e';
        NUMBERS[0] = BEST;
        newBestTime = true;
        switch (level) {
          case 'beginner':
            localStorage.setItem('beginnerBestTime', time);
            break;
          case 'intermediate':
            localStorage.setItem('intermediateBestTime', time);
            break;
          case 'expert':
            localStorage.setItem('expertBestTime', time);
            break;
        }
        localStorage.setItem('newBestTime', 'true');
      }
    }
  }
  stopTimer = true;

  const header = document.getElementById('header');
  header.classList.add('wavy');
}

// handle loss
function gameLost() {
  NUMBERS[0] = LOST;
  squares.forEach(function (s) {
    s.opened = true;
  });

  const endTime = new Date();
  let time = endTime - startTime; //in ms
  time = time / 1000;
  stopTimer = true;
}

// Add move to total moves
function addMove() {
  let totalMoves;
  switch (level) {
    case 'beginner':
      totalMoves = parseInt(localStorage.getItem('beginnerTotalMoves'));
      totalMoves += 1;
      localStorage.setItem('beginnerTotalMoves', totalMoves);
      break;
    case 'intermediate':
      totalMoves = parseInt(localStorage.getItem('intermediateTotalMoves'));
      totalMoves += 1;
      localStorage.setItem('intermediateTotalMoves', totalMoves);
      break;
    case 'expert':
      totalMoves = parseInt(localStorage.getItem('expertTotalMoves'));
      totalMoves += 1;
      localStorage.setItem('expertTotalMoves', totalMoves);
      break;
  }
}

// Calculate percentage of wins / total games played
function calculateWinPercentage() {
  if (window.location.hash === '') {
    let played, won;
    switch (level) {
      case 'beginner':
        played = parseInt(localStorage.getItem('beginnerPlayed'));
        won = parseInt(localStorage.getItem('beginnerWon'));
        break;
      case 'intermediate':
        played = parseInt(localStorage.getItem('intermediatePlayed'));
        won = parseInt(localStorage.getItem('intermediateWon'));
        break;
      case 'expert':
        played = parseInt(localStorage.getItem('expertPlayed'));
        won = parseInt(localStorage.getItem('expertWon'));
        break;
    }
    let winPercentage = null;

    if (played !== 0) {
      winPercentage = won / played;
    }

    if (winPercentage !== null) {
      // Update local storage
      switch (level) {
        case 'beginner':
          window.localStorage.setItem('beginnerWinPercentage', winPercentage);
          break;
        case 'intermediate':
          window.localStorage.setItem(
            'intermediateWinPercentage',
            winPercentage
          );
          break;
        case 'expert':
          window.localStorage.setItem('expertWinPercentage', winPercentage);
          break;
      }
    }
  }
}

/**
 * Keyboard Action Handling
 */
function keyPressed() {
  // Set Level
  if (
    (keyCode === 49 || keyCode === 97) &&
    window.location.hash !== '#debug' &&
    window.localStorage.getItem('modalOpen') === false
  ) {
    if (level !== 'beginner') {
      localStorage.setItem('level', 'beginner');
      window.location.reload();
    }
  }
  if (
    (keyCode === 50 || keyCode === 98) &&
    window.location.hash !== '#debug' &&
    window.localStorage.getItem('modalOpen') === false
  ) {
    if (level !== 'intermediate') {
      localStorage.setItem('level', 'intermediate');
      window.location.reload();
    }
  }
  if (
    (keyCode === 51 || keyCode === 99) &&
    window.location.hash !== '#debug' &&
    window.localStorage.getItem('modalOpen') === false
  ) {
    if (level !== 'expert') {
      localStorage.setItem('level', 'expert');
      window.location.reload();
    }
  }

  // New Game
  if (keyCode === 78) {
    window.location.reload();
  }
}
