import React, { useState } from 'react';
import { useTradingStore } from '../../../store/tradingStore';
import { useMarketStore } from '../../../store/marketStore';
import { useAuth } from '../../../contexts/AuthContext';
import { clsx } from 'clsx';
import { X, Target, Shield, MoreVertical, Repeat, ScissorsLineDashed, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { TPSLModal } from '../Modals/TPSLModal';
import { PartialCloseModal } from '../Modals/PartialCloseModal';
import { TPSLOrders } from './TPSLOrders';
import { Portal } from '../UI/Portal';
import CoinIcon from '../../CoinIcon';

export const PositionsTable = () => {
    const { user } = useAuth();
    const positions = useTradingStore((state) => state.positions);
    const closePosition = useTradingStore((state) => state.closePosition);
    const reversePosition = useTradingStore((state) => state.reversePosition);
    const currentPrice = useMarketStore((state) => state.price);

    const [activeMenu, setActiveMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);
    const [expandedPosition, setExpandedPosition] = useState(null);
    const [tpslModalPosition, setTpslModalPosition] = useState(null);
    const [partialClosePosition, setPartialClosePosition] = useState(null);

    // 🆕 Check if user is logged in
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <Lock size={32} className="mb-2 opacity-50" />
                <p className="text-sm">로그인 후 포지션을 확인할 수 있습니다</p>
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <p className="text-sm">No open positions</p>
            </div>
        );
    }

    const handleReversePosition = (pos) => {
        if (confirm(`Reverse ${pos.side} position to ${pos.side === 'LONG' ? 'SHORT' : 'LONG'}? This will close the current position and open a new one in the opposite direction.`)) {
            reversePosition(pos.id, currentPrice);
            setActiveMenu(null);
        }
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-surface-500 border-b border-surface-300 uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="pb-3 pl-5">Symbol</th>
                            <th className="pb-3">Size</th>
                            <th className="pb-3">Entry Price</th>
                            <th className="pb-3">Mark Price</th>
                            <th className="pb-3">Liq. Price</th>
                            <th className="pb-3">Margin</th>
                            <th className="pb-3">PnL (ROE%)</th>
                            <th className="pb-3 pr-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-300">
                        {positions.map((pos) => {
                            const isProfit = pos.unrealizedPnl >= 0;
                            const hasTP = pos.takeProfitOrders.length > 0;
                            const hasSL = pos.stopLossOrders.length > 0;
                            const hasOrders = hasTP || hasSL;
                            const isMenuOpen = activeMenu === pos.id;
                            const isExpanded = expandedPosition === pos.id;

                            return (
                                <React.Fragment key={pos.id}>
                                    <tr className="hover:bg-surface-300/30 transition-colors">
                                        <td className="py-4 pl-5">
                                            <div className="flex items-center gap-2.5">
                                                <span className={clsx(
                                                    "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide",
                                                    pos.side === 'LONG'
                                                        ? "bg-success/20 text-success border border-success/30"
                                                        : "bg-danger/20 text-danger border border-danger/30"
                                                )}>
                                                    {pos.side}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <CoinIcon symbol={pos.symbol} size={20} />
                                                    <span className="font-bold text-surface-600">{pos.symbol}</span>
                                                </div>
                                                <span className="text-[11px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
                                                    {Math.round(pos.leverage)}x
                                                </span>
                                                <span className="text-[10px] text-surface-500 bg-surface-300 border border-surface-300 px-1.5 py-0.5 rounded font-medium">
                                                    {pos.marginMode === 'ISOLATED' ? 'ISO' : 'CROSS'}
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            className={clsx("py-4 font-mono font-medium", pos.side === 'LONG' ? "text-success" : "text-danger")}
                                        >
                                            {pos.size}
                                        </td>
                                        <td
                                            className={clsx("py-4 font-mono font-semibold", pos.side === 'LONG' ? "text-success" : "text-danger")}
                                        >
                                            {pos.entryPrice.toFixed(2)}
                                        </td>
                                        <td
                                            className={clsx("py-4 font-mono font-bold", isProfit ? "text-success" : "text-danger")}
                                        >
                                            {currentPrice.toFixed(2)}
                                        </td>
                                        <td className="py-4 font-mono text-warning font-medium">
                                            {pos.liquidationPrice.toFixed(2)}
                                        </td>
                                        <td className="py-4 font-mono text-surface-500">{pos.initialMargin.toFixed(2)}</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div
                                                        className={clsx("font-mono font-bold", isProfit ? "text-success" : "text-danger")}
                                                    >
                                                        {pos.unrealizedPnl > 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)} USDT
                                                    </div>
                                                    <div
                                                        className={clsx("text-xs font-mono", isProfit ? "text-success/80" : "text-danger/80")}
                                                    >
                                                        ({pos.roe > 0 ? '+' : ''}{pos.roe.toFixed(2)}%)
                                                    </div>
                                                </div>
                                                {(hasTP || hasSL) && (
                                                    <button
                                                        onClick={() => setExpandedPosition(isExpanded ? null : pos.id)}
                                                        className="flex gap-1 hover:bg-surface-300 px-1.5 py-0.5 rounded transition-colors"
                                                        title="View TP/SL orders"
                                                    >
                                                        {hasTP && (
                                                            <span title={`${pos.takeProfitOrders.length} TP order(s)`}>
                                                                <Target size={14} className="text-success" />
                                                            </span>
                                                        )}
                                                        {hasSL && (
                                                            <span title={`${pos.stopLossOrders.length} SL order(s)`}>
                                                                <Shield size={14} className="text-danger" />
                                                            </span>
                                                        )}
                                                        {hasOrders && (
                                                            isExpanded ? <ChevronUp size={12} className="text-surface-500" /> : <ChevronDown size={12} className="text-surface-500" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 pr-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => closePosition(pos.id, currentPrice)}
                                                    className="text-xs bg-surface-100 hover:bg-danger hover:text-white border border-surface-300 hover:border-danger text-surface-500 px-3 py-1.5 rounded transition-all font-medium inline-flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <X size={12} />
                                                    Close
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (activeMenu === pos.id) {
                                                                setActiveMenu(null);
                                                                setMenuPosition(null);
                                                            } else {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setMenuPosition({
                                                                    top: rect.bottom + window.scrollY,
                                                                    left: rect.right + window.scrollX - 192 // 192px is w-48
                                                                });
                                                                setActiveMenu(pos.id);
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "text-xs bg-surface-100 hover:bg-surface-300 border border-surface-300 text-surface-500 px-2 py-1.5 rounded transition-all",
                                                            isMenuOpen && "bg-surface-300 text-surface-600 border-surface-400"
                                                        )}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>

                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && hasOrders && (
                                        <tr>
                                            <td colSpan={8} className="bg-surface-100 p-0">
                                                <TPSLOrders position={pos} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {tpslModalPosition && (
                <TPSLModal
                    position={tpslModalPosition}
                    onClose={() => setTpslModalPosition(null)}
                />
            )}
            {partialClosePosition && (
                <PartialCloseModal
                    position={partialClosePosition}
                    onClose={() => setPartialClosePosition(null)}
                />
            )}

            {/* Portal Menu */}
            {activeMenu && menuPosition && (
                <Portal>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => {
                            setActiveMenu(null);
                            setMenuPosition(null);
                        }}
                    />
                    <div
                        className="fixed w-48 bg-surface-200 border border-surface-300 rounded shadow-lg overflow-hidden z-50"
                        style={{
                            top: `${menuPosition.top + 4}px`,
                            left: `${menuPosition.left}px`
                        }}
                    >
                        <button
                            onClick={() => {
                                const pos = positions.find(p => p.id === activeMenu);
                                if (pos) setTpslModalPosition(pos);
                                setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-300 transition-colors flex items-center gap-2 text-surface-600"
                        >
                            <Target size={14} />
                            Set TP/SL
                        </button>
                        <button
                            onClick={() => {
                                const pos = positions.find(p => p.id === activeMenu);
                                if (pos) setPartialClosePosition(pos);
                                setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-300 transition-colors flex items-center gap-2 text-surface-600"
                        >
                            <ScissorsLineDashed size={14} />
                            Partial Close
                        </button>
                        <button
                            onClick={() => {
                                const pos = positions.find(p => p.id === activeMenu);
                                if (pos) handleReversePosition(pos);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-300 transition-colors flex items-center gap-2 text-primary"
                        >
                            <Repeat size={14} />
                            Reverse Position
                        </button>
                    </div>
                </Portal>
            )}
        </>
    );
};
