import React, { useState } from 'react';
import { useMarketStore } from '../../../store/marketStore';
import { useTradingStore } from '../../../store/tradingStore';
import { useAuth } from '../../../contexts/AuthContext';
import { clsx } from 'clsx';
import { DollarSign, TrendingUp, TrendingDown, Lock } from 'lucide-react';

export const OrderPanel = () => {
    const price = useMarketStore((state) => state.price);
    const submitOrder = useTradingStore((state) => state.submitOrder);
    const balance = useTradingStore((state) => state.balance);
    const { user } = useAuth();

    const [orderType, setOrderType] = useState('MARKET');
    const [size, setSize] = useState('');
    const [limitPrice, setLimitPrice] = useState('');
    const [leverage, setLeverage] = useState(20);

    const [sizePercentage, setSizePercentage] = useState(0);

    const handleOrder = (orderSide) => {
        // Check if user is logged in
        if (!user) {
            alert('로그인 후 이용 가능합니다.\n\n트레이딩 게임은 로그인한 사용자만 이용할 수 있습니다.');
            return;
        }

        if (!size || parseFloat(size) <= 0) return;

        submitOrder({
            symbol: 'BTCUSDT',
            type: orderType,
            side: orderSide,
            size: parseFloat(size),
            price: orderType === 'LIMIT' ? parseFloat(limitPrice) : price,
            leverage,
            triggerType: 'LAST_PRICE',
            timeInForce: 'GTC',
            postOnly: false,
            reduceOnly: false,
            closePosition: false,
        }, price);

        // Reset form
        setSize('');
        setSizePercentage(0);
    };

    // Calculate Max Buy/Sell based on balance & leverage
    const maxBuy = price > 0 ? ((balance * leverage) / price).toFixed(4) : '0.0000';
    const maxBuyNum = parseFloat(maxBuy);
    const cost = price && size ? ((price * parseFloat(size)) / leverage).toFixed(2) : '0.00';

    const handleSizeSliderChange = (e) => {
        const pct = parseInt(e.target.value);
        setSizePercentage(pct);

        if (maxBuyNum > 0) {
            const newSize = (maxBuyNum * pct) / 100;
            setSize(newSize.toFixed(4));
        }
    };

    const handleSizeInputChange = (e) => {
        const newSize = e.target.value;
        setSize(newSize);

        if (maxBuyNum > 0 && newSize) {
            const pct = (parseFloat(newSize) / maxBuyNum) * 100;
            setSizePercentage(Math.min(100, Math.max(0, pct)));
        } else {
            setSizePercentage(0);
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-surface-300 bg-surface-200">
                <h3 className="text-sm font-bold text-surface-600 uppercase tracking-wider">Place Order</h3>
            </div>

            {/* Order Type Tabs */}
            <div className="flex bg-surface-100 p-1 m-4 rounded border border-surface-300">
                {['LIMIT', 'MARKET'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={clsx(
                            "flex-1 py-2 text-xs font-semibold rounded transition-all",
                            orderType === type
                                ? "bg-primary text-primary-text shadow-sm"
                                : "text-surface-500 hover:text-surface-600 hover:bg-surface-200"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="px-5 space-y-5">
                {/* Price Input */}
                <div>
                    <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2">
                        Price (USDT)
                    </label>
                    <div className={clsx(
                        "bg-surface-400 border rounded px-4 py-3 flex justify-between transition-all",
                        orderType === 'MARKET' ? "border-surface-300 opacity-50" : "border-surface-300 hover:border-surface-500 focus-within:border-primary"
                    )}>
                        <input
                            type="number"
                            value={orderType === 'MARKET' ? price.toFixed(2) : limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            readOnly={orderType === 'MARKET'}
                            className={clsx(
                                "bg-transparent outline-none w-full font-mono text-sm font-medium text-surface-600 placeholder-surface-500",
                                orderType === 'MARKET' && "cursor-not-allowed"
                            )}
                            placeholder="0.00"
                        />
                        <DollarSign size={16} className="text-surface-500 self-center" />
                    </div>
                </div>

                {/* Size Input */}
                <div>
                    <label className="text-xs text-surface-500 font-medium uppercase tracking-wide block mb-2 flex justify-between">
                        <span>Size (BTC)</span>
                        <span className="text-[10px] font-mono text-primary">Max: {maxBuy}</span>
                    </label>
                    <div className="bg-surface-400 border border-surface-300 rounded px-4 py-3 flex justify-between hover:border-surface-500 focus-within:border-primary transition-all">
                        <input
                            type="number"
                            value={size}
                            onChange={handleSizeInputChange}
                            className="bg-transparent outline-none w-full font-mono text-sm font-medium text-surface-600 placeholder-surface-500"
                            placeholder="0.0000"
                        />
                        <span className="text-surface-500 text-xs self-center font-semibold">BTC</span>
                    </div>

                    {/* Size Slider */}
                    <div className="pt-3">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={sizePercentage}
                            onChange={handleSizeSliderChange}
                            className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer accent-primary"
                            style={{
                                background: `linear-gradient(to right, #ffba16 0%, #ffba16 ${sizePercentage}%, #2E2E2E ${sizePercentage}%, #2E2E2E 100%)`
                            }}
                        />
                        <div className="flex justify-between text-[10px] text-surface-500 mt-1 font-medium">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                {/* Leverage Slider */}
                <div className="pt-2">
                    <div className="flex justify-between text-xs text-surface-500 mb-3 font-medium">
                        <span className="uppercase tracking-wide">Leverage</span>
                        <div className="flex items-center space-x-1">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={leverage}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val >= 1 && val <= 100) {
                                        setLeverage(val);
                                    }
                                }}
                                className="w-12 bg-transparent text-right font-mono font-bold text-sm text-primary outline-none border-b border-transparent focus:border-primary transition-colors"
                            />
                            <span className="text-primary font-mono font-bold text-sm">x</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                            background: `linear-gradient(to right, #ffba16 0%, #ffba16 ${leverage}%, #2E2E2E ${leverage}%, #2E2E2E 100%)`
                        }}
                    />
                    <div className="flex justify-between text-[10px] text-surface-500 mt-2 font-medium">
                        <span>1x</span>
                        <span>50x</span>
                        <span>100x</span>
                    </div>
                </div>

                {/* Order Info */}
                <div className="pt-2 space-y-2 text-xs">
                    <div className="flex justify-between py-2 border-t border-surface-300">
                        <span className="text-surface-500 font-medium">Required Margin</span>
                        <span className="font-mono text-surface-600 font-semibold">
                            {cost} USDT <span className="text-surface-500">(가상)</span>
                        </span>
                    </div>
                    <div className="flex justify-between pb-2">
                        <span className="text-surface-500 font-medium">Max Position</span>
                        <span className="font-mono text-surface-500">{maxBuy} BTC</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-5 border-t border-surface-300 bg-surface-200">
                {!user && (
                    <div className="bg-surface-300 border border-surface-400 rounded px-3 py-2 mb-3 flex items-center gap-2">
                        <Lock size={14} className="text-surface-500" />
                        <p className="text-[11px] text-surface-500">로그인 후 거래 가능합니다</p>
                    </div>
                )}
                <p className="text-[10px] text-surface-500 text-center mb-3">※ 실제 거래가 아닙니다</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleOrder('LONG')}
                        disabled={!user}
                        className={clsx(
                            "font-bold py-2.5 rounded transition-all shadow-sm flex items-center justify-center",
                            user
                                ? "bg-success hover:bg-success/90 text-white"
                                : "bg-surface-300 text-surface-500 cursor-not-allowed opacity-60"
                        )}
                    >
                        <span className="text-sm">Buy / Long</span>
                    </button>
                    <button
                        onClick={() => handleOrder('SHORT')}
                        disabled={!user}
                        className={clsx(
                            "font-bold py-2.5 rounded transition-all shadow-sm flex items-center justify-center",
                            user
                                ? "bg-danger hover:bg-danger/90 text-white"
                                : "bg-surface-300 text-surface-500 cursor-not-allowed opacity-60"
                        )}
                    >
                        <span className="text-sm">Sell / Short</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
