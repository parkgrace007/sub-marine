import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    calculatePnL,
    calculateROE,
    calculateInitialMargin,
    calculateLiquidationPrice,
    calculatePartialClosePnL,
    calculateReversePosition,
    calculateMaintenanceMargin,
} from '../utils/calculations';

export const useTradingStore = create()(
    persist(
        (set, get) => ({
            balance: 10000,
            config: {
                positionMode: 'ONE_WAY',
                defaultMarginMode: 'ISOLATED',
                defaultLeverage: 20,
                confirmationsEnabled: false,
            },
            positions: [],
            orders: [],
            tradeHistory: [],
            _cacheTimestamp: Date.now(), // Cache creation time (2025-11-24)

            submitOrder: (orderParams, currentPrice, fromOrderId) => {
                const state = get();
                const { type, side, size, leverage, price, triggerType = 'LAST_PRICE', timeInForce = 'GTC', postOnly = false, reduceOnly = false, closePosition = false } = orderParams;

                // MARKET ORDER: Execute immediately
                // MARKET ORDER or MARKETABLE LIMIT ORDER: Execute immediately
                const isMarketableLimit = type === 'LIMIT' && (
                    (side === 'LONG' && price >= currentPrice) ||
                    (side === 'SHORT' && price <= currentPrice)
                );

                if (type === 'MARKET' || isMarketableLimit) {
                    // For marketable limit orders, execute at current price (better price)
                    // For market orders, execute at current price
                    const executionPrice = currentPrice;
                    const initialMargin = calculateInitialMargin(executionPrice, size, leverage);

                    if (state.balance < initialMargin) {
                        if (fromOrderId) {
                            // System triggered fill failed -> Cancel the pending order to prevent "ghost positions"
                            // when balance becomes available later.
                            alert(`Order cancelled due to insufficient balance!`);
                            set(state => ({
                                orders: state.orders.filter(o => o.id !== fromOrderId)
                            }));
                        } else {
                            alert('Insufficient Balance!');
                        }
                        return;
                    }

                    // Check position mode and existing positions
                    const existingPosition = state.positions.find(p =>
                        p.symbol === 'BTCUSDT' &&
                        (state.config.positionMode === 'ONE_WAY' || p.side === side)
                    );

                    if (existingPosition && state.config.positionMode === 'ONE_WAY') {
                        // One-way mode: merge or reduce position
                        if (existingPosition.side === side) {
                            // Same side: increase position size
                            const newSize = existingPosition.size + size;
                            const newTotalCost = (existingPosition.entryPrice * existingPosition.size) + (executionPrice * size);
                            const newAvgPrice = newTotalCost / newSize;
                            const newInitialMargin = existingPosition.initialMargin + initialMargin;
                            const newLeverage = (newAvgPrice * newSize) / newInitialMargin;

                            set(state => ({
                                balance: state.balance - initialMargin,
                                positions: state.positions.map(p =>
                                    p.id === existingPosition.id
                                        ? {
                                            ...p,
                                            size: newSize,
                                            entryPrice: newAvgPrice,
                                            initialMargin: newInitialMargin,
                                            leverage: newLeverage,
                                            liquidationPrice: calculateLiquidationPrice(newAvgPrice, newLeverage, p.side, state.balance),
                                        }
                                        : p
                                ),
                                orders: fromOrderId ? state.orders.filter(o => o.id !== fromOrderId) : state.orders,
                            }));
                        } else {
                            // Opposite side: reduce or reverse
                            if (size >= existingPosition.size) {
                                // Close and reverse
                                const closePnL = calculatePnL(existingPosition.entryPrice, executionPrice, existingPosition.size, existingPosition.side).pnl;
                                const returnBalance = existingPosition.initialMargin + closePnL;
                                const remainingSize = size - existingPosition.size;

                                if (remainingSize > 0) {
                                    // Open new position in opposite direction
                                    const newInitialMargin = calculateInitialMargin(executionPrice, remainingSize, leverage);
                                    const newPosition = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        symbol: 'BTCUSDT',
                                        side,
                                        size: remainingSize,
                                        entryPrice: executionPrice,
                                        leverage,
                                        liquidationPrice: calculateLiquidationPrice(executionPrice, leverage, side, state.balance + returnBalance - newInitialMargin),
                                        initialMargin: newInitialMargin,
                                        timestamp: Date.now(),
                                        marginMode: state.config.defaultMarginMode,
                                        unrealizedPnl: 0,
                                        roe: 0,
                                        takeProfitOrders: [],
                                        stopLossOrders: [],
                                        marginRatio: 0,
                                        maintenanceMargin: calculateMaintenanceMargin(executionPrice * remainingSize),
                                    };

                                    set(state => ({
                                        balance: state.balance + returnBalance - newInitialMargin,
                                        positions: [newPosition],
                                        orders: fromOrderId ? state.orders.filter(o => o.id !== fromOrderId) : state.orders,
                                    }));
                                } else {
                                    // Just close
                                    set(state => ({
                                        balance: state.balance + returnBalance,
                                        positions: [],
                                        orders: fromOrderId ? state.orders.filter(o => o.id !== fromOrderId) : state.orders,
                                    }));
                                }
                            } else {
                                // Partial close
                                const closePnL = calculatePnL(existingPosition.entryPrice, executionPrice, size, existingPosition.side).pnl;
                                const closedPercentage = size / existingPosition.size;
                                const returnedMargin = existingPosition.initialMargin * closedPercentage;
                                const remainingSize = existingPosition.size - size;
                                const remainingMargin = existingPosition.initialMargin - returnedMargin;

                                set(state => ({
                                    balance: state.balance + returnedMargin + closePnL,
                                    positions: state.positions.map(p =>
                                        p.id === existingPosition.id
                                            ? { ...p, size: remainingSize, initialMargin: remainingMargin }
                                            : p
                                    ),
                                    orders: fromOrderId ? state.orders.filter(o => o.id !== fromOrderId) : state.orders,
                                }));
                            }
                        }
                    } else {
                        // Create new position (HEDGE mode or first position)
                        const newPosition = {
                            id: Math.random().toString(36).substr(2, 9),
                            symbol: 'BTCUSDT',
                            side,
                            size,
                            entryPrice: executionPrice,
                            leverage,
                            liquidationPrice: calculateLiquidationPrice(executionPrice, leverage, side, state.balance),
                            initialMargin,
                            timestamp: Date.now(),
                            marginMode: state.config.defaultMarginMode,
                            unrealizedPnl: 0,
                            roe: 0,
                            takeProfitOrders: [],
                            stopLossOrders: [],
                            marginRatio: 0,
                            maintenanceMargin: calculateMaintenanceMargin(executionPrice * size),
                        };

                        set(state => ({
                            balance: state.balance - initialMargin,
                            positions: [...state.positions, newPosition],
                            orders: fromOrderId ? state.orders.filter(o => o.id !== fromOrderId) : state.orders,
                        }));
                    }
                } else {
                    // OTHER ORDER TYPES: Add to order queue
                    const newOrder = {
                        id: Math.random().toString(36).substr(2, 9),
                        symbol: 'BTCUSDT',
                        type,
                        side,
                        size,
                        leverage,
                        price,
                        timestamp: Date.now(),
                        status: 'PENDING',
                        triggerType,
                        timeInForce,
                        postOnly,
                        reduceOnly,
                        closePosition,
                        filledSize: 0,
                        averageFillPrice: 0,
                    };

                    set(state => ({ orders: [...state.orders, newOrder] }));
                }
            },

            closePosition: (id, currentPrice) => {
                const state = get();
                const position = state.positions.find(p => p.id === id);
                if (!position) return;

                const { pnl } = calculatePnL(position.entryPrice, currentPrice, position.size, position.side);
                const roe = calculateROE(pnl, position.initialMargin);
                const returnBalance = position.initialMargin + pnl;

                // Add to trade history with complete data for DB sync
                const trade = {
                    id: Math.random().toString(36).substr(2, 9),
                    orderId: id,
                    symbol: position.symbol,
                    side: position.side, // Original position side
                    action: 'CLOSE',
                    entryPrice: position.entryPrice,
                    exitPrice: currentPrice,
                    price: currentPrice, // Keep for backwards compatibility
                    size: position.size,
                    leverage: position.leverage,
                    realizedPnl: pnl,
                    roe: roe,
                    fee: 0,
                    marginMode: position.marginMode,
                    closedPercentage: 100,
                    openedAt: position.timestamp,
                    closedAt: Date.now(),
                    timestamp: Date.now(),
                };

                set(state => ({
                    balance: state.balance + returnBalance,
                    positions: state.positions.filter(p => p.id !== id),
                    tradeHistory: [trade, ...state.tradeHistory],
                }));
            },

            partialClosePosition: (positionId, amount, currentPrice) => {
                const state = get();
                const position = state.positions.find(p => p.id === positionId);
                if (!position || amount >= position.size) {
                    // Use full close if amount is invalid
                    get().closePosition(positionId, currentPrice);
                    return;
                }

                const { pnl, returnedMargin } = calculatePartialClosePnL(position, amount, currentPrice);
                const remainingSize = position.size - amount;
                const remainingMargin = position.initialMargin - (position.initialMargin * (amount / position.size));

                set(state => ({
                    balance: state.balance + returnedMargin,
                    positions: state.positions.map(p =>
                        p.id === positionId
                            ? { ...p, size: remainingSize, initialMargin: remainingMargin }
                            : p
                    ),
                }));
            },

            reversePosition: (positionId, currentPrice) => {
                const state = get();
                const position = state.positions.find(p => p.id === positionId);
                if (!position) return;

                const { closePnl, newSide } = calculateReversePosition(position, currentPrice);
                const returnBalance = position.initialMargin + closePnl;

                // Determine if we have enough balance for the new position
                const newInitialMargin = calculateInitialMargin(currentPrice, position.size, position.leverage);

                const newPosition = {
                    ...position,
                    id: Math.random().toString(36).substr(2, 9),
                    side: newSide,
                    entryPrice: currentPrice,
                    initialMargin: newInitialMargin,
                    liquidationPrice: calculateLiquidationPrice(currentPrice, position.leverage, newSide, state.balance + returnBalance - newInitialMargin),
                    timestamp: Date.now(),
                    unrealizedPnl: 0,
                    roe: 0,
                    takeProfitOrders: [], // Clear TP/SL
                    stopLossOrders: [],
                };

                set(state => ({
                    balance: state.balance + returnBalance - newInitialMargin,
                    positions: state.positions.map(p => p.id === positionId ? newPosition : p),
                }));
            },

            closeAllPositions: (currentPrice) => {
                const state = get();
                let totalReturn = 0;

                state.positions.forEach(position => {
                    const { pnl } = calculatePnL(position.entryPrice, currentPrice, position.size, position.side);
                    totalReturn += position.initialMargin + pnl;
                });

                set({
                    balance: state.balance + totalReturn,
                    positions: [],
                });
            },

            addTakeProfitOrder: (positionId, tpOrder) => {
                const tpslOrder = {
                    ...tpOrder,
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'TAKE_PROFIT',
                    status: 'ACTIVE',
                    timestamp: Date.now(),
                };

                set(state => ({
                    positions: state.positions.map(p =>
                        p.id === positionId
                            ? { ...p, takeProfitOrders: [...p.takeProfitOrders, tpslOrder] }
                            : p
                    ),
                }));
            },

            addStopLossOrder: (positionId, slOrder) => {
                const tpslOrder = {
                    ...slOrder,
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'STOP_LOSS',
                    status: 'ACTIVE',
                    timestamp: Date.now(),
                };

                set(state => ({
                    positions: state.positions.map(p =>
                        p.id === positionId
                            ? { ...p, stopLossOrders: [...p.stopLossOrders, tpslOrder] }
                            : p
                    ),
                }));
            },

            cancelTPSL: (positionId, tpslId) => {
                set(state => ({
                    positions: state.positions.map(p =>
                        p.id === positionId
                            ? {
                                ...p,
                                takeProfitOrders: p.takeProfitOrders.filter(tp => tp.id !== tpslId),
                                stopLossOrders: p.stopLossOrders.filter(sl => sl.id !== tpslId),
                            }
                            : p
                    ),
                }));
            },

            cancelOrder: (id) => {
                set(state => ({
                    orders: state.orders.map(o =>
                        o.id === id ? { ...o, status: 'CANCELED' } : o
                    ).filter(o => o.status !== 'CANCELED'),
                }));
            },

            updatePositions: (currentPrice) => {
                const state = get();
                // Capture IDs before processing to detect system-initiated removals
                const originalIds = new Set(state.positions.map(p => p.id));

                // Update unrealized PnL and ROE for all positions
                const updatedPositions = state.positions.map(pos => {
                    const { pnl } = calculatePnL(pos.entryPrice, currentPrice, pos.size, pos.side);
                    const roe = calculateROE(pnl, pos.initialMargin);
                    return { ...pos, unrealizedPnl: pnl, roe };
                });

                // Check liquidations
                const survivingPositions = updatedPositions.filter(pos => {
                    const isLiq = pos.side === 'LONG' ? currentPrice <= pos.liquidationPrice : currentPrice >= pos.liquidationPrice;
                    return !isLiq;
                });

                // Process TP/SL orders
                let positionsAfterTPSL = [...survivingPositions];
                let balanceAdjustment = 0;

                positionsAfterTPSL.forEach(pos => {
                    // Check Take Profit orders
                    pos.takeProfitOrders.forEach(tp => {
                        if (tp.status !== 'ACTIVE') return;

                        const shouldTrigger = pos.side === 'LONG'
                            ? currentPrice >= tp.triggerPrice
                            : currentPrice <= tp.triggerPrice;

                        if (shouldTrigger) {
                            // Execute TP
                            const { returnedMargin } = calculatePartialClosePnL(pos, tp.size, currentPrice);
                            balanceAdjustment += returnedMargin;

                            if (tp.size >= pos.size) {
                                // Full close
                                positionsAfterTPSL = positionsAfterTPSL.filter(p => p.id !== pos.id);
                            } else {
                                // Partial close
                                pos.size -= tp.size;
                                pos.initialMargin -= (pos.initialMargin * tp.percentage / 100);
                            }

                            tp.status = 'FILLED';
                        }
                    });

                    // Check Stop Loss orders
                    pos.stopLossOrders.forEach(sl => {
                        if (sl.status !== 'ACTIVE') return;

                        const shouldTrigger = pos.side === 'LONG'
                            ? currentPrice <= sl.triggerPrice
                            : currentPrice >= sl.triggerPrice;

                        if (shouldTrigger) {
                            // Execute SL
                            const { returnedMargin } = calculatePartialClosePnL(pos, sl.size, currentPrice);
                            balanceAdjustment += returnedMargin;

                            if (sl.size >= pos.size) {
                                // Full close
                                positionsAfterTPSL = positionsAfterTPSL.filter(p => p.id !== pos.id);
                            } else {
                                // Partial close
                                pos.size -= sl.size;
                                pos.initialMargin -= (pos.initialMargin * sl.percentage / 100);
                            }

                            sl.status = 'FILLED';
                        }
                    });
                });

                const survivingIds = new Set(positionsAfterTPSL.map(p => p.id));

                set(currentState => {
                    // Filter out positions that were in originalIds but NOT in survivingIds (System removals)
                    // Keep positions that are NOT in originalIds (New user positions)
                    // Update positions that are in both (Existing positions)

                    const mergedPositions = currentState.positions.filter(p => {
                        // If it was an original position and it's gone from survivingIds, it was liquidated/TP/SL'd
                        if (originalIds.has(p.id) && !survivingIds.has(p.id)) {
                            return false;
                        }
                        return true;
                    }).map(p => {
                        // If we have an updated version (with PnL/ROE), use it
                        const updated = positionsAfterTPSL.find(up => up.id === p.id);
                        return updated || p;
                    });

                    return {
                        positions: mergedPositions,
                        balance: currentState.balance + balanceAdjustment,
                    };
                });

                // Process pending limit orders
                const { orders } = state;
                const filledOrders = [];
                const remainingOrders = [];

                orders.forEach(order => {
                    let filled = false;
                    if (order.type === 'LIMIT' && order.status === 'PENDING') {
                        if (order.side === 'LONG' && currentPrice <= order.price) filled = true;
                        if (order.side === 'SHORT' && currentPrice >= order.price) filled = true;
                    }

                    if (filled) {
                        filledOrders.push({ ...order, status: 'FILLED' });
                    } else {
                        remainingOrders.push(order);
                    }
                });

                if (filledOrders.length > 0) {
                    // Convert filled orders to positions
                    filledOrders.forEach(order => {
                        get().submitOrder({
                            ...order,
                            type: 'MARKET',
                            price: order.price,
                        }, currentPrice, order.id); // Pass order.id to consume it atomically
                    });

                    // Note: We don't need to set orders here anymore because submitOrder handles it
                }
            },

            setPositionMode: (mode) => {
                const state = get();
                if (state.positions.length > 0) {
                    alert('Please close all positions before changing position mode');
                    return;
                }
                set(state => ({ config: { ...state.config, positionMode: mode } }));
            },

            setDefaultMarginMode: (mode) => {
                set(state => ({ config: { ...state.config, defaultMarginMode: mode } }));
            },

            setDefaultLeverage: (leverage) => {
                set(state => ({ config: { ...state.config, defaultLeverage: leverage } }));
            },
        }),
        {
            name: 'trading-storage-v2',
            version: 3, // Incremented to force cache invalidation (2025-11-24)
            migrate: (persistedState, version) => {
                // Force clear stale cache if version mismatch
                if (version !== 3) {
                    console.log('🧹 Clearing stale trading store (version upgrade: v' + version + ' → v3)')
                    return {
                        balance: 10000,
                        config: {
                            positionMode: 'ONE_WAY',
                            defaultMarginMode: 'ISOLATED',
                            defaultLeverage: 20,
                            confirmationsEnabled: false,
                        },
                        positions: [],
                        orders: [],
                        tradeHistory: [],
                        _cacheTimestamp: Date.now(),
                    }
                }
                return persistedState
            },
            onRehydrateStorage: () => (state) => {
                // Cache TTL removed - positions should persist until manually closed
                // Version migration handles breaking changes
                if (state) {
                    console.log(`✅ Trading store rehydrated (${state.positions?.length || 0} positions)`)
                }
            }
        }
    )
);
