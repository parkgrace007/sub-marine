import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { LightweightTradingChart } from '../components/Trading/Chart/LightweightTradingChart';
import { OrderPanel } from '../components/Trading/OrderForm/OrderPanel';
import { PositionsTable } from '../components/Trading/Dashboard/PositionsTable';
import { OpenOrdersTable } from '../components/Trading/Dashboard/OpenOrdersTable';
import { TradingHistoryTable } from '../components/Trading/Dashboard/TradingHistoryTable';
import { RankingTable } from '../components/Trading/Dashboard/RankingTable';
import { clsx } from 'clsx';
import { useMarketStore } from '../store/marketStore';
import { useTradingStore } from '../store/tradingStore';
import { binanceService } from '../services/binance';
import { useTradingSync } from '../hooks/useTradingSync';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Wallet } from 'lucide-react';

function TradingPage() {
    const { t } = useTranslation();
    const price = useMarketStore((state) => state.price);
    const priceChange = useMarketStore((state) => state.priceChangePercent);
    const [activeTab, setActiveTab] = useState('positions');
    const [showDemoNotice, setShowDemoNotice] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const { user } = useAuth();
    const balance = useTradingStore((state) => state.balance);
    const updatePositions = useTradingStore((state) => state.updatePositions);

    // 🆕 Safe balance display: Show 0 when not logged in
    const displayBalance = user ? balance : 0;

    // Sync trading data with Supabase
    const tradingSync = useTradingSync();

    // Check if demo notice should be shown
    useEffect(() => {
        const dismissed = localStorage.getItem('trading_demo_notice_dismissed');
        if (!dismissed) {
            setShowDemoNotice(true);
        }
    }, []);

    // Connect to Binance WebSocket for real-time price data
    useEffect(() => {
        binanceService.connect();
        return () => binanceService.disconnect();
    }, []);

    // Trading Engine Loop: Update positions on every price tick
    useEffect(() => {
        if (price > 0) {
            updatePositions(price);
        }
    }, [price, updatePositions]);

    const handleCloseDemoNotice = () => {
        if (dontShowAgain) {
            localStorage.setItem('trading_demo_notice_dismissed', 'true');
        }
        setShowDemoNotice(false);
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-surface-100 text-surface-600">
            {/* Keep real_whale Header */}
            <Header />

            {/* Trading Info Bar */}
            <div className="h-12 border-b border-surface-300 bg-surface-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">BTC/USDT Perpetual</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-base font-mono font-bold ${priceChange >= 0 ? 'text-success' : 'text-danger'}`}>
                                {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <TrendingUp size={14} className={priceChange >= 0 ? 'text-success' : 'text-danger rotate-180'} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-surface-100 px-4 py-1.5 rounded border border-surface-300">
                        <Wallet size={16} className="text-primary" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">{t('trading.balance')}:</span>
                            <span className="text-sm text-surface-600 font-mono font-semibold">
                                {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-surface-500 text-xs ml-1">USDT</span>
                                <span className="text-surface-500 text-xs ml-1">({t('trading.virtual')})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex flex-col lg:flex-row bg-surface-100 pb-4">
                {/* Left Panel: Chart, Positions & Ranking */}
                <div className="flex-1 flex flex-col p-2 gap-2 min-w-0">
                    {/* Chart */}
                    <div className="flex gap-4 h-[300px] lg:h-[500px]">
                        <div className="flex-1 min-w-0">
                            <LightweightTradingChart />
                        </div>
                    </div>

                    {/* Mobile: Order Form (shows after chart on mobile) */}
                    <div className="lg:hidden">
                        <div className="bg-surface-200 border border-surface-300 rounded overflow-hidden">
                            <OrderPanel />
                        </div>
                    </div>

                    {/* Positions Section */}
                    <div className="bg-surface-200 rounded border border-surface-300 overflow-hidden flex flex-col h-[400px]">
                        <div className="px-3 lg:px-5 py-3 border-b border-surface-300 bg-surface-200 flex gap-3 lg:gap-6 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('positions')}
                                className={clsx(
                                    "text-xs lg:text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap",
                                    activeTab === 'positions' ? "text-primary border-primary" : "text-surface-500 border-transparent hover:text-surface-600"
                                )}
                            >
                                {t('trading.positions')}
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={clsx(
                                    "text-xs lg:text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap",
                                    activeTab === 'orders' ? "text-primary border-primary" : "text-surface-500 border-transparent hover:text-surface-600"
                                )}
                            >
                                {t('trading.orders')}
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={clsx(
                                    "text-xs lg:text-sm font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap",
                                    activeTab === 'history' ? "text-primary border-primary" : "text-surface-500 border-transparent hover:text-surface-600"
                                )}
                            >
                                {t('trading.history')}
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {activeTab === 'positions' && <PositionsTable />}
                            {activeTab === 'orders' && <OpenOrdersTable />}
                            {activeTab === 'history' && <TradingHistoryTable />}
                        </div>
                    </div>

                    {/* Ranking Section - Independent Container */}
                    <div className="bg-surface-200 rounded border border-surface-300 overflow-hidden flex flex-col h-[500px]">
                        <div className="px-3 lg:px-5 py-3 border-b border-surface-300 bg-surface-200">
                            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-primary">
                                {t('trading.ranking')}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <RankingTable />
                        </div>
                    </div>
                </div>

                {/* Desktop: Order Form (right panel on desktop) */}
                <div className="hidden lg:flex w-[340px] bg-surface-200 border-l border-surface-300 flex-col shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
                    <OrderPanel />
                </div>
            </div>

            {/* Demo Notice Modal */}
            {showDemoNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface-200 border border-surface-300 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-surface-600 mb-2">📌 {t('trading.demoNotice.title')}</h2>
                            <p className="text-sm text-surface-500 leading-relaxed">
                                {t('trading.demoNotice.description')}
                            </p>
                        </div>
                        <div className="bg-surface-100 border border-surface-300 rounded p-4 mb-6">
                            <ul className="space-y-2 text-sm text-surface-500">
                                <li className="flex items-start gap-2">
                                    <span className="text-surface-400 mt-0.5">•</span>
                                    <span>{t('trading.demoNotice.point1')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-surface-400 mt-0.5">•</span>
                                    <span>{t('trading.demoNotice.point2')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-surface-400 mt-0.5">•</span>
                                    <span>{t('trading.demoNotice.point3')}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="flex items-center gap-2 text-sm text-surface-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="w-4 h-4 rounded border-surface-400 text-primary focus:ring-primary"
                                />
                                <span>{t('trading.demoNotice.dontShowAgain')}</span>
                            </label>
                            <button
                                onClick={handleCloseDemoNotice}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-text font-semibold rounded transition-colors"
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TradingPage;
