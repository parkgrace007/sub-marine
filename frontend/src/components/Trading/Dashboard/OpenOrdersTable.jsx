import React from 'react';
import { useTradingStore } from '../../../store/tradingStore';
import { useAuth } from '../../../contexts/AuthContext';
import { clsx } from 'clsx';
import { X, Lock } from 'lucide-react';

export const OpenOrdersTable = () => {
    const { user } = useAuth();
    const orders = useTradingStore((state) => state.orders);
    const cancelOrder = useTradingStore((state) => state.cancelOrder);

    // 🔧 FIX: Add login check for consistency
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <Lock size={32} className="mb-2 opacity-50" />
                <p className="text-sm">로그인 후 주문을 확인할 수 있습니다</p>
            </div>
        );
    }

    const pendingOrders = orders.filter(o => o.status === 'PENDING');

    if (pendingOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-surface-500">
                <p className="text-sm">No open orders</p>
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
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Side</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Size</th>
                        <th className="pb-3">Filled</th>
                        <th className="pb-3 pr-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-300">
                    {pendingOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-300/30 transition-colors">
                            <td className="py-4 pl-5 text-surface-500 font-mono text-xs">
                                {new Date(order.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-4 font-bold text-surface-600">{order.symbol}</td>
                            <td className="py-4 text-surface-500 font-medium">{order.type}</td>
                            <td className="py-4">
                                <span className={clsx(
                                    "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide",
                                    order.side === 'LONG'
                                        ? "bg-success/20 text-success border border-success/30"
                                        : "bg-danger/20 text-danger border border-danger/30"
                                )}>
                                    {order.side}
                                </span>
                            </td>
                            <td className="py-4 font-mono font-medium text-surface-600">
                                {order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 font-mono font-medium text-surface-600">
                                {order.size}
                            </td>
                            <td className="py-4 font-mono text-surface-500">
                                {order.filledSize} / {order.size}
                            </td>
                            <td className="py-4 pr-5 text-right">
                                <button
                                    onClick={() => cancelOrder(order.id)}
                                    className="text-xs bg-surface-100 hover:bg-danger hover:text-white border border-surface-300 hover:border-danger text-surface-500 px-3 py-1.5 rounded transition-all font-medium inline-flex items-center gap-1.5 shadow-sm"
                                >
                                    <X size={12} />
                                    Cancel
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
