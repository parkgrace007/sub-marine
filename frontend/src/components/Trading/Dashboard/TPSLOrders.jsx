import React from 'react';
import { useTradingStore } from '../../../store/tradingStore';
import { Target, Shield, X } from 'lucide-react';
import { clsx } from 'clsx';

export const TPSLOrders = ({ position }) => {
    const cancelTPSL = useTradingStore((state) => state.cancelTPSL);

    const hasTpOrders = position.takeProfitOrders.length > 0;
    const hasSlOrders = position.stopLossOrders.length > 0;

    if (!hasTpOrders && !hasSlOrders) {
        return null;
    }

    const renderOrder = (order, type) => {
        const isTP = type === 'TP';
        return (
            <div
                key={order.id}
                className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-md border text-xs',
                    isTP
                        ? 'bg-success/5 border-success/20'
                        : 'bg-danger/5 border-danger/20'
                )}
            >
                <div className="flex items-center gap-2">
                    {isTP ? (
                        <Target size={12} className="text-success" />
                    ) : (
                        <Shield size={12} className="text-danger" />
                    )}
                    <div className="flex flex-col">
                        <span className={clsx('font-mono font-semibold', isTP ? 'text-success' : 'text-danger')}>
                            {order.triggerPrice.toFixed(2)} USDT
                        </span>
                        <span className="text-surface-500 text-[10px]">
                            {order.orderType} • {order.percentage}% ({order.size.toFixed(4)})
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => cancelTPSL(position.id, order.id)}
                    className="p-1 hover:bg-surface-300 rounded transition-colors text-surface-500 hover:text-surface-600"
                    title="Cancel order"
                >
                    <X size={14} />
                </button>
            </div>
        );
    };

    return (
        <div className="px-5 pb-4 space-y-2">
            <div className="text-xs text-surface-500 font-medium uppercase tracking-wide mb-2">
                Active TP/SL Orders
            </div>
            <div className="space-y-1.5">
                {position.takeProfitOrders.map((order) => renderOrder(order, 'TP'))}
                {position.stopLossOrders.map((order) => renderOrder(order, 'SL'))}
            </div>
        </div>
    );
};
