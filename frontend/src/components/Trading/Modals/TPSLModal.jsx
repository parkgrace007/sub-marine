import React, { useState } from 'react';
import { useTradingStore } from '../../../store/tradingStore';
import { useMarketStore } from '../../../store/marketStore';
import { estimateTPSLProfit } from '../../../utils/calculations';
import { X, Target, Shield } from 'lucide-react';
import { clsx } from 'clsx';

export const TPSLModal = ({ position, onClose }) => {
    const addTakeProfitOrder = useTradingStore((state) => state.addTakeProfitOrder);
    const addStopLossOrder = useTradingStore((state) => state.addStopLossOrder);
    const currentPrice = useMarketStore((state) => state.price);

    const [activeTab, setActiveTab] = useState('TP');
    const [orderType, setOrderType] = useState('MARKET');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [limitPrice, setLimitPrice] = useState('');
    const [percentage, setPercentage] = useState(100);
    const [triggerType, setTriggerType] = useState('LAST_PRICE');

    const closeSize = (position.size * percentage) / 100;

    // Calculate estimated profit/loss
    const tpPrice = activeTab === 'TP' && triggerPrice ? parseFloat(triggerPrice) : null;
    const slPrice = activeTab === 'SL' && triggerPrice ? parseFloat(triggerPrice) : null;
    const { tpProfit, slLoss } = estimateTPSLProfit(position, tpPrice, slPrice, closeSize);

    const handleSubmit = () => {
        if (!triggerPrice || parseFloat(triggerPrice) <= 0) {
            alert('Please enter a valid trigger price');
            return;
        }

        const orderData = {
            type: activeTab, // 'TAKE_PROFIT' or 'STOP_LOSS'
            orderType,
            triggerPrice: parseFloat(triggerPrice),
            limitPrice: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : undefined,
            size: closeSize,
            percentage,
            triggerType,
        };

        if (activeTab === 'TP') {
            addTakeProfitOrder(position.id, orderData);
        } else {
            addStopLossOrder(position.id, orderData);
        }

        onClose();
    };

    const quickPercentages = [25, 50, 75, 100];
    const quickPriceOffsets = [1, 2, 5, 10, 20]; // Percentage offsets

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface-200 border border-surface-300 rounded-lg shadow-lg w-[500px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-300">
                    <div>
                        <h2 className="text-lg font-bold text-surface-600">Set TP/SL Order</h2>
                        <p className="text-xs text-surface-500 mt-1">
                            {position.symbol} • {position.side} • {position.size} @ {position.entryPrice.toFixed(2)}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-6 pt-4">
                    <button
                        onClick={() => setActiveTab('TP')}
                        className={clsx(
                            'flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2',
                            activeTab === 'TP'
                                ? 'bg-success/20 text-success border-2 border-success'
                                : 'bg-surface-100 text-surface-500 border border-surface-300 hover:border-success/50'
                        )}
                    >
                        <Target size={16} />
                        Take Profit
                    </button>
                    <button
                        onClick={() => setActiveTab('SL')}
                        className={clsx(
                            'flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2',
                            activeTab === 'SL'
                                ? 'bg-danger/20 text-danger border-2 border-danger'
                                : 'bg-surface-100 text-surface-500 border border-surface-300 hover:border-danger/50'
                        )}
                    >
                        <Shield size={16} />
                        Stop Loss
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Order Type */}
                    <div>
                        <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2">Order Type</label>
                        <div className="flex gap-2">
                            {['MARKET', 'LIMIT'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={clsx(
                                        'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                                        orderType === type
                                            ? 'bg-primary text-primary-text'
                                            : 'bg-surface-100 text-surface-500 hover:bg-surface-300/50'
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Price Buttons */}
                    <div>
                        <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2">
                            Quick {activeTab === 'TP' ? 'Profit' : 'Stop'} Targets
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {quickPriceOffsets.map((offset) => {
                                const multiplier = activeTab === 'TP'
                                    ? (position.side === 'LONG' ? 1 : -1)
                                    : (position.side === 'LONG' ? -1 : 1);
                                const targetPrice = currentPrice * (1 + (offset / 100) * multiplier);

                                return (
                                    <button
                                        key={offset}
                                        onClick={() => setTriggerPrice(targetPrice.toFixed(2))}
                                        className="py-2 px-3 bg-surface-100 hover:bg-surface-300 border border-surface-300 hover:border-primary rounded-md text-xs font-semibold transition-all text-surface-600"
                                    >
                                        {offset}%
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Trigger Price */}
                    <div>
                        <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2">
                            Trigger Price
                        </label>
                        <input
                            type="number"
                            value={triggerPrice}
                            onChange={(e) => setTriggerPrice(e.target.value)}
                            className="w-full bg-surface-400 border border-surface-300 rounded-lg px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none transition-colors text-surface-600 placeholder-surface-500"
                            placeholder={currentPrice.toFixed(2)}
                        />
                    </div>

                    {/* Limit Price (only for LIMIT orders) */}
                    {orderType === 'LIMIT' && (
                        <div>
                            <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2">
                                Limit Price
                            </label>
                            <input
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-full bg-surface-400 border border-surface-300 rounded-lg px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none transition-colors text-surface-600 placeholder-surface-500"
                                placeholder={triggerPrice || currentPrice.toFixed(2)}
                            />
                        </div>
                    )}

                    {/* Trigger Type */}
                    <div>
                        <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2">
                            Trigger By
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: 'LAST_PRICE', label: 'Last Price' },
                                { value: 'MARK_PRICE', label: 'Mark Price' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTriggerType(option.value)}
                                    className={clsx(
                                        'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                                        triggerType === option.value
                                            ? 'bg-primary text-primary-text'
                                            : 'bg-surface-100 text-surface-500 hover:bg-surface-300/50'
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Percentage */}
                    <div>
                        <div className="flex justify-between text-xs text-surface-500 mb-2 font-medium">
                            <span className="uppercase tracking-wide">Close Size</span>
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
                        <div className="flex gap-2 mt-2">
                            {quickPercentages.map((pct) => (
                                <button
                                    key={pct}
                                    onClick={() => setPercentage(pct)}
                                    className="flex-1 py-1.5 bg-surface-100 hover:bg-surface-300 border border-surface-300 hover:border-primary rounded text-xs font-semibold transition-all text-surface-600"
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estimated Profit/Loss */}
                    {triggerPrice && (
                        <div className="bg-surface-400 border border-surface-300 rounded-lg p-4">
                            <div className="text-xs text-surface-500 uppercase tracking-wide mb-2">Estimated {activeTab === 'TP' ? 'Profit' : 'Loss'}</div>
                            <div className={clsx(
                                'text-2xl font-mono font-bold',
                                activeTab === 'TP'
                                    ? (tpProfit && tpProfit > 0 ? 'text-success' : 'text-surface-500')
                                    : (slLoss && slLoss < 0 ? 'text-danger' : 'text-surface-500')
                            )}>
                                {activeTab === 'TP'
                                    ? (tpProfit ? `+${tpProfit.toFixed(2)}` : '0.00')
                                    : (slLoss ? slLoss.toFixed(2) : '0.00')
                                } USDT
                            </div>
                            <div className="text-xs text-surface-500 mt-1">
                                {percentage}% of position • {orderType} order
                            </div>
                        </div>
                    )}
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
                        onClick={handleSubmit}
                        className={clsx(
                            'flex-1 py-3 rounded-lg font-semibold text-sm transition-all text-white',
                            activeTab === 'TP'
                                ? 'bg-success hover:bg-success/90'
                                : 'bg-danger hover:bg-danger/90'
                        )}
                    >
                        Set {activeTab} Order
                    </button>
                </div>
            </div>
        </div>
    );
};
