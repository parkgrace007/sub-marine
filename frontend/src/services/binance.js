import { useMarketStore } from '../store/marketStore';

const BASE_WS_URL = 'wss://fstream.binance.com/ws';
const SYMBOL = 'btcusdt';

class BinanceService {
    constructor() {
        this.ws = null;
        this.klineCallbacks = [];
        this.currentInterval = '1m';
    }

    connect(interval = '1m') {
        if (this.ws) return;

        this.currentInterval = interval;

        // Subscribe to AggTrade (for real-time price) and Kline (for chart)
        const streams = [
            `${SYMBOL}@aggTrade`,
            `${SYMBOL}@ticker`,
            `${SYMBOL}@kline_${this.currentInterval}`
        ].join('/');

        this.ws = new WebSocket(`${BASE_WS_URL}/${streams}`);

        this.ws.onopen = () => {
            console.log(`Connected to Binance WebSocket (${this.currentInterval})`);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from Binance WebSocket. Reconnecting...');
            // Only reconnect if it wasn't manually closed for switching
            if (this.ws === null) return;
            setTimeout(() => this.connect(this.currentInterval), 3000);
            this.ws = null;
        };

        this.ws.onerror = (error) => {
            console.error('Binance WebSocket Error:', error);
        };
    }

    switchKlineInterval(interval) {
        if (this.currentInterval === interval) return;

        console.log(`Switching interval to ${interval}...`);
        this.disconnect();
        this.connect(interval);
    }

    handleMessage(data) {
        const eventType = data.e;

        if (eventType === '24hrTicker') {
            // Ticker update
            useMarketStore.getState().setMarketData({
                price: parseFloat(data.c),
                priceChangePercent: parseFloat(data.P),
                high24h: parseFloat(data.h),
                low24h: parseFloat(data.l),
                volume24h: parseFloat(data.v),
            });
        } else if (eventType === 'aggTrade') {
            // Real-time price update (faster than ticker)
            useMarketStore.getState().setMarketData({
                price: parseFloat(data.p),
            });
        } else if (eventType === 'kline') {
            // Chart data update
            const kline = data.k;
            const candle = {
                time: kline.t / 1000, // Lightweight charts uses seconds
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
            };

            this.klineCallbacks.forEach(cb => cb(candle));
        }
    }

    subscribeKline(callback) {
        this.klineCallbacks.push(callback);
        return () => {
            this.klineCallbacks = this.klineCallbacks.filter(cb => cb !== callback);
        };
    }

    async getKlines(symbol, interval, limit = 1000) {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
            const data = await response.json();
            return data.map((k) => ({
                time: k[0] / 1000,
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
            }));
        } catch (error) {
            console.error('Failed to fetch klines:', error);
            return [];
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const binanceService = new BinanceService();
