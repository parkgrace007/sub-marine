import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import WhaleManager from '../physics/WhaleManager'
import WhaleTooltip from './WhaleTooltip'
import whaleSprites from '../utils/WhaleSprites'

// Performance optimization (2025-11-23): 30 FPS target for battery/performance
const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS // ~33.33ms per frame

const WhaleCanvas = forwardRef(({ sentiment, timeframe, symbol, whales = [], loading = false, containerRef, className, onStatsUpdate }, ref) => {
  const canvasRef = useRef(null)
  const managerRef = useRef(null)
  const animationRef = useRef(null)
  const fpsRef = useRef({ lastTime: 0, lastFrameTime: 0, frames: 0, fps: TARGET_FPS }) // 30 FPS target
  const syncedWhaleIdsRef = useRef(new Set())
  const spawnIntervalRef = useRef(null) // Track spawn interval for cleanup

  // Extract values from sentiment
  const bullRatio = sentiment?.bull_ratio || 0.5
  const rsiAverage = sentiment?.rsi_average || 50

  // Refs to track current values for animation loop (avoid cleanup on every change)
  const bullRatioRef = useRef(bullRatio)
  const rsiAverageRef = useRef(rsiAverage)
  const timeframeRef = useRef(timeframe)

  const [stats, setStats] = useState({ total: 0, inflow: 0, outflow: 0, fps: 60 })
  const [selectedWhale, setSelectedWhale] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [spritesLoaded, setSpritesLoaded] = useState(false)

  // Expose manager methods to parent
  useImperativeHandle(ref, () => ({
    handleClick: (x, y) => {
      const canvas = canvasRef.current
      if (!canvas || !managerRef.current) return

      const clickedWhale = managerRef.current.getWhaleAtPosition(x, y, canvas.width, canvas.height)

      if (clickedWhale) {
        // Mark whale as selected
        clickedWhale.isSelected = true
        setSelectedWhale(clickedWhale)
        setTooltipPosition({ x, y })
      }
    },
    spawnWhale: () => {
      const canvas = canvasRef.current
      if (canvas && managerRef.current) {
        managerRef.current.spawnDummyWhale(canvas.width, canvas.height, bullRatio, timeframe)
      }
    },
    spawnBatch: (count) => {
      const canvas = canvasRef.current
      if (canvas && managerRef.current) {
        managerRef.current.spawnBatch(count, canvas.width, canvas.height, bullRatio, timeframe)
      }
    },
    clearAll: () => {
      if (managerRef.current) {
        managerRef.current.clearAll()
        syncedWhaleIdsRef.current.clear()
      }
    },
    toggleDebug: () => {
      if (managerRef.current) {
        managerRef.current.toggleDebug()
      }
    },
    getStats: () => stats
  }))

  // Initialize WhaleManager
  useEffect(() => {
    managerRef.current = new WhaleManager()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Load whale sprites
  useEffect(() => {
    whaleSprites.load()
      .then(() => {
        console.log('✅ Whale sprites loaded in WhaleCanvas')
        setSpritesLoaded(true)
      })
      .catch((error) => {
        console.error('❌ Failed to load whale sprites in WhaleCanvas:', error)
      })
  }, [])

  // Sync refs when bullRatio changes
  useEffect(() => {
    bullRatioRef.current = bullRatio
  }, [bullRatio])

  // Sync refs when rsiAverage changes
  useEffect(() => {
    rsiAverageRef.current = rsiAverage
  }, [rsiAverage])

  // Sync refs when timeframe changes
  useEffect(() => {
    timeframeRef.current = timeframe
  }, [timeframe])

  // Update timeframe - Recalculate positions without clearing whales
  useEffect(() => {
    if (managerRef.current && canvasRef.current) {
      // Separate movement target (center) from RSI boundary
      const centerXRatio = 0.5 // Fixed center position - whales always move toward center
      const rsiBoundaryXRatio = 1.0 - (rsiAverage / 100) // RSI line acts as boundary

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Timeframe changed to ${timeframe} - Target: center (50%), RSI boundary: ${(rsiBoundaryXRatio * 100).toFixed(1)}%`)
      }
      managerRef.current.onTimeframeChange(timeframe, centerXRatio, rsiBoundaryXRatio)
    }
  }, [timeframe, rsiAverage])

  // Clear all whales when symbol changes (2025-11-23: symbol filter)
  useEffect(() => {
    if (managerRef.current) {
      const symbolLabel = symbol === '통합' ? 'ALL' : symbol
      console.log(`🔄 Symbol changed to ${symbolLabel} - Clearing all whales`)
      managerRef.current.clearAll()
      syncedWhaleIdsRef.current.clear()
    }
  }, [symbol])

  // Sync DB whales with canvas whales (Progressive Loading - 2025-11-22)
  useEffect(() => {
    if (!managerRef.current || !canvasRef.current || loading) return

    const canvas = canvasRef.current
    const manager = managerRef.current

    // Performance optimization: Spawn whales in batches for smooth loading
    const SPAWN_BATCH_SIZE = 20 // Spawn 20 whales per batch
    const SPAWN_INTERVAL_MS = 50 // 50ms between batches

    // Find new whales that haven't been spawned yet
    const newWhales = whales.filter(dbWhale => !syncedWhaleIdsRef.current.has(dbWhale.id))

    if (newWhales.length === 0) return

    // If only a few new whales (realtime updates), spawn immediately
    if (newWhales.length <= 5) {
      newWhales.forEach((dbWhale) => {
        const targetXRatio = 0.5 // Fixed center position
        manager.spawnFromEvent(dbWhale, canvas.width, canvas.height, targetXRatio, timeframe)
        syncedWhaleIdsRef.current.add(dbWhale.id)
        if (process.env.NODE_ENV === 'development') {
          console.log('🐋 Spawned whale (realtime):', dbWhale.id, `$${(dbWhale.amount_usd / 1e6).toFixed(2)}M`)
        }
      })
      return
    }

    // For bulk loading (initial page load or timeframe change), spawn in batches
    let spawnIndex = 0
    console.log(`📦 Progressive loading: ${newWhales.length} whales in batches of ${SPAWN_BATCH_SIZE}`)

    // Clear any existing interval before creating new one (memory leak fix)
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current)
      spawnIntervalRef.current = null
    }

    spawnIntervalRef.current = setInterval(() => {
      const batch = newWhales.slice(spawnIndex, spawnIndex + SPAWN_BATCH_SIZE)

      batch.forEach((dbWhale) => {
        const targetXRatio = 0.5 // Fixed center position
        manager.spawnFromEvent(dbWhale, canvas.width, canvas.height, targetXRatio, timeframe)
        syncedWhaleIdsRef.current.add(dbWhale.id)
      })

      spawnIndex += SPAWN_BATCH_SIZE

      if (spawnIndex >= newWhales.length) {
        clearInterval(spawnIntervalRef.current)
        spawnIntervalRef.current = null
        console.log(`✅ Progressive loading complete: ${newWhales.length} whales spawned`)
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📦 Batch progress: ${Math.min(spawnIndex, newWhales.length)}/${newWhales.length}`)
        }
      }
    }, SPAWN_INTERVAL_MS)

    // Cleanup interval on unmount or dependency change
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
        spawnIntervalRef.current = null
      }
    }
  }, [whales, loading, rsiAverage, timeframe])

  // Handle tooltip close
  const handleTooltipClose = () => {
    if (selectedWhale) {
      selectedWhale.isSelected = false
    }
    setSelectedWhale(null)
  }

  // Canvas setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const manager = managerRef.current

    // Set canvas size from container
    const resize = () => {
      const container = containerRef?.current
      if (container) {
        canvas.width = container.offsetWidth
        canvas.height = container.offsetHeight
      } else {
        // Fallback to canvas size
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop with 30 FPS cap (2025-11-23: battery/performance optimization)
    const animate = (currentTime) => {
      // Frame skip logic: only render if enough time has passed (30 FPS = ~33.33ms)
      const elapsed = currentTime - fpsRef.current.lastFrameTime
      if (elapsed < FRAME_INTERVAL) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Update last frame time
      fpsRef.current.lastFrameTime = currentTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Use refs to get current values (avoid dependency issues)
      const currentRsiAverage = rsiAverageRef.current
      const currentTimeframe = timeframeRef.current

      // Separate movement target (center) from RSI boundary
      const centerXRatio = 0.5 // Fixed center position - whales always move toward center
      const rsiBoundaryXRatio = 1.0 - (currentRsiAverage / 100) // RSI line acts as boundary

      manager.update(canvas.width, canvas.height, centerXRatio, rsiBoundaryXRatio, currentTimeframe)
      manager.draw(ctx, canvas.width, canvas.height)

      updateFPS(currentTime)

      if (currentTime % 500 < 16) {
        const newStats = {
          ...manager.getStats(),
          fps: Math.round(fpsRef.current.fps)
        }
        setStats(newStats)
        if (onStatsUpdate) {
          onStatsUpdate(newStats)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      // Clear whale manager to free memory (only on unmount)
      if (manager) {
        manager.clearAll()
      }
      // Clear synced IDs
      syncedWhaleIdsRef.current.clear()
      // Clear spawn interval if still running
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
        spawnIntervalRef.current = null
      }
      // Release canvas context completely (2025-11-23: memory leak fix)
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Force canvas resize to 0 to release memory
        canvas.width = 0
        canvas.height = 0
      }
    }
  }, []) // Empty dependency - only run on mount/unmount

  const updateFPS = (currentTime) => {
    const fps = fpsRef.current
    fps.frames++

    if (currentTime - fps.lastTime >= 1000) {
      fps.fps = fps.frames
      fps.frames = 0
      fps.lastTime = currentTime
    }
  }

  return (
    <>
      <div className={className || "relative w-full h-full pointer-events-none"}>
        {/* Canvas - Rendering only, all pointer events handled by parent */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Whale Tooltip - Outside pointer-events-none container */}
      {selectedWhale && (
        <WhaleTooltip
          whale={selectedWhale}
          position={tooltipPosition}
          onClose={handleTooltipClose}
        />
      )}
    </>
  )
})

WhaleCanvas.displayName = 'WhaleCanvas'

export default WhaleCanvas
