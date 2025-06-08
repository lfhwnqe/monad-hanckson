"use client";

interface PlayerStatsProps {
  wins: bigint;
  losses: bigint;
}

export const PlayerStats = ({ wins, losses }: PlayerStatsProps) => {
  const totalGames = wins + losses;
  const winRate = totalGames > 0n ? ((Number(wins) / Number(totalGames)) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 总游戏数 */}
      <div className="stat bg-base-100 shadow-xl">
        <div className="stat-figure text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div className="stat-title">总游戏数</div>
        <div className="stat-value text-primary">{totalGames.toString()}</div>
        <div className="stat-desc">已完成的游戏</div>
      </div>

      {/* 胜利次数 */}
      <div className="stat bg-base-100 shadow-xl">
        <div className="stat-figure text-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div className="stat-title">胜利次数</div>
        <div className="stat-value text-success">{wins.toString()}</div>
        <div className="stat-desc">获得的胜利</div>
      </div>

      {/* 失败次数 */}
      <div className="stat bg-base-100 shadow-xl">
        <div className="stat-figure text-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <div className="stat-title">失败次数</div>
        <div className="stat-value text-error">{losses.toString()}</div>
        <div className="stat-desc">遭遇的失败</div>
      </div>

      {/* 胜率 */}
      <div className="stat bg-base-100 shadow-xl">
        <div className="stat-figure text-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
        </div>
        <div className="stat-title">胜率</div>
        <div className="stat-value text-warning">{winRate}%</div>
        <div className="stat-desc">{totalGames > 0n ? "当前胜率" : "暂无数据"}</div>
      </div>

      {/* 成就徽章 */}
      <div className="col-span-full">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">🏆 成就徽章</h2>
            <div className="flex flex-wrap gap-2">
              {wins >= 1n && <div className="badge badge-success gap-2">🥉 首胜</div>}
              {wins >= 5n && <div className="badge badge-success gap-2">🥈 连胜者</div>}
              {wins >= 10n && <div className="badge badge-success gap-2">🥇 五子棋高手</div>}
              {wins >= 20n && <div className="badge badge-success gap-2">👑 五子棋大师</div>}
              {totalGames >= 10n && <div className="badge badge-info gap-2">🎯 积极玩家</div>}
              {Number(winRate) >= 70 && totalGames >= 5n && <div className="badge badge-warning gap-2">⭐ 高胜率</div>}
              {totalGames === 0n && <div className="badge badge-ghost gap-2">🆕 新手玩家</div>}
            </div>
            {totalGames === 0n && <p className="text-gray-500 mt-2">开始你的第一场游戏来解锁成就徽章！</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
