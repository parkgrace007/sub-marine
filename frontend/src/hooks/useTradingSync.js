import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTradingStore } from '../store/tradingStore';
import { supabase } from '../utils/supabase';

/**
 * useTradingSync Hook
 *
 * Synchronizes Zustand tradingStore with Supabase database:
 * 1. Loads user's trading_balance from DB on login
 * 2. Saves closed positions to trading_history table
 * 3. Updates profile statistics (total_trades, winning_trades, total_pnl, etc.)
 * 4. Subscribes to realtime trading_history updates
 */
export const useTradingSync = () => {
  const { user, profile, updateTradingBalance } = useAuth();
  const balance = useTradingStore((state) => state.balance);
  const tradeHistory = useTradingStore((state) => state.tradeHistory);
  const previousTradeCountRef = useRef(0);
  const syncedTradeIdsRef = useRef(new Set());
  const previousUserIdRef = useRef(null);

  // 🆕 0-1. 미로그인 시 거래 데이터 초기화
  useEffect(() => {
    if (!user) {
      console.log('[useTradingSync] User logged out, resetting store to initial state')
      useTradingStore.setState({
        balance: 0,
        positions: [],
        orders: [],
        tradeHistory: []
      })
    }
  }, [user])

  // 🆕 0-2. 계정 변경 시 Store 초기화 (다른 계정으로 로그인 시)
  useEffect(() => {
    if (user && user.id !== previousUserIdRef.current && previousUserIdRef.current !== null) {
      // 계정이 변경되었을 때 이전 계정의 데이터 제거
      console.log('[useTradingSync] User changed, resetting store')
      useTradingStore.setState({
        balance: 0, // 🔧 FIX: Reset to 0, will be loaded from DB in next effect
        positions: [],
        orders: [],
        tradeHistory: []
      })
    }

    // Update previous user ID
    previousUserIdRef.current = user?.id || null
  }, [user?.id])

  // 1. Load balance from DB on login
  useEffect(() => {
    if (!user || !profile) return;

    const dbBalance = profile.trading_balance || 0;
    const currentBalance = useTradingStore.getState().balance;

    // Only sync if DB balance differs from Zustand (avoid overwriting local changes)
    if (Math.abs(dbBalance - currentBalance) > 0.01) {
      console.log('[useTradingSync] Syncing balance from DB:', dbBalance);
      useTradingStore.setState({ balance: dbBalance });
    }
  }, [user, profile]);

  // 2. Save new trades to DB when tradeHistory changes
  useEffect(() => {
    if (!user) return;

    const currentTradeCount = tradeHistory.length;

    // Detect new trades (when count increases)
    if (currentTradeCount > previousTradeCountRef.current) {
      const newTrades = tradeHistory.slice(0, currentTradeCount - previousTradeCountRef.current);

      // 🔧 FIX: Use for...of instead of forEach to prevent race condition
      // Sequential processing ensures profile stats are updated correctly
      (async () => {
        for (const trade of newTrades) {
          // Prevent duplicate saves using trade.id
          if (syncedTradeIdsRef.current.has(trade.id)) {
            continue;
          }

          console.log('[useTradingSync] Saving trade to DB:', trade);

          try {
            // Calculate if this was a winning trade
            const isWinningTrade = trade.realizedPnl > 0;

            // Save to trading_history
            const { error: historyError } = await supabase
              .from('trading_history')
              .insert({
                user_id: user.id,
                symbol: trade.symbol,
                side: trade.side,
                action: trade.action || 'CLOSE',
                entry_price: trade.entryPrice,
                exit_price: trade.exitPrice || trade.price,
                size: trade.size,
                leverage: trade.leverage || 1,
                pnl: trade.realizedPnl,
                roe: trade.roe || 0,
                fee: trade.fee || 0,
                margin_mode: trade.marginMode || 'ISOLATED',
                position_id: trade.orderId,
                closed_percentage: trade.closedPercentage || 100,
                opened_at: trade.openedAt ? new Date(trade.openedAt).toISOString() : null,
                closed_at: new Date(trade.closedAt || trade.timestamp).toISOString(),
              });

            if (historyError) {
              console.error('[useTradingSync] Error saving trade:', historyError);
              continue;
            }

            // Update profile statistics
            const currentStats = {
              total_trades: (profile.total_trades || 0) + 1,
              winning_trades: (profile.winning_trades || 0) + (isWinningTrade ? 1 : 0),
              total_pnl: (profile.total_pnl || 0) + trade.realizedPnl,
              last_trade_at: new Date(trade.timestamp).toISOString(),
            };

            // Check for all-time high balance
            const newBalance = balance;
            if (newBalance > (profile.all_time_high_balance || 0)) {
              currentStats.all_time_high_balance = newBalance;
            }

            // Calculate max drawdown
            const currentDrawdown = ((profile.all_time_high_balance - newBalance) / profile.all_time_high_balance) * 100;
            if (currentDrawdown > (profile.max_drawdown || 0)) {
              currentStats.max_drawdown = currentDrawdown;
            }

            // Update profile in DB (sequential - prevents race condition)
            await updateTradingBalance(newBalance, currentStats);

            // Mark this trade as synced
            syncedTradeIdsRef.current.add(trade.id);

            console.log('[useTradingSync] Trade saved and stats updated:', currentStats);
          } catch (err) {
            console.error('[useTradingSync] Unexpected error:', err);
          }
        }
      })();
    }

    previousTradeCountRef.current = currentTradeCount;
  }, [tradeHistory, user, profile, balance, updateTradingBalance]);

  // 3. Subscribe to realtime trading_history updates
  useEffect(() => {
    if (!user) return;

    console.log('[useTradingSync] Subscribing to realtime trading_history...');

    const channel = supabase
      .channel('trading_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useTradingSync] Realtime update:', payload);
          // Future: Update local state based on external changes
        }
      )
      .subscribe();

    return () => {
      console.log('[useTradingSync] Unsubscribing from realtime...');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 🔧 FIX: Removed periodic balance sync (was causing excessive DB writes)
  // Balance is already synced when trades are closed (line 140)
  // If needed in the future, increase interval to 30+ seconds

  return {
    isSynced: !!user,
    tradingBalance: profile?.trading_balance || 0,
    totalTrades: profile?.total_trades || 0,
    winningTrades: profile?.winning_trades || 0,
    totalPnl: profile?.total_pnl || 0,
    winRate: profile?.total_trades > 0
      ? ((profile.winning_trades / profile.total_trades) * 100).toFixed(2)
      : '0.00',
  };
};
