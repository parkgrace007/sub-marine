import Whale from './Whale'
import soundManager from '../utils/SoundManager'
import { TIMEFRAME_DURATIONS_MS, TIMEFRAME_DURATIONS_SECONDS } from '../config/timeframes'

class WhaleManager {
  constructor() {
    this.whales = []
    this.timeframe = '1h'
    this.debugMode = false

    // Performance monitoring
    this.performanceStats = {
      updateTime: 0,
      drawTime: 0,
      whaleCount: 0,
      visibleCount: 0,
      memoryWarning: false
    }
    this.lastPerformanceCheck = Date.now()

    // ===== FILTER CACHE (2025-11-23: Performance optimization for 30 FPS) =====
    // Cache frequently-used filter results to avoid repeated array iterations
    // Invalidated when whales are added, removed, or visibility changes
    this.filterCache = {
      // Cached arrays
      inflowWhales: [],
      outflowWhales: [],
      visibleWhales: [],
      visibleInflowWhales: [],
      visibleOutflowWhales: [],
      despawningWhales: [],

      // Dirty flags
      dirty: true  // Single flag: when true, rebuild all caches
    }
  }

  // ===== FILTER CACHE MANAGEMENT =====

  /**
   * Rebuild filter cache (2025-11-23: Performance optimization)
   * Called when cache is invalidated (whale added/removed, visibility changed)
   * Reduces 6+ filter operations per frame to simple array access
   */
  rebuildFilterCache() {
    // Only rebuild if dirty
    if (!this.filterCache.dirty) {
      return
    }

    // Split by type
    this.filterCache.inflowWhales = this.whales.filter((w) => w.type === 'inflow')
    this.filterCache.outflowWhales = this.whales.filter((w) => w.type === 'outflow')

    // Split by visibility
    this.filterCache.visibleWhales = this.whales.filter((w) => w.visible)
    this.filterCache.visibleInflowWhales = this.filterCache.inflowWhales.filter((w) => w.visible)
    this.filterCache.visibleOutflowWhales = this.filterCache.outflowWhales.filter((w) => w.visible)

    // Despawning whales
    this.filterCache.despawningWhales = this.whales.filter((w) => w.isDespawning)

    // Mark cache as clean
    this.filterCache.dirty = false
  }

  /**
   * Invalidate filter cache
   * Call this when whales are added, removed, or visibility changes
   */
  invalidateFilterCache() {
    this.filterCache.dirty = true
  }

  // ===== SPAWNING =====

  // Spawn whale from Supabase event data (2025-11-23: flow_type terminology)
  spawnFromEvent(event, canvasWidth, canvasHeight, targetXRatio, timeframe = '1h') {
    const type = event.flow_type // 'inflow' or 'outflow' (2025-11-23: renamed from buy/sell)
    const amountUSD = event.amount_usd

    // Calculate tier only (no size scaling)
    const { tier } = this.calculateWhaleSize(amountUSD)

    // Calculate target position (RSI line) - whales stop at RSI, never cross it
    const targetX = canvasWidth * targetXRatio

    // Spawn position at edges (REVERSED) - (2025-11-23: flow type terminology)
    // Inflow whales: spawn RIGHT, move LEFT (exchange → wallet)
    // Outflow whales: spawn LEFT, move RIGHT (wallet → exchange)
    // Constrain Y to safe zone (5% padding top/bottom - minimal edge protection)
    const safeZoneTop = canvasHeight * 0.05
    const safeZoneBottom = canvasHeight * 0.95
    const safeZoneHeight = safeZoneBottom - safeZoneTop

    // Spawn position with boundary padding to avoid immediate edge constraint
    // FIXED: Spawn whales outside of canvas boundary (size padding)
    // Maximum whale size is ~60px, reduced to 20px padding for closer spawn (2025-11-21)
    const edgePadding = 20  // pixels

    // === AGE-BASED INITIAL POSITION (2025-11-23: Optimization for page refresh) ===
    // Calculate whale's age to determine progress-based starting position
    // This prevents all whales from starting at edges after page refresh
    const spawnTimestamp = event.timestamp
    const age = spawnTimestamp ? (Date.now() / 1000 - spawnTimestamp) : 0  // Age in seconds
    const timeframeDuration = TIMEFRAME_DURATIONS_SECONDS[timeframe] || TIMEFRAME_DURATIONS_SECONDS['1h']
    const progress = Math.min(age / timeframeDuration, 1.0)  // 0.0 to 1.0

    // Calculate position based on progress
    const centerXRatio = 0.5  // Target position (center)
    const startXRatio = type === 'inflow' ? 1.0 : 0.0  // Starting edge (100% or 0%)
    const direction = type === 'inflow' ? -1 : 1  // Movement direction
    const totalDistanceRatio = Math.abs(centerXRatio - startXRatio)  // Always 0.5
    const traveledDistanceRatio = totalDistanceRatio * progress  // Distance traveled
    const currentXRatio = startXRatio + (direction * traveledDistanceRatio)  // Current position ratio

    // Convert ratio to pixels
    let x, y
    if (spawnTimestamp) {
      // DB whale: Use age-based position (prevents edge spawning on refresh)
      x = currentXRatio * canvasWidth
    } else {
      // New whale: Start at edge as before
      x = type === 'inflow' ? canvasWidth - edgePadding : edgePadding
    }
    y = safeZoneTop + Math.random() * safeZoneHeight

    // Create whale with current timeframe and original timestamp from DB
    // Size parameter removed - Whale constructor uses fixed size internally
    const whale = new Whale(x, y, null, type, timeframe, targetX, canvasWidth, canvasHeight, tier, event.timestamp)
    whale.metadata = {
      dbId: event.id,
      blockchain: event.blockchain,
      symbol: event.symbol,
      amount: event.amount,
      amountUSD: event.amount_usd,
      hash: event.transaction_hash,
      fromOwner: event.from_owner,
      toOwner: event.to_owner,
      fromOwnerType: event.from_owner_type,
      toOwnerType: event.to_owner_type
    }

    this.whales.push(whale)

    // Invalidate filter cache (whale added - 2025-11-23)
    this.invalidateFilterCache()

    // Play tier-based sound effect
    soundManager.play(tier)

    return whale
  }

