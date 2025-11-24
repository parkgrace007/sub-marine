import React, { useState } from 'react';
import { useTradingStore } from '../../../store/tradingStore';
import { useMarketStore } from '../../../store/marketStore';
import { calculatePartialClosePnL } from '../../../utils/calculations';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export const PartialCloseModal = ({ position, onClose }) => {
    const partialClosePosition = useTradingStore((state) => state.partialClosePosition);
    const currentPrice = useMarketStore((state) => state.price);

    const [percentage, setPercentage] = useState(50);
    const closeSize = (position.size * percentage) / 100;

    const { pnl, returnedMargin, remainingSize } = calculatePartialClosePnL(
        position,
        closeSize,
        currentPrice
    );

    const handleClose = () => {
        partialClosePosition(position.id, closeSize, currentPrice);
        onClose();
    };

    const quickPercentages = [25, 50, 75, 100];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface-200 border border-surface-300 rounded-lg shadow-lg w-[450px]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-300">
                    <div>
                        <h2 className="text-lg font-bold text-surface-600">Partial Close Position</h2>
                        <p className="text-xs text-surface-500 mt-1">
                            {position.symbol} • {position.side} • {position.size}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Size Slider */}
                    <div>
                        <div className="flex justify-between text-xs text-surface-500 mb-3 font-medium">
                            <span className="uppercase tracking-wide">Close Amount</span>
                            <span className="text-surface-600 font-mono">{percentage}% ({closeSize.toFixed(4)} {position.symbol.replace('USDT', '')})</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={percentage}
                            onChange={(e) => setPercentage(parseInt(e.target.value))}
                            className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #ffba16 0%, #ffba16 ${percentage}%, #2E2E2E ${percentage}%, #2E2E2E 100%)`
                            }}
                        />
                        <div className="flex gap-2 mt-3">
                            {quickPercentages.map((pct) => (
                                <button
                                    key={pct}
                                    onClick={() => setPercentage(pct)}
                                    className="flex-1 py-2 bg-surface-100 hover:bg-surface-300 border border-surface-300 hover:border-primary rounded-md text-xs font-semibold transition-all text-surface-600"
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-surface-400 border border-surface-300 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-surface-500">Current Price</span>
                            <span className="font-mono text-surface-600">{currentPrice.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-surface-500">Entry Price</span>
                            <span className="font-mono text-surface-600">{position.entryPrice.toFixed(2)} USDT</span>
                        </div>
                        <div className="h-px bg-surface-300"></div>
                        <div className="flex justify-between text-sm">
                            <span className="text-surface-500">Closing Size</span>
                            <span className="font-mono text-surface-600">{closeSize.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-surface-500">Remaining Size</span>
                            <span className="font-mono text-surface-600">{remainingSize.toFixed(4)}</span>
                        </div>
                        <div className="h-px bg-surface-300"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-surface-500 text-sm">Realized PnL</span>
                            <div className="text-right">
                                <div className={clsx(
                                    'font-mono font-bold text-lg',
                                    pnl >= 0 ? 'text-success' : 'text-danger'
                                )}>
                                    {pnl > 0 ? '+' : ''}{pnl.toFixed(2)} USDT
                                </div>
                                <div className="text-xs text-surface-500">
                                    +{returnedMargin.toFixed(2)} returned
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
                        <strong>Note:</strong> This will close {percentage}% of your position at market price. Any attached TP/SL orders will remain active for the remaining position.
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-surface-300 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-surface-100 hover:bg-surface-300 border border-surface-300 rounded-lg font-semibold text-sm transition-all text-surface-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-text rounded-lg font-semibold text-sm transition-all"
                    >
                        Close {percentage}%
                    </button>
                </div>
            </div>
        </div>
    );
};
