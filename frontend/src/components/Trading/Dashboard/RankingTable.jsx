import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRanking } from '../../../hooks/useRanking';
import {
  calculateROI,
  calculateWinRate,
  formatCurrency,
  formatPercentage,
  getRankMedal,
  getRankBgClass,
  getROIColorClass,
  getWinRateColorClass,
  truncateNickname
} from '../../../utils/rankingCalculations';
import { clsx } from 'clsx';
import { Trophy, Loader2, Lock, User } from 'lucide-react';

export const RankingTable = () => {
  const { user } = useAuth();
  const { rankings, userRank, loading, error } = useRanking();

  // 로그인 필요
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-500">
        <Lock size={32} className="mb-2 opacity-50" />
        <p className="text-sm">로그인 후 랭킹을 확인할 수 있습니다</p>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-500">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p className="text-sm">랭킹 불러오는 중...</p>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-danger">
        <p className="text-sm">오류: {error}</p>
      </div>
    );
  }

  // 데이터 없음
  if (rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-500">
        <Trophy size={32} className="mb-2 opacity-50" />
        <p className="text-sm">아직 랭킹 데이터가 없습니다</p>
        <p className="text-xs text-surface-400 mt-1">거래를 시작하면 랭킹에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* 현재 사용자 순위 카드 (랭킹 상위권 아닐 때만 표시) */}
      {userRank && userRank.rank > 10 && (
        <div className="mx-3 lg:mx-5 my-3 p-3 bg-primary/10 border border-primary rounded">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              <span className="text-surface-500">내 순위:</span>
              <span className="font-bold text-primary">#{userRank.rank}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-surface-500">ROI:</span>
              <span className={clsx('font-mono font-semibold', getROIColorClass(userRank.roi_percentage))}>
                {formatPercentage(userRank.roi_percentage)}
              </span>
            </div>
          </div>
        </div>
      )}

      <table className="w-full text-left text-sm">
        <thead className="text-xs text-surface-500 border-b border-surface-300 uppercase tracking-wider font-semibold">
          <tr>
            <th className="pb-3 pl-3 lg:pl-5">Rank</th>
            <th className="pb-3">Trader</th>
            <th className="pb-3 pr-3 lg:pr-5 text-right">ROI%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-300">
          {rankings.map((trader) => {
            const roi = trader.roi_percentage;
            const isCurrentUser = user && trader.user_id === user.id;
            const isTopThree = trader.rank <= 3;

            return (
              <tr
                key={trader.id}
                className={clsx(
                  "transition-colors",
                  getRankBgClass(trader.rank),
                  isCurrentUser && !isTopThree && "bg-primary/5 border-l-4 border-primary",
                  !isTopThree && !isCurrentUser && "hover:bg-surface-300/30"
                )}
              >
                {/* Rank */}
                <td className="py-4 pl-3 lg:pl-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getRankMedal(trader.rank)}</span>
                    <span className={clsx(
                      "font-mono font-bold",
                      trader.rank === 1 && "text-primary",
                      trader.rank === 2 && "text-surface-400",
                      trader.rank === 3 && "text-warning",
                      trader.rank > 3 && "text-surface-500"
                    )}>
                      #{trader.rank}
                    </span>
                  </div>
                </td>

                {/* Trader */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {isCurrentUser && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide bg-primary/20 text-primary border border-primary/30">
                        You
                      </span>
                    )}
                    <span className="font-semibold text-surface-600">
                      {trader.display_name || 'Anonymous'}
                    </span>
                  </div>
                </td>

                {/* ROI% */}
                <td className="py-4 pr-3 lg:pr-5 text-right">
                  <div className={clsx('font-mono font-bold text-lg', getROIColorClass(roi))}>
                    {formatPercentage(roi)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 하단 안내 */}
      <div className="px-3 lg:px-5 py-4 border-t border-surface-300 bg-surface-100">
        <p className="text-xs text-surface-500 text-center">
          랭킹은 수익률(ROI%) 기준으로 매겨집니다 • 실시간 업데이트
        </p>
      </div>
    </div>
  );
};
