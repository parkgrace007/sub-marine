/**
 * useWhaleData hook - Re-export from WhaleDataContext
 *
 * This file maintains backwards compatibility with existing imports.
 * The actual implementation is now in WhaleDataContext.jsx which uses
 * a global Supabase Realtime connection that persists across page navigation.
 *
 * Architecture change (2025-11-25):
 * BEFORE: Each page had its own Backend SSE connection
 *         → Page navigation caused connection drops
 *
 * AFTER:  Single global Supabase Realtime connection in WhaleDataProvider
 *         → Page navigation maintains connection
 *         → useWhaleData just filters from global data
 */
export { useWhaleData, useWhaleContext } from '../contexts/WhaleDataContext'
