/**
 * 五子棋游戏主逻辑
 * 使用ES模块语法
 */

// 游戏配置常量
const BOARD_SIZE = 15;        // 棋盘大小 15x15
const CELL_SIZE = 40;         // 每个格子的大小
const PADDING = 20;           // 棋盘边距
const PIECE_RADIUS = 16;      // 棋子半径

// 棋子类型枚举
const PIECE = {
    EMPTY: 0,    // 空位
    BLACK: 1,    // 黑棋（玩家）
    WHITE: 2     // 白棋（AI）
};

// 游戏状态
let board = [];              // 棋盘数组
let currentPlayer = PIECE.BLACK;  // 当前玩家
let gameOver = false;        // 游戏是否结束
let moveHistory = [];        // 历史记录（用于悔棋）

// 获取DOM元素
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const currentPlayerDisplay = document.getElementById('current-player');
const gameStatusDisplay = document.getElementById('game-status');
const restartBtn = document.getElementById('restart-btn');
const undoBtn = document.getElementById('undo-btn');

/**
 * 初始化游戏
 */
function initGame() {
    // 初始化棋盘数组
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(PIECE.EMPTY));
    currentPlayer = PIECE.BLACK;
    gameOver = false;
    moveHistory = [];

    // 更新显示
    updateDisplay();
    drawBoard();
}

/**
 * 绘制棋盘
 */
function drawBoard() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制棋盘背景
    ctx.fillStyle = '#d4a86a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格线
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
        // 绘制横线
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
        ctx.stroke();

        // 绘制竖线
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }

    // 绘制天元和星位
    drawStarPoints();

    // 绘制所有棋子
    drawAllPieces();
}

/**
 * 绘制星位点（天元和四个角星）
 */
function drawStarPoints() {
    ctx.fillStyle = '#8b4513';
    const starPositions = [
        [3, 3], [3, 11], [11, 3], [11, 11], // 四个角星
        [7, 7]  // 天元
    ];

    starPositions.forEach(([row, col]) => {
        ctx.beginPath();
        ctx.arc(
            PADDING + col * CELL_SIZE,
            PADDING + row * CELL_SIZE,
            4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

/**
 * 绘制所有棋子
 */
function drawAllPieces() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== PIECE.EMPTY) {
                drawPiece(row, col, board[row][col]);
            }
        }
    }
}

/**
 * 绘制单个棋子
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} piece - 棋子类型
 */
function drawPiece(row, col, piece) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;

    // 创建渐变效果
    const gradient = ctx.createRadialGradient(
        x - PIECE_RADIUS / 3,
        y - PIECE_RADIUS / 3,
        PIECE_RADIUS / 5,
        x,
        y,
        PIECE_RADIUS
    );

    if (piece === PIECE.BLACK) {
        // 黑棋渐变
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#000');
    } else {
        // 白棋渐变
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ccc');
    }

    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 棋子边框
    ctx.strokeStyle = piece === PIECE.BLACK ? '#000' : '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
}

/**
 * 处理点击事件
 * @param {MouseEvent} event - 鼠标事件
 */
function handleClick(event) {
    if (gameOver) return;

    // 计算点击位置对应的棋盘坐标
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);

    // 检查是否在有效范围内
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return;
    }

    // 检查该位置是否已有棋子
    if (board[row][col] !== PIECE.EMPTY) {
        return;
    }

    // 落子
    placePiece(row, col);
}


/**
 * 检查是否获胜
 * @param {number} row - 最后落子的行
 * @param {number} col - 最后落子的列
 * @returns {boolean} 是否获胜
 */
function checkWin(row, col) {
    const piece = board[row][col];

    // 四个方向：横、竖、左斜、右斜
    const directions = [
        [0, 1],   // 横向
        [1, 0],   // 纵向
        [1, 1],   // 右下斜
        [1, -1]   // 左下斜
    ];

    for (const [dx, dy] of directions) {
        let count = 1;  // 当前棋子算一个

        // 正方向计数
        count += countInDirection(row, col, dx, dy, piece);

        // 反方向计数
        count += countInDirection(row, col, -dx, -dy, piece);

        // 五子连珠
        if (count >= 5) {
            return true;
        }
    }

    return false;
}

