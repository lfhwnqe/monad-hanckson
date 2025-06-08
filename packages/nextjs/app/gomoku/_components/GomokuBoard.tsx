"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface GomokuBoardProps {
  gameId: bigint;
}

type PieceType = 0 | 1 | 2; // Empty, Black, White
type GameStatus = 0 | 1 | 2 | 3; // Waiting, Playing, Finished, Cancelled

export const GomokuBoard = ({ gameId }: GomokuBoardProps) => {
  const { address: connectedAddress } = useAccount();
  const BOARD_SIZE = 15;

  // 批量操作模式
  const [batchMode, setBatchMode] = useState(false);
  const [pendingMoves, setPendingMoves] = useState<{ x: number; y: number }[]>([]);
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);

  // 读取游戏信息
  const { data: gameData, refetch: refetchGame } = useScaffoldReadContract({
    contractName: "Gomoku",
    functionName: "getGame",
    args: [gameId],
  });

  // 读取棋盘状态
  const { data: boardData, refetch: refetchBoard } = useScaffoldReadContract({
    contractName: "Gomoku",
    functionName: "getBoard",
    args: [gameId],
  });

  // 下棋
  const { writeContractAsync: makeMove } = useScaffoldWriteContract("Gomoku");

  // 批量下棋
  const { writeContractAsync: makeBatchMoves } = useScaffoldWriteContract("Gomoku");

  // 加入游戏
  const { writeContractAsync: joinGame } = useScaffoldWriteContract("Gomoku");

  const [board, setBoard] = useState<PieceType[][]>(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0)),
  );

  // 更新棋盘状态
  useEffect(() => {
    if (boardData) {
      const newBoard = (boardData as any).map((row: any) => [...row] as PieceType[]);
      setBoard(newBoard);
    }
  }, [boardData]);

  // 自动刷新游戏状态
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGame();
      refetchBoard();
    }, 3000); // 每3秒刷新一次

    return () => clearInterval(interval);
  }, [refetchGame, refetchBoard]);

  // 执行批量操作
  const executeBatchMoves = async () => {
    if (pendingMoves.length === 0) return;

    try {
      setIsExecutingBatch(true);

      const xCoords = pendingMoves.map(move => move.x);
      const yCoords = pendingMoves.map(move => move.y);

      await makeBatchMoves({
        functionName: "makeBatchMoves",
        args: [gameId, xCoords, yCoords],
      });

      // 清空待执行队列
      setPendingMoves([]);
      setBatchMode(false);

      // 刷新游戏状态
      setTimeout(() => {
        refetchGame();
        refetchBoard();
      }, 1000);
    } catch (error) {
      console.error("批量操作失败:", error);
      alert("批量操作失败，请重试");
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // 清空待执行队列
  const clearPendingMoves = () => {
    setPendingMoves([]);
  };

  const handleCellClick = async (x: number, y: number) => {
    if (!gameData || !connectedAddress) return;

    // 检查游戏状态
    if (gameData.status !== 1) {
      // Playing
      alert("游戏未在进行中！");
      return;
    }

    // 练习模式下的特殊检查
    if (gameData.isPracticeMode) {
      // 练习模式：只要是游戏创建者就可以下棋
      if (gameData.player1 !== connectedAddress) {
        alert("只有游戏创建者可以在练习模式下操作！");
        return;
      }
    } else {
      // 正常模式：检查是否轮到当前玩家
      if (gameData.currentPlayer !== connectedAddress) {
        alert("不是你的回合！");
        return;
      }
    }

    // 检查位置是否为空
    if (board[x][y] !== 0) {
      alert("该位置已有棋子！");
      return;
    }

    // 检查是否已经在待执行队列中
    if (pendingMoves.some(move => move.x === x && move.y === y)) {
      alert("该位置已在待执行队列中！");
      return;
    }

    // 批量模式：添加到待执行队列
    if (batchMode && gameData.isPracticeMode) {
      setPendingMoves(prev => [...prev, { x, y }]);
      return;
    }

    // 普通模式：立即执行
    try {
      await makeMove({
        functionName: "makeMove",
        args: [gameId, x, y],
      });

      // 刷新游戏状态
      setTimeout(() => {
        refetchGame();
        refetchBoard();
      }, 1000);
    } catch (error) {
      console.error("下棋失败:", error);
      alert("下棋失败，请重试");
    }
  };

  const handleJoinGame = async () => {
    try {
      await joinGame({
        functionName: "joinGame",
        args: [gameId],
      });

      setTimeout(() => {
        refetchGame();
      }, 1000);
    } catch (error) {
      console.error("加入游戏失败:", error);
      alert("加入游戏失败，请重试");
    }
  };

  const getPieceSymbol = (piece: PieceType, x?: number, y?: number) => {
    // 检查是否在待执行队列中
    const isPending = x !== undefined && y !== undefined && pendingMoves.some(move => move.x === x && move.y === y);

    if (isPending) {
      // 显示待执行的棋子预览
      const moveIndex = pendingMoves.findIndex(move => move.x === x && move.y === y);
      const currentMoveCount = gameData?.moveCount || 0;
      const willBeBlack = (currentMoveCount + moveIndex) % 2 === 0;
      return willBeBlack ? "🔴" : "🔵"; // 用红蓝色表示待执行
    }

    switch (piece) {
      case 1:
        return "⚫"; // Black
      case 2:
        return "⚪"; // White
      default:
        return ""; // Empty
    }
  };

  const getGameStatusText = (status: GameStatus) => {
    switch (status) {
      case 0:
        return "等待玩家";
      case 1:
        return "游戏中";
      case 2:
        return "已结束";
      case 3:
        return "已取消";
      default:
        return "未知";
    }
  };

  const getCurrentPlayerText = () => {
    if (!gameData || !connectedAddress) return "";

    if (gameData.status === 2) {
      // Finished
      if (gameData.winner === "0x0000000000000000000000000000000000000000") {
        return "平局";
      }

      if (gameData.isPracticeMode) {
        return "游戏结束";
      }

      return gameData.winner === connectedAddress ? "你获胜了！" : "你败了！";
    }

    if (gameData.status === 1) {
      // Playing
      if (gameData.isPracticeMode) {
        // 练习模式：显示当前应该下什么颜色的棋子
        const isBlackTurn = gameData.moveCount % 2 === 0;
        return isBlackTurn ? "轮到黑棋 ⚫" : "轮到白棋 ⚪";
      }

      return gameData.currentPlayer === connectedAddress ? "轮到你了" : "等待对手";
    }

    return "";
  };

  if (!gameData) {
    return <div className="loading loading-spinner loading-lg"></div>;
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 游戏信息 */}
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title">
            游戏 #{gameId.toString()}
            {gameData.isPracticeMode && <span className="badge badge-secondary">练习模式</span>}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>状态:</strong> {getGameStatusText(gameData.status as GameStatus)}
            </p>
            {gameData.isPracticeMode ? (
              <>
                <p>
                  <strong>模式:</strong> 单人练习 🎯
                </p>
                <p>
                  <strong>操作者:</strong> {gameData.player1?.slice(0, 6)}...{gameData.player1?.slice(-4)}
                </p>
                <p>
                  <strong>已下棋子:</strong> {gameData.moveCount} 步
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>黑棋:</strong> {gameData.player1?.slice(0, 6)}...{gameData.player1?.slice(-4)}
                </p>
                <p>
                  <strong>白棋:</strong>{" "}
                  {gameData.player2 !== "0x0000000000000000000000000000000000000000"
                    ? `${gameData.player2?.slice(0, 6)}...${gameData.player2?.slice(-4)}`
                    : "等待加入"}
                </p>
              </>
            )}
            <p className="text-lg font-bold">{getCurrentPlayerText()}</p>
          </div>

          {gameData.status === 0 && gameData.player1 !== connectedAddress && !gameData.isPracticeMode && (
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={handleJoinGame}>
                加入游戏
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 批量操作控制面板 - 仅在练习模式显示 */}
      {gameData.isPracticeMode && gameData.status === 1 && (
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
          <div className="card-body">
            <h3 className="card-title">批量操作模式</h3>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">启用批量模式（一次确认多步操作）</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={batchMode}
                  onChange={e => setBatchMode(e.target.checked)}
                />
              </label>
            </div>

            {batchMode && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">点击棋盘添加移动到队列，然后一次性执行所有操作</p>
                <p>
                  <strong>待执行:</strong> {pendingMoves.length} 步
                </p>
                {pendingMoves.length > 0 && (
                  <div className="card-actions justify-end space-x-2">
                    <button className="btn btn-sm btn-outline" onClick={clearPendingMoves}>
                      清空队列
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={executeBatchMoves} disabled={isExecutingBatch}>
                      {isExecutingBatch ? "执行中..." : "执行批量操作"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 棋盘 */}
      <div className="gomoku-board">
        {board.map((row, x) =>
          row.map((cell, y) => (
            <button
              key={`${x}-${y}`}
              className="gomoku-cell"
              onClick={() => handleCellClick(x, y)}
              disabled={
                gameData.status !== 1 ||
                (!gameData.isPracticeMode && gameData.currentPlayer !== connectedAddress) ||
                (gameData.isPracticeMode && gameData.player1 !== connectedAddress) ||
                isExecutingBatch
              }
            >
              {getPieceSymbol(cell, x, y)}
            </button>
          )),
        )}
      </div>

      {/* 游戏说明 */}
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h3 className="card-title">游戏规则</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>黑棋先手，白棋后手</li>
            <li>率先连成5个棋子的玩家获胜</li>
            <li>可以横向、纵向或对角线连成5子</li>
            <li>每次只能下一个棋子</li>
            {gameData.isPracticeMode && (
              <li className="text-primary">
                <strong>练习模式:</strong> 启用批量操作可以一次确认执行多步操作
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