  // ===== SIZE CALCULATION =====

  /**
   * Calculate whale size based on transaction amount (USD)
   * Returns size in pixels and tier (1-7) for sound/image selection
   *
   * 2025-11-19 Update: Custom tier system with round number boundaries
   * SubMarine's unique classification system for clear whale categorization
   *
   * @param {number} amountUSD - Transaction amount in USD
   * @returns {{tier: number}} - Tier (1-7) for image selection only (no size scaling)
   */
  calculateWhaleSize(amountUSD) {
    // Custom tier assignment with round number boundaries
    // SubMarine's unique 7-tier classification system
    // Tier determines which whale image to load (whale_tier1.png through whale_tier7.png)
    // All whales display at original PNG dimensions (no scaling)
    let tier
    if (amountUSD >= 1000000000) {
      tier = 7      // $1B+ (Legendary whales)
    } else if (amountUSD >= 500000000) {
      tier = 6      // $500M - $1B
    } else if (amountUSD >= 200000000) {
      tier = 5      // $200M - $500M
    } else if (amountUSD >= 100000000) {
      tier = 4      // $100M - $200M
    } else if (amountUSD >= 50000000) {
      tier = 3      // $50M - $100M
    } else if (amountUSD >= 20000000) {
      tier = 2      // $20M - $50M
    } else {
      tier = 1      // $10M - $20M (API minimum)
    }

    return { tier }  // Only return tier, no size calculation
  }

  // ===== UPDATE =====

  update(canvasWidth, canvasHeight, centerXRatio, rsiBoundaryXRatio, timeframe = '1h') {
    const startTime = performance.now()
    const now = Date.now()

    // Get timeframe duration from config
    const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']

    // centerXRatio: Fixed center (0.5) - whales' movement target
    // rsiBoundaryXRatio: RSI line position (1.0 - RSI/100) - acts as boundary

    // Update each whale's visibility and RSI boundary based on current viewing timeframe
    // This loop changes whale.visible, so invalidate cache afterward
    let visibilityChanged = false
    this.whales.forEach((whale) => {
      // Update RSI boundary (whales cannot cross this line)
      whale.updateRSIBoundary(rsiBoundaryXRatio)

      // Calculate age
      const age = now - whale.spawnTime

      // Check visibility: whale is visible if age is within VIEWING timeframe duration
      const newVisibility = age <= timeframeDuration
      if (whale.visible !== newVisibility) {
        whale.visible = newVisibility
        visibilityChanged = true
      }

      // DON'T recalculate position here - let the whale move naturally
      // Position is only recalculated when timeframe changes (see onTimeframeChange)
    })

    // Invalidate cache if visibility changed (2025-11-23: Performance optimization)
    if (visibilityChanged) {
      this.invalidateFilterCache()
    }

    // Rebuild cache if needed (2025-11-23: Performance optimization)
    this.rebuildFilterCache()

    // Use cached arrays instead of filtering every frame (2025-11-23)
    // Before: 6 filter operations per frame × 30 FPS × 500 whales = 90,000 iterations/sec
    // After: Simple array access (cached once per visibility change)
    const visibleInflowWhales = this.filterCache.visibleInflowWhales
    const visibleOutflowWhales = this.filterCache.visibleOutflowWhales

    visibleInflowWhales.forEach((whale) => {
      whale.update(visibleInflowWhales, canvasWidth, canvasHeight)
    })

    visibleOutflowWhales.forEach((whale) => {
      whale.update(visibleOutflowWhales, canvasWidth, canvasHeight)
    })

    // Start fade out for whales that reached their lifetime
    let despawnStateChanged = false
    this.whales.forEach((whale) => {
      if (whale.shouldStartDespawn() && !whale.isDespawning) {
        whale.startDespawn()
        despawnStateChanged = true
      }
    })

    // Update despawning whales (for fade out animation)
    // Use cached array (2025-11-23)
    if (despawnStateChanged) {
      this.invalidateFilterCache()
      this.rebuildFilterCache()
    }

    this.filterCache.despawningWhales.forEach((whale) => {
      whale.update([], canvasWidth, canvasHeight) // Update fade out only, no collision
    })

    // Remove whales that completed fade out animation
    const countBefore = this.whales.length
    this.whales = this.whales.filter((whale) => !whale.shouldDespawn())
    const countAfter = this.whales.length

    // Invalidate cache if whales were removed (2025-11-23)
    if (countBefore !== countAfter) {
      this.invalidateFilterCache()
    }

    // Update performance stats
    const endTime = performance.now()
    this.performanceStats.updateTime = endTime - startTime
    this.performanceStats.whaleCount = this.whales.length
    this.performanceStats.visibleCount = this.filterCache.visibleWhales.length  // Use cached count

    // Memory warning if too many whales
    this.performanceStats.memoryWarning = this.whales.length > 200

    // Log performance every 10 seconds in development
    if (process.env.NODE_ENV === 'development' && now - this.lastPerformanceCheck > 10000) {
      this.lastPerformanceCheck = now
      console.log('[WhaleManager] Performance:', {
        updateTime: `${this.performanceStats.updateTime.toFixed(2)}ms`,
        totalWhales: this.performanceStats.whaleCount,
        visibleWhales: this.performanceStats.visibleCount,
        memoryWarning: this.performanceStats.memoryWarning
      })
    }
  }

