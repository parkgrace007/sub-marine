import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabase';
import { clsx } from 'clsx';
import { Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import CoinIcon from '../../CoinIcon';

export const TradingHistoryTable = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setHistory([]);
            setLoading(false);
            return;
        }

        fetchTradingHistory();
    }, [user]);

    const fetchTradingHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('trading_history')
                .select('*')
                .eq('user_id', user.id)
                .order('closed_at', { ascending: false })
                .limit(100); // Show last 100 trades

            if (fetchError) throw fetchError;

            setHistory(data || []);
        } catch (err) {
            console.error('[TradingHistoryTable] Error fetching history:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <p className="text-sm">로그인 후 거래 기록을 확인할 수 있습니다</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">거래 기록 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-danger">
                <p className="text-sm">오류: {error}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <Calendar size={32} className="mb-2 opacity-50" />
                <p className="text-sm">아직 거래 기록이 없습니다</p>
                <p className="text-xs text-surface-400 mt-1">포지션을 청산하면 기록이 저장됩니다</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="text-xs text-surface-500 border-b border-surface-300 uppercase tracking-wider font-semibold">
                    <tr>
                        <th className="pb-3 pl-5">Time</th>
                        <th className="pb-3">Symbol</th>
                        <th className="pb-3">Entry</th>
                        <th className="pb-3">Exit</th>
                        <th className="pb-3">Size</th>
                        <th className="pb-3">Leverage</th>
                        <th className="pb-3 pr-5 text-right">PnL (ROE%)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-300">
                    {history.map((trade) => {
                        const isProfit = trade.pnl >= 0;
                        const roe = trade.roe || 0;

                        return (
                            <tr key={trade.id} className="hover:bg-surface-300/30 transition-colors">
                                <td className="py-4 pl-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-surface-600 font-medium">
                                            {formatDate(trade.closed_at)}
                                        </span>
                                        <span className="text-[10px] text-surface-500">
                                            {trade.action === 'CLOSE' ? 'Close' : trade.action}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={clsx(
                                                'text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide',
                                                trade.side === 'LONG'
                                                    ? 'bg-success/20 text-success border border-success/30'
                                                    : 'bg-danger/20 text-danger border border-danger/30'
                                            )}
                                        >
                                            {trade.side}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <CoinIcon symbol={trade.symbol} size={18} />
                                            <span className="font-semibold text-surface-600">{trade.symbol}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 font-mono text-surface-500">
                                    {trade.entry_price ? trade.entry_price.toFixed(2) : '-'}
                                </td>
                                <td className="py-4 font-mono font-semibold text-surface-600">
                                    {trade.exit_price ? trade.exit_price.toFixed(2) : '-'}
                                </td>
                                <td className="py-4 font-mono text-surface-500">{trade.size}</td>
                                <td className="py-4">
                                    <span className="text-[11px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
                                        {trade.leverage}x
                                    </span>
                                </td>
                                <td className="py-4 pr-5 text-right">
                                    <div className="flex flex-col items-end">
                                        <div className={clsx('font-mono font-bold', isProfit ? 'text-success' : 'text-danger')}>
                                            {isProfit && '+'}{trade.pnl.toFixed(2)} USDT
                                        </div>
                                        <div className={clsx('text-xs font-mono', isProfit ? 'text-success/80' : 'text-danger/80')}>
                                            ({isProfit && '+'}{roe.toFixed(2)}%)
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