/**
 * 在指定方向上计算连续相同棋子数量
 * @param {number} row - 起始行
 * @param {number} col - 起始列
 * @param {number} dx - 行方向增量
 * @param {number} dy - 列方向增量
 * @param {number} piece - 棋子类型
 * @returns {number} 连续相同棋子数量
 */
function countInDirection(row, col, dx, dy, piece) {
    let count = 0;
    let r = row + dx;
    let c = col + dy;

    while (
        r >= 0 && r < BOARD_SIZE &&
        c >= 0 && c < BOARD_SIZE &&
        board[r][c] === piece
    ) {
        count++;
        r += dx;
        c += dy;
    }

    return count;
}

/**
 * 检查是否平局
 * @returns {boolean} 是否平局
 */
function checkDraw() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === PIECE.EMPTY) {
                return false;
            }
        }
    }
    return true;
}

/**
 * AI自动下棋
 */
function aiMove() {
    if (gameOver) return;

    // 1. 先检查是否能赢
    const winMove = findBestMove(PIECE.WHITE, 4);
    if (winMove) {
        placePiece(winMove.row, winMove.col);
        return;
    }

    // 2. 检查是否需要防守（对方是否能赢）
    const defendMove = findBestMove(PIECE.BLACK, 4);
    if (defendMove) {
        placePiece(defendMove.row, defendMove.col);
        return;
    }

    // 3. 进攻：尝试形成活四/冲四
    const attackMove = findBestMove(PIECE.WHITE, 3);
    if (attackMove) {
        placePiece(attackMove.row, attackMove.col);
        return;
    }

    // 4. 防守：阻止对方活三
    const blockMove = findBestMove(PIECE.BLACK, 3);
    if (blockMove) {
        placePiece(blockMove.row, blockMove.col);
        return;
    }

    // 5. 其他进攻/防守
    const otherAttack = findBestMove(PIECE.WHITE, 2);
    if (otherAttack) {
        placePiece(otherAttack.row, otherAttack.col);
        return;
    }

    const otherDefend = findBestMove(PIECE.BLACK, 2);
    if (otherDefend) {
        placePiece(otherDefend.row, otherDefend.col);
        return;
    }

    // 6. 如果有之前的棋子，选择其周围
    if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        const nearbyMove = findNearbyEmpty(lastMove.row, lastMove.col);
        if (nearbyMove) {
            placePiece(nearbyMove.row, nearbyMove.col);
            return;
        }
    }

    // 7. 选择中心位置
    const centerRow = 7;
    const centerCol = 7;
    if (board[centerRow][centerCol] === PIECE.EMPTY) {
        placePiece(centerRow, centerCol);
        return;
    }

    // 8. 随便找一个空位
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === PIECE.EMPTY) {
                placePiece(row, col);
                return;
            }
        }
    }
}

/**
 * 在指定方向计算连续棋子数量
 * @param {number} row - 起始行
 * @param {number} col - 起始列
 * @param {number} dx - 行方向增量
 * @param {number} dy - 列方向增量
 * @param {number} piece - 棋子类型
 * @returns {object} 连续数量和边界信息
 */
function countConsecutive(row, col, dx, dy, piece) {
    let count = 0;
    let openEnds = 0;

    // 正方向计数
    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === piece) {
        count++;
        r += dx;
        c += dy;
    }
    // 检查是否有开放端
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === PIECE.EMPTY) {
        openEnds++;
    }

    // 反方向计数
    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === piece) {
        count++;
        r -= dx;
        c -= dy;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === PIECE.EMPTY) {
        openEnds++;
    }

    return { count, openEnds };
}

/**
 * 评估棋型分数
 */
function evaluatePattern(count, openEnds) {
    if (count >= 5) return 100000;  // 活五/冲五
    if (count === 4) {
        if (openEnds === 2) return 10000;   // 活四
        if (openEnds === 1) return 1000;    // 冲四
    }
    if (count === 3) {
        if (openEnds === 2) return 1000;    // 活三
        if (openEnds === 1) return 100;     // 眠三
    }
    if (count === 2) {
        if (openEnds === 2) return 100;    // 活二
        if (openEnds === 1) return 10;     // 眠二
    }
    return count;
}

