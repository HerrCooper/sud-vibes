class SudokuGame {
    constructor() {
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.notes = []; // Store notes for each cell
        this.noteMode = false; // Toggle between normal and note mode
        this.selectedCell = null;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.showErrors = true;
        this.numberSystem = 'western'; // western, arabic, chinese, roman
        this.wins = parseInt(localStorage.getItem('sudoku_wins')) || 0;
        this.losses = parseInt(localStorage.getItem('sudoku_losses')) || 0;
        this.numberMaps = {
            western: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            arabic: ['', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
            chinese: ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
            roman: ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createBoard();
        this.createNumberTracker();
        this.updateStatsDisplay();
        this.newGame();
    }

    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('check-solution').addEventListener('click', () => this.checkSolution());
        document.getElementById('hint').addEventListener('click', () => this.giveHint());
        document.getElementById('reset').addEventListener('click', () => this.resetBoard());
        document.getElementById('toggle-notes').addEventListener('click', () => this.toggleNoteMode());
        document.getElementById('toggle-errors').addEventListener('click', () => this.toggleErrorHighlighting());
        document.getElementById('toggle-numbers').addEventListener('click', () => this.toggleNumberSystem());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });
        document.getElementById('theme').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
        document.getElementById('reset-stats').addEventListener('click', () => this.resetStats());
        document.getElementById('celebration-overlay').addEventListener('click', () => this.hideCelebration());

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    createBoard() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Add borders for 3x3 boxes
                if (col % 3 === 2 && col !== 8) cell.classList.add('border-right');
                if (row % 3 === 2 && row !== 8) cell.classList.add('border-bottom');

                cell.addEventListener('click', () => this.selectCell(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    createNumberTracker() {
        const trackerElement = document.getElementById('number-tracker');
        trackerElement.innerHTML = '';

        for (let num = 1; num <= 9; num++) {
            const numberItem = document.createElement('div');
            numberItem.className = 'number-item';
            numberItem.dataset.number = num;
            numberItem.textContent = this.numberMaps[this.numberSystem][num];
            trackerElement.appendChild(numberItem);
        }
    }

    updateNumberTracker() {
        const counts = Array(10).fill(0);

        // Count occurrences of each number
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = this.board[row][col];
                if (value !== 0) {
                    counts[value]++;
                }
            }
        }

        // Update the tracker display
        for (let num = 1; num <= 9; num++) {
            const numberItem = document.querySelector(`.number-item[data-number="${num}"]`);
            if (numberItem) {
                numberItem.textContent = this.numberMaps[this.numberSystem][num];
                if (counts[num] >= 9) {
                    numberItem.classList.add('completed');
                } else {
                    numberItem.classList.remove('completed');
                }
            }
        }
    }

    generateSolution() {
        // Initialize empty board
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));

        // Fill diagonal 3x3 boxes first (they don't conflict)
        for (let box = 0; box < 9; box += 3) {
            this.fillBox(box, box);
        }

        // Fill remaining cells
        this.solveSudoku(this.solution);
    }

    fillBox(row, col) {
        const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.solution[row + i][col + j] = nums[index++];
            }
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    solveSudoku(board) {
        const empty = this.findEmptyCell(board);
        if (!empty) return true;

        const [row, col] = empty;
        const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let num of nums) {
            if (this.isValidMove(board, row, col, num)) {
                board[row][col] = num;

                if (this.solveSudoku(board)) return true;

                board[row][col] = 0;
            }
        }

        return false;
    }

    findEmptyCell(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) return [row, col];
            }
        }
        return null;
    }

    isValidMove(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    createPuzzle() {
        // Copy solution to board
        this.board = this.solution.map(row => [...row]);

        // Determine number of cells to remove based on difficulty
        const cellsToRemove = {
            'easy': 35,
            'medium': 45,
            'hard': 55,
            'expert': 64,
            'joking': 70
        }[this.difficulty];

        // Remove cells randomly
        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);

            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }

        this.initialBoard = this.board.map(row => [...row]);
        // Initialize notes array
        this.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
    }

    newGame() {
        this.generateSolution();
        this.createPuzzle();
        this.renderBoard();
        this.resetTimer();
        this.startTimer();
        this.showMessage('');
    }

    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];

            // Clear existing content
            cell.innerHTML = '';
            cell.classList.remove('initial', 'user-input', 'selected', 'error', 'highlight', 'has-notes');

            if (this.initialBoard[row][col] !== 0) {
                cell.textContent = this.numberMaps[this.numberSystem][value];
                cell.classList.add('initial');
            } else if (value !== 0) {
                cell.textContent = this.numberMaps[this.numberSystem][value];
                cell.classList.add('user-input');
                // Check for errors on user input cells
                this.checkCell(row, col);
            } else if (this.notes[row][col].size > 0) {
                // Display notes
                cell.classList.add('has-notes');
                const notesContainer = document.createElement('div');
                notesContainer.className = 'notes-container';

                for (let i = 1; i <= 9; i++) {
                    const noteCell = document.createElement('div');
                    noteCell.className = 'note-cell';
                    if (this.notes[row][col].has(i)) {
                        noteCell.textContent = this.numberMaps[this.numberSystem][i];
                    }
                    notesContainer.appendChild(noteCell);
                }
                cell.appendChild(notesContainer);
            }
        });

        // Update number tracker
        this.updateNumberTracker();
    }

    selectCell(row, col) {
        // Remove previous selection
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('selected', 'highlight');
        });

        // Select new cell
        this.selectedCell = { row, col };
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');

        // Highlight related cells
        this.highlightRelatedCells(row, col);
    }

    highlightRelatedCells(row, col) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);

            // Highlight same row, column, or 3x3 box
            if (cellRow === row || cellCol === col ||
                (Math.floor(cellRow / 3) === Math.floor(row / 3) &&
                 Math.floor(cellCol / 3) === Math.floor(col / 3))) {
                cell.classList.add('highlight');
            }
        });
    }

    handleKeyPress(e) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;

        // Number keys (1-9) - only allow editing non-initial cells
        if (e.key >= '1' && e.key <= '9') {
            if (this.initialBoard[row][col] === 0) {
                const num = parseInt(e.key);

                // Use Caps Lock or note mode to toggle notes
                if (this.noteMode || e.getModifierState('CapsLock')) {
                    // Toggle note
                    if (this.notes[row][col].has(num)) {
                        this.notes[row][col].delete(num);
                    } else {
                        this.notes[row][col].add(num);
                    }
                } else {
                    // Set value and clear notes
                    this.board[row][col] = num;
                    this.notes[row][col].clear();
                    this.checkCell(row, col);
                }

                this.renderBoard();
                this.selectCell(row, col); // Re-select to maintain highlighting
            }
        }

        // Delete/Backspace to clear cell - only allow editing non-initial cells
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.initialBoard[row][col] === 0) {
                this.board[row][col] = 0;
                this.notes[row][col].clear();
                this.renderBoard();
                this.selectCell(row, col);
            }
        }

        // Arrow keys and WASD for navigation
        const arrows = {
            'ArrowUp': [-1, 0],
            'ArrowDown': [1, 0],
            'ArrowLeft': [0, -1],
            'ArrowRight': [0, 1],
            'w': [-1, 0],
            'W': [-1, 0],
            's': [1, 0],
            'S': [1, 0],
            'a': [0, -1],
            'A': [0, -1],
            'd': [0, 1],
            'D': [0, 1]
        };

        if (arrows[e.key]) {
            e.preventDefault();
            const [dRow, dCol] = arrows[e.key];
            let newRow = row + dRow;
            let newCol = col + dCol;

            // Wrap around
            if (newRow < 0) newRow = 8;
            if (newRow > 8) newRow = 0;
            if (newCol < 0) newCol = 8;
            if (newCol > 8) newCol = 0;

            this.selectCell(newRow, newCol);
        }
    }

    checkCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const value = this.board[row][col];

        if (this.showErrors && value !== 0 && !this.isValidMove(
            this.board.map((r, i) => r.map((c, j) => (i === row && j === col) ? 0 : c)),
            row, col, value
        )) {
            cell.classList.add('error');
        } else {
            cell.classList.remove('error');
        }
    }

    checkSolution() {
        let isComplete = true;
        let hasErrors = false;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    isComplete = false;
                } else if (this.board[row][col] !== this.solution[row][col]) {
                    hasErrors = true;
                }
            }
        }

        if (!isComplete) {
            this.showMessage('The puzzle is not complete yet!', 'info');
            this.recordLoss();
        } else if (hasErrors) {
            this.showMessage('There are some errors. Keep trying!', 'error');
            this.recordLoss();
        } else {
            this.recordWin();
            this.stopTimer();
            this.showCelebration();
        }
    }

    giveHint() {
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push([row, col]);
                }
            }
        }

        if (emptyCells.length === 0) {
            this.showMessage('No empty cells to fill!', 'info');
            return;
        }

        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[row][col] = this.solution[row][col];
        this.renderBoard();
        this.showMessage(`Hint: Filled cell at row ${row + 1}, column ${col + 1}`, 'info');
    }

    resetBoard() {
        this.board = this.initialBoard.map(row => [...row]);
        this.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
        this.renderBoard();
        this.showMessage('Board reset to initial state', 'info');
    }

    toggleNoteMode() {
        this.noteMode = !this.noteMode;
        const button = document.getElementById('toggle-notes');
        button.textContent = `Notes: ${this.noteMode ? 'ON' : 'OFF'}`;

        if (this.noteMode) {
            button.classList.add('active-mode');
        } else {
            button.classList.remove('active-mode');
        }
    }

    toggleErrorHighlighting() {
        this.showErrors = !this.showErrors;
        const button = document.getElementById('toggle-errors');
        button.textContent = `Mistakes: ${this.showErrors ? 'ON' : 'OFF'}`;

        // Re-render the board to update error highlighting
        this.renderBoard();
        if (this.selectedCell) {
            this.selectCell(this.selectedCell.row, this.selectedCell.col);
        }
    }

    toggleNumberSystem() {
        const systems = ['western', 'arabic', 'chinese', 'roman'];
        const currentIndex = systems.indexOf(this.numberSystem);
        this.numberSystem = systems[(currentIndex + 1) % systems.length];

        const button = document.getElementById('toggle-numbers');
        const displayScripts = {
            'western': '1 2 3',
            'arabic': '١ ٢ ٣',
            'chinese': '一 二 三',
            'roman': 'I II III'
        };
        button.textContent = displayScripts[this.numberSystem];

        // Re-render the board to update number display
        this.renderBoard();
        if (this.selectedCell) {
            this.selectCell(this.selectedCell.row, this.selectedCell.col);
        }
    }

    changeTheme(theme) {
        document.body.className = `theme-${theme}`;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showMessage(text, type = '') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }

    recordWin() {
        this.wins++;
        localStorage.setItem('sudoku_wins', this.wins);
        this.updateStatsDisplay();
    }

    recordLoss() {
        this.losses++;
        localStorage.setItem('sudoku_losses', this.losses);
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        document.getElementById('wins').textContent = this.wins;
        document.getElementById('losses').textContent = this.losses;
    }

    resetStats() {
        if (confirm('Are you sure you want to reset your win/loss statistics?')) {
            this.wins = 0;
            this.losses = 0;
            localStorage.setItem('sudoku_wins', 0);
            localStorage.setItem('sudoku_losses', 0);
            this.updateStatsDisplay();
            this.showMessage('Statistics reset!', 'info');
        }
    }

    showCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        const finalTime = document.getElementById('final-time');

        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        finalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        overlay.classList.remove('hidden');
    }

    hideCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        overlay.classList.add('hidden');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
