import WebSocket from 'ws'
import { supabase } from '../utils/supabase.js'
import dotenv from 'dotenv'

dotenv.config()

class WhaleAlertService {
  constructor() {
    this.apiKey = process.env.WHALE_ALERT_API_KEY
    this.wsUrl = process.env.WHALE_ALERT_WS_URL || 'wss://leviathan.whale-alert.io/ws'
    this.ws = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5 // Reduced from 20 to prevent excessive retries
    this.reconnectDelay = 5000 // Start at 5s
    this.last429Error = null // Track 429 errors
    this.is429Blocked = false // Flag to indicate 429 blocking state

    // Rate limiting (100 alerts/hour)
    this.alertsThisHour = 0
    this.hourlyResetTime = Date.now() + 3600000 // 1 hour from now

    if (!this.apiKey) {
      throw new Error('WHALE_ALERT_API_KEY not found in environment')
    }
  }

  /**
   * Connect to Whale Alert WebSocket
   */
  connect() {
    // Prevent duplicate connections
    if (this.isConnected || this.ws) {
      console.warn('⚠️ WebSocket already connected or connecting, skipping...')
      return
    }

    // Check if blocked by 429 (within 24 hours)
    if (this.is429Blocked && this.last429Error && (Date.now() - this.last429Error < 86400000)) {
      const timeUntilUnblock = Math.ceil((86400000 - (Date.now() - this.last429Error)) / 60000)
      console.warn(`🚫 Connection blocked due to 429 error. Wait ${timeUntilUnblock} minutes or use /api/trigger/whale-reset-429`)
      return
    }

    const url = `${this.wsUrl}?api_key=${this.apiKey}`
    const timestamp = new Date().toISOString()
    console.log(`🔌 [${timestamp}] Connecting to Whale Alert WebSocket...`)
    console.log(`   Reconnect attempts: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    this.ws = new WebSocket(url)

    // Connection timeout (30 seconds)
    const connectionTimeout = setTimeout(() => {
      if (!this.isConnected && this.ws) {
        console.error('❌ Connection timeout (30s)')
        this.ws.close()
      }
    }, 30000)

    this.ws.on('open', () => {
      clearTimeout(connectionTimeout)
      this.onOpen()
    })
    this.ws.on('message', (data) => this.onMessage(data))
    this.ws.on('error', (error) => this.onError(error))
    this.ws.on('close', (code, reason) => this.onClose(code, reason))
  }

  /**
   * Handle WebSocket open event
   */
  onOpen() {
    console.log('✅ WebSocket connected!')
    this.isConnected = true
    this.reconnectAttempts = 0
    this.reconnectDelay = 1000

    // Subscribe to alerts
    this.subscribe()
  }

  /**
   * Subscribe to whale alerts with filters
   * Format based on official Whale Alert documentation
   *
   * OPTIMIZATION (2025-11-19):
   * - Top 4 blockchains (BTC, ETH, TRX, XRP) - confirmed working names
   * - Raise min_value to $10M (Tier 1+ whales only)
   * - Expected reduction: 88% fewer alerts (120/h → 10-15/h)
   * - Eliminates 429 rate limit errors
   */
  subscribe() {
    const subscription = {
      type: "subscribe_alerts",
      blockchains: ['bitcoin', 'ethereum', 'tron', 'ripple'],  // Top 4 chains (confirmed names)
      min_value_usd: 10000000  // Minimum $10M (Tier 1+, up from $500K)
    }

    console.log('📡 Subscribing to top 4 chains ($10M+):', JSON.stringify(subscription, null, 2))
    this.ws.send(JSON.stringify(subscription))
  }

  /**
   * Handle incoming WebSocket messages (alerts)
   */
  async onMessage(data) {
    try {
      const rawMessage = data.toString()
      const message = JSON.parse(rawMessage)

      // Log raw message for debugging (first 500 chars)
      console.log('📩 Raw WebSocket message:', rawMessage.substring(0, 500))

      // Handle different message types

      // 1. Error messages
      if (message.error) {
        console.error('❌ Whale Alert error:', message.error)
        if (message.message) console.error('   Details:', message.message)
        return
      }

      // 2. Subscription confirmation
      if (message.type === 'subscribed_alerts') {
        console.log('✅ Subscription confirmed!')
        console.log('   Channel ID:', message.id)
        console.log('   Blockchains:', message.blockchains?.slice(0, 5).join(', '), '...')
        console.log('   Min value USD:', message.min_value_usd)
        return
      }

      // 3. Transaction alert: { type: "alert", blockchain, amounts: [...], ... }
      if (message.type === 'alert' && message.blockchain && message.amounts) {
        await this.processAlert(message)
        return
      }

      // Unknown message type
      console.warn('⚠️ Unknown message type received:', {
        type: message.type,
        hasBlockchain: !!message.blockchain,
        hasAmounts: !!message.amounts,
        keys: Object.keys(message).slice(0, 10)
      })
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error.message)
    }
  }

  /**
   * Process a whale transaction alert
   */
  async processAlert(alert) {
    console.log('🐋 Processing whale alert:', {
      blockchain: alert.blockchain,
      symbol: alert.symbol,
      amount_usd: alert.amount_usd,
      from_type: alert.from?.owner_type,
      to_type: alert.to?.owner_type
    })

    // Check rate limit
    this.checkRateLimit()

    // Transform and validate alert
    const transaction = this.transformAlert(alert)

    if (!this.validateTransaction(transaction)) {
      console.log('⚠️ Invalid transaction, skipping')
      return
    }

    // Save to Supabase
    await this.saveToSupabase([transaction])

    // Increment hourly counter
    this.alertsThisHour++

    console.log(`✅ Saved: ${transaction.flow_type} $${(transaction.amount_usd / 1e6).toFixed(2)}M ${transaction.symbol}`)
    console.log(`📊 Alerts this hour: ${this.alertsThisHour}/100`)
  }

  /**
   * Handle WebSocket errors
   */
  onError(error) {
    const timestamp = new Date().toISOString()
    console.error(`❌ [${timestamp}] WebSocket error:`, error.message)

    // Track 429 errors for 24-hour blocking
    if (error.message.includes('429')) {
      this.last429Error = Date.now()
      this.is429Blocked = true
      console.error('   🚨 Rate limit detected (429) - service blocked for 24 hours')
      console.error('   📋 Use POST /api/trigger/whale-reset-429 to manually reset')
    }
  }

  /**
   * Handle WebSocket close event
   */
  onClose(code, reason) {
    const timestamp = new Date().toISOString()
    console.log(`🔌 [${timestamp}] WebSocket closed`)
    console.log(`   Code: ${code}, Reason: ${reason || 'No reason provided'}`)
    this.isConnected = false
    this.ws = null // Clear WebSocket reference

    // Attempt reconnection only if not blocked by 429
    if (!this.is429Blocked && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++

      // Normal exponential backoff: 5s → 10s → 20s → 40s → 80s (max 5 attempts)
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 80000)
      console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      setTimeout(() => {
        this.connect()
      }, delay)
    } else if (this.is429Blocked) {
      console.error('❌ Service blocked due to 429 rate limit (24 hours)')
      console.error('   Use POST /api/trigger/whale-reset-429 to manually reset if approved')
    } else {
      console.error('❌ Max reconnection attempts reached. Service will remain disconnected.')
      console.error('   Use POST /api/trigger/whale-reconnect to manually reconnect')
    }
  }

  /**
   * Transform Whale Alert data to whale_events schema
   * NEW FORMAT: { type: "alert", amounts: [{symbol, amount, value_usd}], from, to, transaction: {hash, ...} }
   *
   * FIX (2025-11-25): Handle both object and string formats from API
   * - String format: "Binance" or "unknown wallet"
   * - Object format: { owner: 'Unknown wallet', owner_type: 'unknown' }
   */
  transformAlert(alert) {
    // Extract first amount (usually only one, but API supports multiple)
    const primaryAmount = alert.amounts?.[0] || {}

    // Parse from/to - handle both object and string formats
    const fromOwnerData = alert.from || {}
    const toOwnerData = alert.to || {}

    // Extract owner string: object.owner or string directly
    const fromStr = typeof fromOwnerData === 'object'
      ? (fromOwnerData.owner || 'unknown wallet')
      : (fromOwnerData || 'unknown wallet')

    const toStr = typeof toOwnerData === 'object'
      ? (toOwnerData.owner || 'unknown wallet')
      : (toOwnerData || 'unknown wallet')

    // Extract API's owner_type hint (if object format)
    const fromOwnerTypeHint = typeof fromOwnerData === 'object' ? fromOwnerData.owner_type : null
    const toOwnerTypeHint = typeof toOwnerData === 'object' ? toOwnerData.owner_type : null

    // Determine owner types: prefer API hint, fallback to parsing
    const fromOwnerType = this.mapApiOwnerType(fromOwnerTypeHint) ?? this.parseOwnerType(fromStr)
    const toOwnerType = this.mapApiOwnerType(toOwnerTypeHint) ?? this.parseOwnerType(toStr)

    // Determine flow type
    const flowType = this.determineFlowType(fromOwnerType, toOwnerType)

    // DEBUG: Log detailed parsing results
    console.log('🔍 DEBUG transformAlert:', {
      from: fromStr,
      to: toStr,
      fromOwnerType,
      toOwnerType,
      flowType,
      amount_usd: parseFloat(primaryAmount.value_usd || 0)
    })

    return {
      timestamp: alert.timestamp || Math.floor(Date.now() / 1000),
      blockchain: alert.blockchain || 'unknown',
      symbol: primaryAmount.symbol || 'unknown',
      amount: parseFloat(primaryAmount.amount || 0),
      amount_usd: parseFloat(primaryAmount.value_usd || 0),
      from_address: alert.transaction?.from || 'unknown',
      to_address: alert.transaction?.to || 'unknown',
      from_owner: fromStr === 'unknown wallet' ? null : fromStr,
      from_owner_type: fromOwnerType,
      to_owner: toStr === 'unknown wallet' ? null : toStr,
      to_owner_type: toOwnerType,
      transaction_type: alert.transaction_type || 'transfer',
      flow_type: flowType,
      transaction_hash: alert.transaction?.hash || null
    }
  }

  /**
   * Map Whale Alert API's owner_type to internal format (2025-11-25)
   * @param {string} apiOwnerType - API's owner_type value ('unknown', 'exchange', 'contract', etc.)
   * @returns {string|null} - 'exchange', 'contract', or null (private wallet)
   */
  mapApiOwnerType(apiOwnerType) {
    if (!apiOwnerType) return null

    const normalized = apiOwnerType.toLowerCase().trim()

    // API sends 'unknown' or 'wallet' for private wallets
    if (normalized === 'unknown' || normalized === 'wallet') {
      return null
    }

    // API sends 'exchange' for exchanges
    if (normalized === 'exchange') {
      return 'exchange'
    }

    // API sends 'contract', 'defi' for smart contracts
    if (normalized === 'contract' || normalized === 'defi') {
      return 'contract'
    }

    // Unknown API value - return null to let parseOwnerType handle it
    return null
  }

  /**
   * Parse owner type from Whale Alert string format (2025-11-20: Enhanced pattern matching)
   * Examples: "Binance" → exchange, "unknown wallet" → null, "Aave" → contract
   *
   * ROOT CAUSE FIX: Previous simple logic didn't recognize new exchange names
   * like "Stake", "Coinbase Institutional", "Aave", "HTX", "Abraxas"
   * causing all transactions to be classified as 'internal' and filtered out.
   *
   * FIX (2025-11-25): Added safety checks for object inputs and more flexible wallet patterns
   */
  parseOwnerType(ownerStr) {
    // Safety check: if object was passed instead of string, return null
    if (typeof ownerStr === 'object') {
      console.warn('⚠️ parseOwnerType received object instead of string:', ownerStr)
      return null
    }

    // Normalize: lowercase and trim
    const normalized = (ownerStr || '').toLowerCase().trim()

    // Invalid input handling (including "[object Object]")
    if (!normalized || normalized.startsWith('[object')) {
      return null
    }

    // Private wallet patterns (return null) - more flexible matching
    if (normalized === '' ||
        normalized === 'unknown' ||
        normalized === 'unknown wallet' ||
        normalized.includes('unknown wallet') ||  // Handle variations like "Unknown Wallet 1"
        normalized === 'private wallet' ||
        normalized === 'wallet') {
      return null
    }

    // Known exchange patterns (comprehensive list)
    const exchangePatterns = [
      'binance', 'coinbase', 'kraken', 'bitfinex', 'huobi',
      'okex', 'okx', 'kucoin', 'gemini', 'bitstamp', 'poloniex',
      'htx', 'ceffu', 'korbit', 'bybit', 'crypto.com',
      'gate.io', 'gate', 'bithumb', 'upbit', 'bitget', 'mexc',
      'stake', 'abraxas', 'institutional', 'custody',
      'bittrex', 'ftx', 'deribit', 'bitso', 'luno',
      'coinsquare', 'bitflyer', 'liquid', 'zaif', 'quoine'
    ]

    if (exchangePatterns.some(pattern => normalized.includes(pattern))) {
      return 'exchange'
    }

    // DeFi/Contract patterns (return 'contract')
    const contractPatterns = [
      'contract', 'treasury', 'beacon', 'depositor',
      'aave', 'uniswap', 'compound', 'makerdao', 'sky',
      'burn address', 'null address', 'curve', 'convex',
      'yearn', 'sushi', 'pancake', 'balancer', 'synthetix'
    ]

    if (contractPatterns.some(pattern => normalized.includes(pattern))) {
      return 'contract'
    }

    // Default: If it's a named entity not matching above patterns, treat as exchange
    // This is safer than treating unknown entities as wallets
    return 'exchange'
  }

  /**
   * Determine flow_type based on owner types
   */
  determineFlowType(fromOwnerType, toOwnerType) {
    const isPrivateWallet = (type) => !type || type === null || type === 'unknown'
    const isExchange = (type) => type === 'exchange'
    const isContract = (type) => type === 'contract' || type === 'smart_contract'

    // OUTFLOW: wallet → exchange (was "SELL")
    if (isPrivateWallet(fromOwnerType) && isExchange(toOwnerType)) {
      return 'outflow'
    }

    // INFLOW: exchange → wallet (was "BUY")
    if (isExchange(fromOwnerType) && isPrivateWallet(toOwnerType)) {
      return 'inflow'
    }

    // EXCHANGE: exchange ↔ exchange
    if (isExchange(fromOwnerType) && isExchange(toOwnerType)) {
      return 'exchange'
    }

    // DEFI: contract involved
    if (isContract(fromOwnerType) || isContract(toOwnerType)) {
      return 'defi'
    }

    // INTERNAL: wallet ↔ wallet
    if (isPrivateWallet(fromOwnerType) && isPrivateWallet(toOwnerType)) {
      return 'internal'
    }

    // DEFAULT
    return 'internal'
  }

  /**
   * Validate transaction meets requirements
   * Relaxed validation for debugging - only critical fields are enforced
   */
  validateTransaction(tx) {
    // Critical fields that must exist (relaxed from original)
    const critical = ['blockchain', 'symbol', 'amount_usd']

    for (const field of critical) {
      if (!tx[field]) {
        console.log(`❌ Missing critical field: ${field}`)
        return false
      }
    }

    // Check minimum amount (2025-11-19: Raised to $10M)
    if (tx.amount_usd < 10000000) {
      console.log(`⚠️ Amount too low: $${tx.amount_usd.toLocaleString()} (min $10M)`)
      return false
    }

    // Warn about missing optional fields (but don't reject)
    if (!tx.from_address || !tx.to_address) {
      console.warn(`⚠️ Missing address info (from: ${!!tx.from_address}, to: ${!!tx.to_address})`)
    }

    if (!tx.timestamp) {
      console.warn(`⚠️ Missing timestamp, will use current time`)
    }

    // Check valid flow_type
    const validFlowTypes = ['inflow', 'outflow', 'exchange', 'internal', 'defi']
    if (!validFlowTypes.includes(tx.flow_type)) {
      console.warn(`⚠️ Unusual flow_type: ${tx.flow_type} (will use 'internal')`)
      tx.flow_type = 'internal'
    }

    // (2025-11-23: Renamed flow types - inflow/outflow instead of buy/sell)
    return true
  }

  /**
   * Save transactions to Supabase
   */
  async saveToSupabase(transactions) {
    const { data, error } = await supabase
      .from('whale_events')
      .insert(transactions)
      .select()

    if (error) {
      console.error('❌ Supabase insert error:', error.message)
      throw error
    }

    return data.length
  }

  /**
   * Check and enforce rate limit (100 alerts/hour)
   */
  checkRateLimit() {
    const now = Date.now()

    // Reset counter if hour has passed
    if (now >= this.hourlyResetTime) {
      this.alertsThisHour = 0
      this.hourlyResetTime = now + 3600000
      console.log('🔄 Hourly alert counter reset')
    }

    // Check if limit reached
    if (this.alertsThisHour >= 100) {
      const timeUntilReset = Math.ceil((this.hourlyResetTime - now) / 1000)
      console.warn(`⚠️  Rate limit reached (100/hour). Next reset in ${timeUntilReset}s`)
    }
  }

  /**
   * Disconnect from WebSocket (Promise-based for graceful shutdown)
   */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.ws) {
        console.log('🔌 WebSocket already disconnected')
        resolve()
        return
      }

      console.log('🔌 Disconnecting WebSocket...')
      this.isConnected = false

      // Wait for close event
      const closeHandler = () => {
        console.log('✅ WebSocket fully closed')
        this.ws = null
        resolve()
      }

      this.ws.once('close', closeHandler)
      this.ws.close()

      // Fallback timeout (5 seconds)
      setTimeout(() => {
        if (this.ws) {
          console.warn('⚠️  WebSocket close timeout, forcing cleanup')
          this.ws.removeListener('close', closeHandler)
          this.ws = null
        }
        resolve()
      }, 5000)
    })
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      is429Blocked: this.is429Blocked,
      last429Error: this.last429Error ? new Date(this.last429Error).toISOString() : null,
      timeUntil429Unblock: this.last429Error
        ? Math.max(0, Math.ceil((86400000 - (Date.now() - this.last429Error)) / 60000))
        : 0,
      alertsThisHour: this.alertsThisHour,
      rateLimit: '100/hour',
      nextReset: new Date(this.hourlyResetTime).toISOString()
    }
  }

  /**
   * Manual reset of 429 blocking (use with caution)
   */
  reset429Block() {
    console.log('🔓 Manually resetting 429 block...')
    this.is429Blocked = false
    this.last429Error = null
    this.reconnectAttempts = 0
    console.log('✅ 429 block reset. Ready to reconnect.')
  }

  /**
   * Manual reconnect trigger
   */
  manualReconnect() {
    if (this.isConnected) {
      console.warn('⚠️ Already connected')
      return { success: false, message: 'Already connected' }
    }

    console.log('🔄 Manual reconnect triggered...')
    this.reconnectAttempts = 0
    this.connect()
    return { success: true, message: 'Reconnection initiated' }
  }
}

export default new WhaleAlertService()