/**
 * 查找最佳下棋位置
 * @param {number} piece - 棋子类型
 * @param {number} minCount - 最小连续数量
 * @returns {object|null} 最佳位置或null
 */
function findBestMove(piece, minCount) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let bestScore = 0;
    let bestMove = null;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== PIECE.EMPTY) continue;

            // 检查该位置周围是否有棋子（优化：避免在空旷处下棋）
            let hasNeighbor = false;
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                        if (board[nr][nc] !== PIECE.EMPTY) {
                            hasNeighbor = true;
                            break;
                        }
                    }
                }
                if (hasNeighbor) break;
            }
            if (!hasNeighbor) continue;

            let totalScore = 0;

            for (const [dx, dy] of directions) {
                const { count, openEnds } = countConsecutive(row, col, dx, dy, piece);
                if (count >= minCount) {
                    totalScore += evaluatePattern(count, openEnds);
                }
            }

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMove = { row, col };
            }
        }
    }

    return bestMove;
}

/**
 * 查找指定位置附近的空位
 * @param {number} row - 行
 * @param {number} col - 列
 * @returns {object|null} 空位或null
 */
function findNearbyEmpty(row, col) {
    for (let radius = 1; radius <= 2; radius++) {
        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (board[nr][nc] === PIECE.EMPTY) {
                        return { row: nr, col: nc };
                    }
                }
            }
        }
    }
    return null;
}

/**
 * 玩家下棋后触发AI
 */
function onPlayerMove() {
    // AI延迟下棋，增加游戏体验感
    setTimeout(aiMove, 500);
}

/**
 * 落子
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 */
function placePiece(row, col) {
    // 记录历史
    moveHistory.push({ row, col, player: currentPlayer });

    // 放置棋子
    board[row][col] = currentPlayer;

    // 绘制棋子
    drawPiece(row, col, currentPlayer);

    // 检查胜负
    if (checkWin(row, col)) {
        gameOver = true;
        const winner = currentPlayer === PIECE.BLACK ? '你' : 'AI';
        gameStatusDisplay.textContent = `${winner} 获胜!`;
        gameStatusDisplay.classList.add('winner-animation');
        return;
    }

    // 检查平局
    if (checkDraw()) {
        gameOver = true;
        gameStatusDisplay.textContent = '平局!';
        return;
    }

    // 切换玩家
    currentPlayer = currentPlayer === PIECE.BLACK ? PIECE.WHITE : PIECE.BLACK;
    updateDisplay();

    // 如果是AI回合，自动下棋
    if (currentPlayer === PIECE.WHITE && !gameOver) {
        onPlayerMove();
    }
}

/**
 * 悔棋
 */
function undo() {
    if (moveHistory.length === 0 || gameOver) {
        return;
    }

    // 获取最后一步
    const lastMove = moveHistory.pop();

    // 移除棋子
    board[lastMove.row][lastMove.col] = PIECE.EMPTY;

    // 恢复到上一个玩家
    currentPlayer = lastMove.player;

    // 重绘棋盘
    drawBoard();

    // 更新显示
    updateDisplay();
    gameStatusDisplay.textContent = '';
    gameStatusDisplay.classList.remove('winner-animation');
}

/**
 * 更新显示信息
 */
function updateDisplay() {
    if (currentPlayer === PIECE.BLACK) {
        currentPlayerDisplay.textContent = '你是 黑棋 - 请下棋';
    } else {
        currentPlayerDisplay.textContent = 'AI 白棋 - 思考中...';
    }
}

/**
 * 重新开始游戏
 */
function restart() {
    gameStatusDisplay.textContent = '';
    gameStatusDisplay.classList.remove('winner-animation');
    initGame();
}

// 绑定事件监听器
canvas.addEventListener('click', handleClick);
restartBtn.addEventListener('click', restart);
undoBtn.addEventListener('click', undo);

// 启动游戏
initGame();