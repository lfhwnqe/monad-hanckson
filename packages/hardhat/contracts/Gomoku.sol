// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Gomoku
 * @dev 链上五子棋游戏合约，支持实时对战
 */
contract Gomoku is ReentrancyGuard, Ownable {
    // 棋盘大小
    uint8 public constant BOARD_SIZE = 15;
    
    // 获胜条件：连续5个棋子
    uint8 public constant WIN_CONDITION = 5;
    
    // 棋子类型
    enum PieceType { Empty, Black, White }
    
    // 游戏状态
    enum GameStatus { Waiting, Playing, Finished, Cancelled }
    
    // 游戏结构体
    struct Game {
        uint256 gameId;
        address player1;        // 黑棋玩家
        address player2;        // 白棋玩家
        address currentPlayer;  // 当前回合玩家
        GameStatus status;
        address winner;
        uint256 createdAt;
        uint256 lastMoveAt;
        PieceType[BOARD_SIZE][BOARD_SIZE] board;
        uint8 moveCount;
        bool isPracticeMode;    // 练习模式标记
    }
    
    // 移动记录
    struct Move {
        uint8 x;
        uint8 y;
        address player;
        PieceType pieceType;
        uint256 timestamp;
    }
    
    // 存储变量
    uint256 private nextGameId = 1;
    mapping(uint256 => Game) public games;
    mapping(uint256 => Move[]) public gameMoves;
    mapping(address => uint256[]) public playerGames;
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerLosses;
    
    // 待匹配的游戏列表
    uint256[] public waitingGames;
    
    // 事件
    event GameCreated(uint256 indexed gameId, address indexed player1);
    event GameJoined(uint256 indexed gameId, address indexed player1, address indexed player2);
    event MoveMade(uint256 indexed gameId, address indexed player, uint8 x, uint8 y, PieceType pieceType);
    event GameFinished(uint256 indexed gameId, address indexed winner, bool isDraw);
    event GameCancelled(uint256 indexed gameId);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev 创建新游戏
     */
    function createGame() external nonReentrant returns (uint256) {
        uint256 gameId = nextGameId++;
        
        games[gameId] = Game({
            gameId: gameId,
            player1: msg.sender,
            player2: address(0),
            currentPlayer: msg.sender,
            status: GameStatus.Waiting,
            winner: address(0),
            createdAt: block.timestamp,
            lastMoveAt: 0,
            board: _getEmptyBoard(),
            moveCount: 0,
            isPracticeMode: false
        });
        
        playerGames[msg.sender].push(gameId);
        waitingGames.push(gameId);
        
        emit GameCreated(gameId, msg.sender);
        return gameId;
    }
    
    /**
     * @dev 创建练习模式游戏（单人测试）
     */
    function createPracticeGame() external nonReentrant returns (uint256) {
        uint256 gameId = nextGameId++;
        
        games[gameId] = Game({
            gameId: gameId,
            player1: msg.sender,
            player2: msg.sender,  // 练习模式：同一个地址控制两方
            currentPlayer: msg.sender,
            status: GameStatus.Playing,  // 直接进入游戏状态
            winner: address(0),
            createdAt: block.timestamp,
            lastMoveAt: block.timestamp,
            board: _getEmptyBoard(),
            moveCount: 0,
            isPracticeMode: true
        });
        
        playerGames[msg.sender].push(gameId);
        // 不加入等待列表，因为是练习模式
        
        emit GameCreated(gameId, msg.sender);
        emit GameJoined(gameId, msg.sender, msg.sender);
        return gameId;
    }
    
    /**
     * @dev 加入游戏
     */
    function joinGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.gameId != 0, "Game does not exist");
        require(game.status == GameStatus.Waiting, "Game is not waiting for players");
        require(game.player1 != msg.sender, "Cannot join your own game");
        require(game.player2 == address(0), "Game is already full");
        
        game.player2 = msg.sender;
        game.status = GameStatus.Playing;
        game.lastMoveAt = block.timestamp;
        
        playerGames[msg.sender].push(gameId);
        _removeFromWaitingGames(gameId);
        
        emit GameJoined(gameId, game.player1, msg.sender);
    }
    
    /**
     * @dev 批量下棋 - 一次交易执行多步操作
     */
    function makeBatchMoves(
        uint256 gameId,
        uint8[] calldata xCoords,
        uint8[] calldata yCoords
    ) external nonReentrant {
        require(xCoords.length == yCoords.length, "Coordinates arrays length mismatch");
        require(xCoords.length > 0, "No moves provided");
        require(xCoords.length <= 10, "Too many moves in batch"); // 限制批量大小
        
        Game storage game = games[gameId];
        require(game.gameId != 0, "Game does not exist");
        require(game.status == GameStatus.Playing, "Game is not in playing status");
        
        // 练习模式下允许批量操作
        if (game.isPracticeMode) {
            require(msg.sender == game.player1, "Only practice game creator can move");
            
            // 执行所有移动
            for (uint i = 0; i < xCoords.length; i++) {
                _executeSingleMove(gameId, xCoords[i], yCoords[i]);
                
                // 检查游戏是否结束
                if (game.status == GameStatus.Finished) {
                    break; // 游戏结束，停止执行后续移动
                }
            }
        } else {
            revert("Batch moves only available in practice mode");
        }
    }
    
    /**
     * @dev 下棋
     */
    function makeMove(uint256 gameId, uint8 x, uint8 y) external nonReentrant {
        _executeSingleMove(gameId, x, y);
    }
    
    /**
     * @dev 执行单步移动的内部函数
     */
    function _executeSingleMove(uint256 gameId, uint8 x, uint8 y) private {
        Game storage game = games[gameId];
        require(game.gameId != 0, "Game does not exist");
        require(game.status == GameStatus.Playing, "Game is not in playing status");
        require(x < BOARD_SIZE && y < BOARD_SIZE, "Invalid coordinates");
        require(game.board[x][y] == PieceType.Empty, "Position already occupied");
        
        // 练习模式：允许同一地址控制双方
        if (game.isPracticeMode) {
            require(msg.sender == game.player1, "Only practice game creator can move");
        } else {
            require(msg.sender == game.currentPlayer, "Not your turn");
        }
        
        // 确定棋子类型
        PieceType pieceType;
        if (game.isPracticeMode) {
            // 练习模式：根据回合数决定棋子颜色
            pieceType = (game.moveCount % 2 == 0) ? PieceType.Black : PieceType.White;
        } else {
            // 正常模式：根据玩家地址决定棋子颜色
            pieceType = (msg.sender == game.player1) ? PieceType.Black : PieceType.White;
        }
        
        // 下棋
        game.board[x][y] = pieceType;
        game.moveCount++;
        game.lastMoveAt = block.timestamp;
        
        // 记录移动
        gameMoves[gameId].push(Move({
            x: x,
            y: y,
            player: msg.sender,
            pieceType: pieceType,
            timestamp: block.timestamp
        }));
        
        emit MoveMade(gameId, msg.sender, x, y, pieceType);
        
        // 检查胜负
        if (_checkWin(game.board, x, y, pieceType)) {
            game.status = GameStatus.Finished;
            game.winner = msg.sender;
            
            if (!game.isPracticeMode) {
                playerWins[msg.sender]++;
                address loser = (msg.sender == game.player1) ? game.player2 : game.player1;
                playerLosses[loser]++;
            }
            
            emit GameFinished(gameId, msg.sender, false);
        } else if (game.moveCount >= BOARD_SIZE * BOARD_SIZE) {
            // 平局
            game.status = GameStatus.Finished;
            emit GameFinished(gameId, address(0), true);
        } else {
            // 切换回合
            if (game.isPracticeMode) {
                // 练习模式：当前玩家保持不变（同一地址控制双方）
                game.currentPlayer = msg.sender;
            } else {
                // 正常模式：切换到另一个玩家
                game.currentPlayer = (msg.sender == game.player1) ? game.player2 : game.player1;
            }
        }
    }
    
    /**
     * @dev 取消游戏（仅等待状态）
     */
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.gameId != 0, "Game does not exist");
        require(game.status == GameStatus.Waiting, "Can only cancel waiting games");
        require(msg.sender == game.player1, "Only creator can cancel");
        
        game.status = GameStatus.Cancelled;
        _removeFromWaitingGames(gameId);
        
        emit GameCancelled(gameId);
    }
    
    /**
     * @dev 获取游戏信息
     */
    function getGame(uint256 gameId) external view returns (Game memory) {
        require(games[gameId].gameId != 0, "Game does not exist");
        return games[gameId];
    }
    
    /**
     * @dev 获取游戏棋盘状态
     */
    function getBoard(uint256 gameId) external view returns (PieceType[BOARD_SIZE][BOARD_SIZE] memory) {
        require(games[gameId].gameId != 0, "Game does not exist");
        return games[gameId].board;
    }
    
    /**
     * @dev 获取游戏移动记录
     */
    function getGameMoves(uint256 gameId) external view returns (Move[] memory) {
        require(games[gameId].gameId != 0, "Game does not exist");
        return gameMoves[gameId];
    }
    
    /**
     * @dev 获取玩家的游戏列表
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    /**
     * @dev 获取等待中的游戏列表
     */
    function getWaitingGames() external view returns (uint256[] memory) {
        return waitingGames;
    }
    
    /**
     * @dev 获取玩家统计信息
     */
    function getPlayerStats(address player) external view returns (uint256 wins, uint256 losses) {
        return (playerWins[player], playerLosses[player]);
    }
    
    /**
     * @dev 检查是否获胜
     */
    function _checkWin(PieceType[BOARD_SIZE][BOARD_SIZE] memory board, uint8 x, uint8 y, PieceType pieceType) private pure returns (bool) {
        // 检查四个方向：水平、垂直、对角线1、对角线2
        int8[2][4] memory directions = [
            [int8(1), int8(0)],   // 水平
            [int8(0), int8(1)],   // 垂直
            [int8(1), int8(1)],   // 对角线1
            [int8(1), int8(-1)]   // 对角线2
        ];
        
        for (uint i = 0; i < 4; i++) {
            uint8 count = 1; // 包含当前棋子
            
            // 正方向计数
            int8 dx = directions[i][0];
            int8 dy = directions[i][1];
            int8 nx = int8(x) + dx;
            int8 ny = int8(y) + dy;
            
            while (nx >= 0 && nx < int8(BOARD_SIZE) && ny >= 0 && ny < int8(BOARD_SIZE) && 
                   board[uint8(nx)][uint8(ny)] == pieceType) {
                count++;
                nx += dx;
                ny += dy;
            }
            
            // 反方向计数
            nx = int8(x) - dx;
            ny = int8(y) - dy;
            
            while (nx >= 0 && nx < int8(BOARD_SIZE) && ny >= 0 && ny < int8(BOARD_SIZE) && 
                   board[uint8(nx)][uint8(ny)] == pieceType) {
                count++;
                nx -= dx;
                ny -= dy;
            }
            
            if (count >= WIN_CONDITION) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev 获取空棋盘
     */
    function _getEmptyBoard() private pure returns (PieceType[BOARD_SIZE][BOARD_SIZE] memory) {
        PieceType[BOARD_SIZE][BOARD_SIZE] memory board;
        // Solidity默认初始化为0（Empty）
        return board;
    }
    
    /**
     * @dev 从等待列表中移除游戏
     */
    function _removeFromWaitingGames(uint256 gameId) private {
        for (uint i = 0; i < waitingGames.length; i++) {
            if (waitingGames[i] == gameId) {
                waitingGames[i] = waitingGames[waitingGames.length - 1];
                waitingGames.pop();
                break;
            }
        }
    }
}