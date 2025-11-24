import { create } from 'zustand';

export const useMarketStore = create((set) => ({
    price: 0,
    priceChangePercent: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    interval: '1m',

    setMarketData: (data) => set((state) => ({ ...state, ...data })),
    setInterval: (interval) => set({ interval }),
}));
