import axios from 'axios';
import { supabase } from '../utils/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * REST API Fallback for Whale Alert
 * Polls REST API every 2 minutes to catch transactions that WebSocket might miss
 */
class WhaleRestFallback {
  constructor() {
    this.apiKey = process.env.WHALE_ALERT_API_KEY;
    this.apiUrl = 'https://api.whale-alert.io/v1/transactions';
    this.isRunning = false;
    this.pollInterval = 2 * 60 * 1000; // 2 minutes
    this.lastFetchTimestamp = null;
    this.intervalId = null;

    if (!this.apiKey) {
      throw new Error('WHALE_ALERT_API_KEY not found');
    }
  }

  /**
   * Start polling REST API
   */
  start() {
    if (this.isRunning) {
      console.warn('⚠️ REST fallback already running');
      return;
    }

    console.log('🔄 Starting REST API fallback (polls every 2 minutes)...');
    this.isRunning = true;

    // Initial fetch
    this.fetchAndSave();

    // Poll every 2 minutes
    this.intervalId = setInterval(() => {
      this.fetchAndSave();
    }, this.pollInterval);
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️  REST fallback stopped');
  }

  /**
   * Fetch recent transactions and save to database
   */
  async fetchAndSave() {
    try {
      const now = Math.floor(Date.now() / 1000);

      // First run: fetch last 2 hours
      // Subsequent runs: fetch last 5 minutes (overlap with polling interval)
      const start = this.lastFetchTimestamp || (now - 7200); // 2 hours
      const end = now;

      console.log(`\n🔍 [REST Fallback] Fetching transactions from ${new Date(start * 1000).toLocaleTimeString()}...`);

      const response = await axios.get(this.apiUrl, {
        params: {
          api_key: this.apiKey,
          start: start,
          end: end,
          min_value: 10000000, // $10M minimum
          limit: 100
        },
        timeout: 15000
      });

      const transactions = response.data.transactions || [];
      console.log(`   Found ${transactions.length} transactions`);

      if (transactions.length === 0) {
        this.lastFetchTimestamp = end;
        return;
      }

      // Transform to whale_events format
      const transformedTransactions = transactions.map(tx => this.transformTransaction(tx));

      // Check for duplicates before inserting
      const newTransactions = await this.filterDuplicates(transformedTransactions);

      if (newTransactions.length === 0) {
        console.log('   ✅ All transactions already in database (no duplicates)');
        this.lastFetchTimestamp = end;
        return;
      }

      // Save to Supabase
      const { data, error } = await supabase
        .from('whale_events')
        .insert(newTransactions)
        .select();

      if (error) {
        console.error('❌ Error saving to database:', error.message);
        return;
      }

      console.log(`   ✅ Saved ${data.length} NEW transactions to database`);
      data.forEach((tx, i) => {
        console.log(`      ${i + 1}. ${tx.flow_type.toUpperCase()} - $${(tx.amount_usd / 1e6).toFixed(2)}M ${tx.symbol}`);
      });

      this.lastFetchTimestamp = end;

    } catch (error) {
      console.error('❌ [REST Fallback] Error:', error.response?.status, error.response?.data?.message || error.message);
    }
  }

  /**
   * Filter out transactions that already exist in database
   */
  async filterDuplicates(transactions) {
    const hashes = transactions.map(tx => tx.transaction_hash);

    // Query existing transactions
    const { data: existing } = await supabase
      .from('whale_events')
      .select('transaction_hash')
      .in('transaction_hash', hashes);

    const existingHashes = new Set(existing?.map(tx => tx.transaction_hash) || []);

    // Return only new transactions
    return transactions.filter(tx => !existingHashes.has(tx.transaction_hash));
  }

  /**
   * Transform REST API transaction to whale_events schema
   */
  transformTransaction(tx) {
    // Determine owner types
    const fromOwnerType = this.parseOwnerType(tx.from);
    const toOwnerType = this.parseOwnerType(tx.to);

    // Determine flow type
    const flowType = this.determineFlowType(fromOwnerType, toOwnerType);

    return {
      timestamp: tx.timestamp,
      blockchain: tx.blockchain,
      symbol: tx.symbol,
      amount: tx.amount,
      amount_usd: tx.amount_usd,
      from_address: tx.from?.address || 'unknown',
      to_address: tx.to?.address || 'unknown',
      from_owner: tx.from?.owner || null,
      to_owner: tx.to?.owner || null,
      from_owner_type: fromOwnerType,
      to_owner_type: toOwnerType,
      transaction_hash: tx.hash,
      flow_type: flowType,
      transaction_type: tx.transaction_type || 'transfer'
    };
  }

  /**
   * Parse owner type from address object
   */
  parseOwnerType(addressObj) {
    if (!addressObj || !addressObj.owner_type) return null;

    const type = addressObj.owner_type.toLowerCase();
    if (type === 'exchange' || type.includes('exchange')) return 'exchange';
    if (type === 'wallet') return 'wallet';
    return null; // Unknown or contract
  }

  /**
   * Determine flow type based on from/to owner types (2025-11-23: flow type terminology)
   */
  determineFlowType(fromType, toType) {
    if (fromType === 'exchange' && toType === 'wallet') return 'inflow';  // Exchange → Wallet (was 'buy')
    if (fromType === 'wallet' && toType === 'exchange') return 'outflow';  // Wallet → Exchange (was 'sell')
    if (fromType === 'exchange' && toType === 'exchange') return 'exchange';
    if (fromType === 'wallet' && toType === 'wallet') return 'internal';
    return 'internal'; // Default for unknown
  }
}

export default WhaleRestFallback;