  // Called when viewing timeframe changes
  onTimeframeChange(newTimeframe, centerXRatio, rsiBoundaryXRatio) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WhaleManager] Timeframe changed to ${newTimeframe} - recalculating positions (center: ${(centerXRatio * 100).toFixed(1)}%, RSI boundary: ${(rsiBoundaryXRatio * 100).toFixed(1)}%)`)
    }

    // Recalculate positions for all whales based on new viewing timeframe
    this.whales.forEach((whale) => {
      whale.recalculatePosition(newTimeframe, centerXRatio, rsiBoundaryXRatio)
    })

    // Invalidate cache after timeframe change (2025-11-23)
    this.invalidateFilterCache()
  }

  // ===== RENDERING =====

  draw(ctx, canvasWidth, canvasHeight) {
    const startTime = performance.now()

    // Rebuild cache if needed
    this.rebuildFilterCache()

    // Only draw visible whales - use cached array (2025-11-23)
    this.filterCache.visibleWhales.forEach((whale) => {
      whale.draw(ctx, canvasWidth, canvasHeight)

      if (this.debugMode) {
        whale.drawDebug(ctx, canvasWidth, canvasHeight)
      }
    })

    // Update draw time
    this.performanceStats.drawTime = performance.now() - startTime
  }

  // ===== LIFECYCLE =====

  updateTimeframe(newTimeframe) {
    this.timeframe = newTimeframe

    // Note: Whale lifetime is IMMUTABLE after spawn (Rule 3)
    // Each whale's lifetime is determined by its CREATION timeframe, not viewing timeframe
    // Only visibility (whale.visible) is affected by viewing timeframe filter

    if (process.env.NODE_ENV === 'development') {
      console.log(`[WhaleManager] Timeframe changed to ${newTimeframe}`)
    }
  }

  clearAll() {
    this.whales = []
  }

  toggleDebug() {
    this.debugMode = !this.debugMode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WhaleManager] Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`)
    }
  }

  getStats() {
    // Rebuild cache if needed
    this.rebuildFilterCache()

    // Use cached arrays (2025-11-23: Performance optimization)
    const visibleWhales = this.filterCache.visibleWhales
    const inflow = this.filterCache.visibleInflowWhales
    const outflow = this.filterCache.visibleOutflowWhales

    return {
      total: visibleWhales.length,
      inflow: inflow.length,
      outflow: outflow.length,
      avgSize:
        visibleWhales.reduce((sum, w) => sum + w.size, 0) / visibleWhales.length || 0,
      // Include performance stats
      performance: {
        updateTime: this.performanceStats.updateTime,
        drawTime: this.performanceStats.drawTime,
        totalWhales: this.performanceStats.whaleCount,
        memoryWarning: this.performanceStats.memoryWarning
      }
    }
  }

  // Find whale at click position (x, y)
  getWhaleAtPosition(x, y, canvasWidth, canvasHeight) {
    // Rebuild cache if needed
    this.rebuildFilterCache()

    // Search from top to bottom (last drawn = on top)
    // Use cached visible whales array (2025-11-23)
    const visibleWhales = this.filterCache.visibleWhales

    for (let i = visibleWhales.length - 1; i >= 0; i--) {
      if (visibleWhales[i].containsPoint(x, y, canvasWidth, canvasHeight)) {
        return visibleWhales[i]
      }
    }

    return null
  }
}

export default WhaleManager
