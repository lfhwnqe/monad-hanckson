"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface GameListProps {
  waitingGames: bigint[];
  playerGames: bigint[];
  onSelectGame: (gameId: bigint) => void;
}

export const GameList = ({ waitingGames, playerGames, onSelectGame }: GameListProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 等待中的游戏 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">等待中的游戏</h2>
          <div className="space-y-2">
            {waitingGames && waitingGames.length > 0 ? (
              waitingGames.map(gameId => (
                <GameCard key={gameId.toString()} gameId={gameId} onSelect={onSelectGame} type="waiting" />
              ))
            ) : (
              <p className="text-gray-500">暂无等待中的游戏</p>
            )}
          </div>
        </div>
      </div>

      {/* 我的游戏 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">我的游戏</h2>
          <div className="space-y-2">
            {playerGames && playerGames.length > 0 ? (
              playerGames
                .slice(-5)
                .map(gameId => (
                  <GameCard key={gameId.toString()} gameId={gameId} onSelect={onSelectGame} type="player" />
                ))
            ) : (
              <p className="text-gray-500">你还没有参与任何游戏</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface GameCardProps {
  gameId: bigint;
  onSelect: (gameId: bigint) => void;
  type: "waiting" | "player";
}

const GameCard = ({ gameId, onSelect, type }: GameCardProps) => {
  const { data: gameData } = useScaffoldReadContract({
    contractName: "Gomoku",
    functionName: "getGame",
    args: [gameId],
  });

  if (!gameData) {
    return <div className="skeleton h-16 w-full"></div>;
  }

  const getStatusText = (status: number) => {
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

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "badge-warning";
      case 1:
        return "badge-success";
      case 2:
        return "badge-info";
      case 3:
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">游戏 #{gameId.toString()}</h3>
            <p className="text-sm text-gray-600">
              创建者: {gameData.player1?.slice(0, 6)}...{gameData.player1?.slice(-4)}
            </p>
            {gameData.player2 !== "0x0000000000000000000000000000000000000000" && (
              <p className="text-sm text-gray-600">
                对手: {gameData.player2?.slice(0, 6)}...{gameData.player2?.slice(-4)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`badge ${getStatusColor(gameData.status)}`}>{getStatusText(gameData.status)}</span>
            <button className="btn btn-sm btn-primary" onClick={() => onSelect(gameId)}>
              {type === "waiting" ? "加入" : "查看"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
