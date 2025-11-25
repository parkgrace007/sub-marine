import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { rankings, userRank, loading, error } = useRanking();

  // 로그인 필요
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-500">
        <Lock size={32} className="mb-2 opacity-50" />
        <p className="text-sm">{t('trading.rankingTable.loginToView')}</p>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-500">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p className="text-sm">{t('trading.rankingTable.loading')}</p>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-danger">
        <p className="text-sm">{t('common.error')}: {error}</p>
      </div>
    );
  }

  // 데이터 없음
  if (rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-500">
        <Trophy size={32} className="mb-2 opacity-50" />
        <p className="text-sm">{t('trading.rankingTable.noData')}</p>
        <p className="text-xs text-surface-400 mt-1">{t('trading.rankingTable.noDataDesc')}</p>
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
              <span className="text-surface-500">{t('trading.rankingTable.myRank')}:</span>
              <span className="font-bold text-primary">#{userRank.rank}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-surface-500">{t('trading.rankingTable.roi')}:</span>
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
            <th className="pb-3 pl-3 lg:pl-5">{t('trading.rankingTable.rank')}</th>
            <th className="pb-3">{t('trading.rankingTable.trader')}</th>
            <th className="pb-3 pr-3 lg:pr-5 text-right">{t('trading.rankingTable.roi')}</th>
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
                        {t('trading.rankingTable.you')}
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
          {t('trading.rankingTable.footer')}
        </p>
      </div>
    </div>
  );
};
