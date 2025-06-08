"use client";

import { useState } from "react";
import { GameList, GomokuBoard, PlayerStats } from "./_components";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function GomokuPage() {
  const { address: connectedAddress } = useAccount();
  const [selectedGameId, setSelectedGameId] = useState<bigint | null>(null);
  const [activeTab, setActiveTab] = useState<"play" | "games" | "stats">("games");

  // 读取等待中的游戏
  const { data: waitingGames } = useScaffoldReadContract({
    contractName: "Gomoku",
    functionName: "getWaitingGames",
  });

  // 读取玩家的游戏
  const { data: playerGames } = useScaffoldReadContract({
    contractName: "Gomoku",
    functionName: "getPlayerGames",
    args: [connectedAddress],
  });

  // 读取玩家统计
  const { data: playerStats } = useScaffoldReadContract({
    contractName: "Gomoku",
    functionName: "getPlayerStats",
    args: [connectedAddress],
  });

  // 创建游戏
  const { writeContractAsync: createGame } = useScaffoldWriteContract("Gomoku");

  const handleCreateGame = async () => {
    try {
      await createGame({
        functionName: "createGame",
      });
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleCreatePracticeGame = async () => {
    try {
      await createGame({
        functionName: "createPracticeGame" as any,
      });
    } catch (error) {
      console.error("Error creating practice game:", error);
    }
  };

  const handleSelectGame = (gameId: bigint) => {
    setSelectedGameId(gameId);
    setActiveTab("play");
  };

  if (!connectedAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8">🔴⚫ 链上五子棋</h1>
        <p className="text-lg text-gray-600">请先连接钱包开始游戏</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">🔴⚫ 链上五子棋</h1>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed justify-center mb-8">
        <button className={`tab ${activeTab === "games" ? "tab-active" : ""}`} onClick={() => setActiveTab("games")}>
          游戏大厅
        </button>
        <button
          className={`tab ${activeTab === "play" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("play")}
          disabled={!selectedGameId}
        >
          游戏棋盘
        </button>
        <button className={`tab ${activeTab === "stats" ? "tab-active" : ""}`} onClick={() => setActiveTab("stats")}>
          个人统计
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "games" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">创建对战游戏</h2>
                <p>创建一个新的五子棋游戏，等待其他玩家加入</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary" onClick={handleCreateGame}>
                    创建对战
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">练习模式 🎯</h2>
                <p>单人练习模式，一个钱包控制黑白双方，方便测试</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-secondary" onClick={handleCreatePracticeGame}>
                    开始练习
                  </button>
                </div>
              </div>
            </div>
          </div>

          <GameList
            waitingGames={waitingGames ? [...waitingGames] : []}
            playerGames={playerGames ? [...playerGames] : []}
            onSelectGame={handleSelectGame}
          />
        </div>
      )}

      {activeTab === "play" && selectedGameId && <GomokuBoard gameId={selectedGameId} />}

      {activeTab === "stats" && <PlayerStats wins={playerStats?.[0] || 0n} losses={playerStats?.[1] || 0n} />}
    </div>
  );
}
