import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { binanceService } from '../../../services/binance';
import { useMarketStore } from '../../../store/marketStore';
import { Loader2 } from 'lucide-react';

export const LightweightTradingChart = () => {
    const { t } = useTranslation();
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candlestickSeriesRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const { interval, setInterval } = useMarketStore();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // 1. Initialize Chart with Supabase Amber Theme
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: '#232323' }, // surface-200
                textColor: '#858585', // surface-500
            },
            grid: {
                vertLines: { color: '#2E2E2E' }, // surface-300
                horzLines: { color: '#2E2E2E' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: '#858585', // surface-500
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#858585',
                },
                horzLine: {
                    color: '#858585',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#858585',
                },
            },
            rightPriceScale: {
                borderColor: '#2E2E2E', // surface-300
            },
            timeScale: {
                borderColor: '#2E2E2E',
                timeVisible: true,
                secondsVisible: true,
            },
        });

        // 2. Add Candlestick Series with Semantic Colors
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#3ECF8E', // success (Green)
            downColor: '#FF4D4D', // danger (Red)
            borderUpColor: '#3ECF8E',
            borderDownColor: '#FF4D4D',
            wickUpColor: '#3ECF8E',
            wickDownColor: '#FF4D4D',
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;

        // 3. Load Historical Data & Subscribe
        const initChart = async () => {
            setIsLoading(true);
            const klines = await binanceService.getKlines('BTCUSDT', interval, 1000);
            if (klines.length > 0 && candlestickSeriesRef.current) {
                candlestickSeriesRef.current.setData(klines);
            }
            setIsLoading(false);

            // Switch real-time subscription
            binanceService.switchKlineInterval(interval);
        };

        initChart();

        // 4. Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                chart.applyOptions({ width, height });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        // 5. Subscribe to Real-time Data
        const unsubscribe = binanceService.subscribeKline((candle) => {
            if (candlestickSeriesRef.current) {
                candlestickSeriesRef.current.update(candle);
            }
        });

        return () => {
            resizeObserver.disconnect();
            unsubscribe();
            chart.remove();
            chartRef.current = null;
            candlestickSeriesRef.current = null;
        };
    }, [interval]);

    return (
        <div className="w-full h-full bg-surface-200 rounded border border-surface-300 overflow-hidden flex flex-col relative">
            {/* Header - 반응형 */}
            <div className="flex flex-col border-b border-surface-300 bg-surface-200">
                {/* 상단: BTC/USDT + 타임프레임 */}
                <div className="flex justify-between items-center px-3 lg:px-4 py-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm lg:text-lg font-bold text-surface-600">BTC/USDT</h2>
                        <span className="text-[9px] lg:text-[10px] bg-surface-300 px-1 lg:px-1.5 py-0.5 rounded text-surface-500 font-semibold">
                            {t('trading.chart.perpetual')}
                        </span>
                    </div>
                    {/* 타임프레임 버튼 */}
                    <div className="flex gap-0.5 lg:gap-1">
                        {['1m', '3m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setInterval(tf)}
                                className={`text-[10px] lg:text-[12px] px-2 lg:px-3 py-1 rounded transition-all font-medium whitespace-nowrap ${
                                    tf === interval
                                        ? 'text-primary font-bold bg-surface-300/50'
                                        : 'text-surface-500 hover:text-surface-600 hover:bg-surface-300/30'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 하단: 24시간 통계 - 데스크톱만 표시 */}
                <div className="hidden lg:flex gap-4 px-4 pb-2 text-xs">
                    <div className="flex flex-col">
                        <span className="text-surface-500">{t('trading.chart.high24h')}</span>
                        <span className="text-surface-600 font-medium">--</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-surface-500">{t('trading.chart.low24h')}</span>
                        <span className="text-surface-600 font-medium">--</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-surface-500">{t('trading.chart.vol24h')}</span>
                        <span className="text-surface-600 font-medium">--</span>
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface-200/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
                <div ref={chartContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
};
