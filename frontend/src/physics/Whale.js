/**
 * ===== WHALE PHYSICS CONSTANTS =====
 * All constants extracted for easy tuning and maintainability
 */

import { TIMEFRAME_DURATIONS_SECONDS, TIMEFRAME_DURATIONS_MS } from '../config/timeframes'
import whaleSprites from '../utils/WhaleSprites'

/**
 * Timeframe durations in seconds
 * Used for calculating whale speed and visibility windows
 */
const TIMEFRAME_SECONDS = TIMEFRAME_DURATIONS_SECONDS

/**
 * Physics simulation parameters
 * - MASS_DIVISOR: Converts whale size to mass (larger = heavier = less affected by collisions)
 * - MAX_FORCE: Maximum steering force for collision avoidance
 * - PERCEPTION_RADIUS_MULTIPLIER: How far whales detect other whales (multiplier of size)
 * - TARGET_FPS: Expected frame rate for velocity calculations
 * - SPEED_MULTIPLIER: Global speed multiplier (2.0 = 2x faster movement)
 */
const PHYSICS_CONSTANTS = {
  MASS_DIVISOR: 10,
  MAX_FORCE: 0.03,
  PERCEPTION_RADIUS_MULTIPLIER: 3,
  TARGET_FPS: 60,
  SPEED_MULTIPLIER: 2.0 // Whales move 2x faster than original design
}

/**
 * Safe zone boundaries (as ratios of canvas height)
 * Minimal padding to prevent whales from escaping canvas edges
 */
const SAFE_ZONE = {
  TOP_RATIO: 0.02,      // 2% from top (minimal edge protection)
  BOTTOM_RATIO: 0.98    // 98% from top (2% from bottom)
}

/**
 * Lifecycle timing constants
 * - FADE_OUT_DURATION_MS: Smooth fade-out animation duration
 * - TRANSITION_DURATION_MS: Position interpolation duration when filter changes
 * Note: Whale lifetime is now determined by creation timeframe (1h whale = 1h lifetime, 4h whale = 4h lifetime)
 */
const LIFECYCLE_CONSTANTS = {
  FADE_OUT_DURATION_MS: 1000,       // 1 second fade-out
  TRANSITION_DURATION_MS: 300       // 0.3 second position transition
}

/**
 * Collision and movement behavior constants
 * - BOUNCE_BASE/SCALE/MAX/MIN: Control bounce physics when hitting center line
 * - DIRECTION_RESTORE_RATE: Speed of returning to correct direction after bounce
 * - SPEED_TOLERANCE: Acceptable speed variance before correction
 * - VERTICAL_DAMPING: Reduces vertical velocity each frame
 * - VERTICAL_BOUNCE_DAMPING: Energy loss when bouncing off top/bottom
 */
const COLLISION_CONSTANTS = {
  BOUNCE_BASE: 0.4,
  BOUNCE_IMPACT_SCALE: 0.3,
  BOUNCE_MAX: 0.8,
  BOUNCE_MIN: 0.4,
  DIRECTION_RESTORE_RATE: 0.05,
  SPEED_TOLERANCE_LOW: 0.8,
  SPEED_TOLERANCE_HIGH: 1.2,
  VERTICAL_DAMPING: 0.95,
  VERTICAL_BOUNCE_DAMPING: 0.5
}

/**
 * Rendering parameters
 * - GLOW_BLUR_RADIUS: Selection glow effect blur radius
 * - SELECTION_STROKE_WIDTH: Border width when whale is selected
 *
 * Note: No IMAGE_SCALE - whales display at original PNG size
 */
const RENDER_CONSTANTS = {
  GLOW_BLUR_RADIUS: 12,
  SELECTION_STROKE_WIDTH: 2
}

/**
 * Whale Class - Represents a single whale transaction with physics simulation
 *
 * Key Features:
 * - Ratio-based positioning for perfect browser resize support
 * - Age-based position calculation for accurate filter switching
 * - Physics simulation with collision detection and avoidance
 * - Smooth transitions and animations
 *
 * @param {number} x - Starting X position in pixels
 * @param {number} y - Starting Y position in pixels
 * @param {number|null} size - DEPRECATED - Unused, kept for API compatibility (all whales use fixed size 30)
 * @param {string} type - 'inflow' or 'outflow'
 * @param {string} timeframe - Whale's creation timeframe ('1h', '4h', '8h', '12h', '1d')
 * @param {number} targetX - Target X position in pixels (center line)
 * @param {number} canvasWidth - Canvas width for ratio calculation
 * @param {number} canvasHeight - Canvas height for ratio calculation
 * @param {number} tier - Whale tier (1-7) for size category and sprite
 */
class Whale {
  constructor(x, y, size, type, timeframe = '1h', targetX, canvasWidth, canvasHeight, tier = 0, spawnTimestamp = null) {
    // ===== RATIO-BASED POSITIONING SYSTEM =====
    // All positions stored as ratios (0.0 to 1.0) for perfect browser resize support
    // Converted to pixels only during rendering/physics calculations

    this.positionRatio = {
      x: x / canvasWidth,
      y: y / canvasHeight
    }

    this.type = type // 'inflow' or 'outflow'

    // Tier-based size calculation (SubMarine custom tier system)
    this.tier = tier
    const tierSizes = {
      1: 12,  // $10M-$20M
      2: 20,  // $20M-$50M
      3: 30,  // $50M-$100M
      4: 40,  // $100M-$200M
      5: 48,  // $200M-$500M
      6: 55,  // $500M-$1B
      7: 60   // $1B+
    }
    this.size = tierSizes[tier] || 30  // Default 30 if tier not found
    this.color = this.type === 'inflow' ? '#52AF7CCC' : '#D3484ECC' // Inflow: green, Outflow: red

    // Mass based on size (larger whales = heavier = less affected by collisions)
    this.mass = this.size / PHYSICS_CONSTANTS.MASS_DIVISOR

    // Store timeframe for dynamic position calculation
    this.timeframe = timeframe
    this.startXRatio = x / canvasWidth // Starting position ratio
    this.targetXRatio = targetX / canvasWidth // Target position ratio

    // Calculate velocity as ratio per frame (percentage of canvas width per frame)
    const distanceRatio = Math.abs(this.targetXRatio - this.startXRatio)
    const timeToReach = TIMEFRAME_SECONDS[timeframe] || TIMEFRAME_SECONDS['1min']
    const baseSpeedRatio = (distanceRatio / (timeToReach * PHYSICS_CONSTANTS.TARGET_FPS)) * PHYSICS_CONSTANTS.SPEED_MULTIPLIER

    // Set constant velocity (direction fixed) - stored as RATIO (REVERSED)
    // Inflow whales: spawn RIGHT (x=1.0), move LEFT (direction=-1)
    // Outflow whales: spawn LEFT (x=0.0), move RIGHT (direction=+1)
    const direction = type === 'inflow' ? -1 : 1
    this.constantSpeedRatio = baseSpeedRatio
    this.velocityRatio = {
      x: direction * baseSpeedRatio,
      y: 0
    }
    this.accelerationRatio = { x: 0, y: 0 }

    // Physics Parameters
    this.maxForce = PHYSICS_CONSTANTS.MAX_FORCE
    this.perceptionRadiusMultiplier = PHYSICS_CONSTANTS.PERCEPTION_RADIUS_MULTIPLIER

    // Lifecycle - Lifetime determined by whale's CREATION timeframe (Rule 3)
    // 1h whale lives for 1 hour, 4h whale for 4 hours, etc.
    // If spawnTimestamp provided (from DB), use it; otherwise use current time
    // Convert Unix seconds (DB format) to milliseconds (JS Date format)
    this.spawnTime = spawnTimestamp ? spawnTimestamp * 1000 : Date.now()
    this.lifetime = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
    this.visible = true

    // Spawn effect (birth animation)
    // Only show birth animation for truly new whales (not loaded from DB on page refresh)
    this.isSpawning = !spawnTimestamp  // Skip birth if whale loaded from database
    this.spawnStartTime = Date.now()
    this.spawnDuration = 500  // 0.5초 동안 spawn 애니메이션
    this.spawnFrameIndex = 0
    this.spawnFrameTimer = 0

    // Fade out effect (death animation)
    this.opacity = 1.0
    this.isDespawning = false
    this.despawnStartTime = null
    this.fadeOutDuration = LIFECYCLE_CONSTANTS.FADE_OUT_DURATION_MS
    this.deathFrameIndex = 0
    this.deathFrameTimer = 0

    // Smooth transition for filter changes
    this.transitionTarget = null
    this.transitionStartTime = null
    this.transitionDuration = LIFECYCLE_CONSTANTS.TRANSITION_DURATION_MS

    // Selection state
    this.isSelected = false

    // Arrival state - prevents crossing center line in long timeframes
    this.hasArrived = false

    // Edge stuck detection and recovery
    this.edgeStuckFrames = 0  // Counter for frames spent at edge

    // RSI boundary tracking (separate from movement target)
    // Movement target: this.targetXRatio (always 0.5 - center)
    // RSI boundary: this.rsiBoundaryXRatio (dynamic - acts as wall)
    this.rsiBoundaryXRatio = this.targetXRatio // Initialize with same value
    this.previousRSIBoundaryXRatio = this.rsiBoundaryXRatio

    // ===== SPRITE ANIMATION =====
    // Frame animation for sprite sheet rendering
    this.frameIndex = 0  // Current frame (0-based)
    this.frameTimer = 0  // Accumulated time for frame updates
    const spriteMetadata = whaleSprites.getMetadata(tier)
    this.frameCount = spriteMetadata.frames  // Total frames for this tier
    this.animationSpeed = 0.25  // Frames to advance per update (0.25 = ~7.5 FPS at 30 FPS)

    // ===== SPRITE DIMENSION CACHING (2025-11-23: Performance optimization) =====
    // Pre-calculate sprite dimensions to avoid repeated division in draw()
    // These values are constant for each whale and tier, so calculate once in constructor
    // Expected performance gain: 15-20% reduction in draw() execution time at 30 FPS
    this.cachedSprite = null
    this.cachedBirth = null
    this.cachedDeath = null

    // Only cache if sprites are already loaded (async load)
    // If not loaded yet, draw() will skip rendering anyway
    if (whaleSprites.isLoaded()) {
      // Main sprite dimensions
      const spriteImage = whaleSprites.getImage(this.tier)
      const metadata = whaleSprites.getMetadata(this.tier)
      const frameWidth = spriteImage.width / metadata.columns
      const frameHeight = spriteImage.height / metadata.rows
      const aspectRatio = frameWidth / frameHeight
      const destWidth = this.size * 2
      const destHeight = destWidth / aspectRatio

      this.cachedSprite = {
        frameWidth,
        frameHeight,
        aspectRatio,
        destWidth,
        destHeight
      }

      // Birth effect dimensions
      const birthImage = whaleSprites.getEffectImage('birth')
      const birthMetadata = whaleSprites.getEffectMetadata('birth')
      const birthFrameWidth = birthImage.width / birthMetadata.columns
      const birthFrameHeight = birthImage.height / birthMetadata.rows
      const birthAspectRatio = birthFrameWidth / birthFrameHeight
      const birthDestWidth = this.size * 2.5  // Slightly larger than whale
      const birthDestHeight = birthDestWidth / birthAspectRatio

      this.cachedBirth = {
        frameWidth: birthFrameWidth,
        frameHeight: birthFrameHeight,
        aspectRatio: birthAspectRatio,
        destWidth: birthDestWidth,
        destHeight: birthDestHeight
      }

      // Death effect dimensions
      const deathImage = whaleSprites.getEffectImage('die')
      const deathMetadata = whaleSprites.getEffectMetadata('die')
      const deathFrameWidth = deathImage.width / deathMetadata.columns
      const deathFrameHeight = deathImage.height / deathMetadata.rows
      const deathAspectRatio = deathFrameWidth / deathFrameHeight
      const deathDestWidth = this.size * 2.5  // Slightly larger than whale
      const deathDestHeight = deathDestWidth / deathAspectRatio

      this.cachedDeath = {
        frameWidth: deathFrameWidth,
        frameHeight: deathFrameHeight,
        aspectRatio: deathAspectRatio,
        destWidth: deathDestWidth,
        destHeight: deathDestHeight
      }
    }
  }

  // ===== RATIO-TO-PIXEL CONVERSION =====
  // These methods convert stored ratios (0.0-1.0) to actual pixel positions
  // This ensures whales maintain correct positions when browser is resized

  /**
   * Get whale's current position in pixels
   * @returns {{ x: number, y: number }} Position in pixels
   */
  getPixelPosition(canvasWidth, canvasHeight) {
    return {
      x: this.positionRatio.x * canvasWidth,
      y: this.positionRatio.y * canvasHeight
    }
  }

  /**
   * Get whale's target X position (center line) in pixels
   */
  getPixelTargetX(canvasWidth) {
    return this.targetXRatio * canvasWidth
  }

  /**
   * Get whale's starting X position in pixels
   */
  getPixelStartX(canvasWidth) {
    return this.startXRatio * canvasWidth
  }

  /**
   * Calculate perception radius for collision detection
   * Scales with canvas width to maintain consistent behavior
   */
  getPerceptionRadius(canvasWidth) {
    return (this.size / canvasWidth) * this.perceptionRadiusMultiplier * canvasWidth
  }

  // ===== COLLISION PHYSICS =====

  separate(whales, canvasWidth, canvasHeight) {
    let steer = { x: 0, y: 0 }
    let total = 0

    const myPos = this.getPixelPosition(canvasWidth, canvasHeight)
    const perceptionRadius = this.getPerceptionRadius(canvasWidth)

    for (let other of whales) {
      if (other === this) continue

      const otherPos = other.getPixelPosition(canvasWidth, canvasHeight)
      const distance = this.distance(myPos, otherPos)

      if (distance > 0 && distance < perceptionRadius) {
        let diff = {
          x: myPos.x - otherPos.x,
          y: myPos.y - otherPos.y
        }

        // Inverse square law for repulsion
        diff.x /= (distance * distance)
        diff.y /= (distance * distance)

        steer.x += diff.x
        steer.y += diff.y
        total++
      }
    }

    if (total > 0) {
      steer.x /= total
      steer.y /= total

      const mag = Math.sqrt(steer.x * steer.x + steer.y * steer.y)
      if (mag > 0) {
        const constantSpeed = this.constantSpeedRatio * canvasWidth
        steer.x = (steer.x / mag) * constantSpeed
        steer.y = (steer.y / mag) * constantSpeed

        const velocityPixel = {
          x: this.velocityRatio.x * canvasWidth,
          y: this.velocityRatio.y * canvasHeight
        }

        steer.x -= velocityPixel.x
        steer.y -= velocityPixel.y

        const limited = this.limit(steer, this.maxForce)

        // Convert back to ratio
        return {
          x: limited.x / canvasWidth,
          y: limited.y / canvasHeight
        }
      }
    }

    return { x: 0, y: 0 }
  }

  /**
   * Seek behavior - Steer toward target position (RSI center line)
   * Creates force that pulls whale toward its goal
   * @param {number} targetX - Target X position in pixels
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @returns {object} Force vector as ratio {x, y}
   */
  seek(targetX, canvasWidth, canvasHeight) {
    const myPos = this.getPixelPosition(canvasWidth, canvasHeight)

    // Desired velocity: direction from current to target at constant speed
    const desired = {
      x: targetX - myPos.x,
      y: 0  // No vertical seek (keep current Y movement)
    }

    const distance = Math.abs(desired.x)

    // Only apply seek force if not already at target
    if (distance > this.size) {
      // Normalize and scale to constant speed
      desired.x = (desired.x / distance) * (this.constantSpeedRatio * canvasWidth)

      const velocityPixel = {
        x: this.velocityRatio.x * canvasWidth,
        y: this.velocityRatio.y * canvasHeight
      }

      // Steering = desired - velocity
      const steer = {
        x: desired.x - velocityPixel.x,
        y: desired.y - velocityPixel.y
      }

      const limited = this.limit(steer, this.maxForce)

      // Convert back to ratio
      return {
        x: limited.x / canvasWidth,
        y: limited.y / canvasHeight
      }
    }

    return { x: 0, y: 0 }
  }

  // ===== POSITION CALCULATION =====

  /**
   * Recalculates whale position when viewing timeframe changes
   *
   * This is the CORE LOGIC that makes filter switching work correctly:
   * - Uses whale's actual age (time since spawn) to calculate true position
   * - Progress = age / newTimeframeDuration determines how far whale should be
   * - Position is recalculated from scratch, not accumulated
   * - Smooth transition animation prevents jarring jumps
   *
   * Example: If whale is 30s old and we switch from 1min to 1hour:
   * - In 1min view: progress = 30/60 = 50% → halfway to center
   * - In 1hour view: progress = 30/3600 = 0.83% → just starting
   *
   * @param {string} newViewingTimeframe - The new filter timeframe
   * @param {number} centerXRatio - Center position (always 0.5)
   * @param {number} rsiBoundaryXRatio - RSI boundary position (dynamic)
   */
  recalculatePosition(newViewingTimeframe, centerXRatio, rsiBoundaryXRatio) {
    // 1. Calculate whale's actual age (in seconds since spawn)
    const age = (Date.now() - this.spawnTime) / 1000

    // 2. Get new timeframe duration in seconds
    const timeframeDuration = TIMEFRAME_SECONDS[newViewingTimeframe] || TIMEFRAME_SECONDS['1min']

    // 3. Calculate progress ratio (0.0 = just spawned, 1.0 = reached target)
    const progress = Math.min(age / timeframeDuration, 1.0)

    // 4. Update movement target (center, always 0.5) and RSI boundary
    this.targetXRatio = centerXRatio
    this.rsiBoundaryXRatio = rsiBoundaryXRatio

    // 5. Calculate new position based on actual age and progress (REVERSED)
    // Whale moves toward CENTER, not RSI boundary
    const direction = this.type === 'inflow' ? -1 : 1
    const totalDistanceRatio = Math.abs(centerXRatio - this.startXRatio)
    const traveledDistanceRatio = totalDistanceRatio * progress

    // 6. Smooth transition: interpolate to new position over 0.3 seconds
    // This prevents jarring jumps when switching filters
    const targetXRatio = this.startXRatio + (direction * traveledDistanceRatio)

    // Set transition target for smooth interpolation in update()
    // Only create transition if whale hasn't arrived yet
    if (progress < 1.0) {
      this.transitionTarget = { x: targetXRatio }
      this.transitionStartTime = Date.now()
      this.transitionDuration = 300 // 0.3 seconds
    } else {
      // Whale has arrived - check if RSI boundary is pushing into it
      const previousRSIBoundary = this.previousRSIBoundaryXRatio
      const rsiBoundaryMoved = previousRSIBoundary !== rsiBoundaryXRatio

      if (rsiBoundaryMoved) {
        // RSI boundary has moved - check if it's pushing into this whale
        const rsiMovingTowardWhale = this.type === 'inflow'
          ? rsiBoundaryXRatio < previousRSIBoundary  // RSI moving left into buy whales
          : rsiBoundaryXRatio > previousRSIBoundary  // RSI moving right into sell whales

        if (rsiMovingTowardWhale) {
          // RSI boundary is pushing - apply push-back force
          const pushDirection = this.type === 'inflow' ? 1 : -1  // Buy pushed right, Sell pushed left
          const pushStrength = Math.abs(rsiBoundaryXRatio - previousRSIBoundary) * 2.0  // Amplify push effect
          this.velocityRatio.x = pushDirection * pushStrength * 10  // Strong push-back
        }
      }

      // No position forcing - let physics handle it
      this.transitionTarget = null
      this.transitionStartTime = null
    }

    // Store current RSI boundary for next frame comparison
    this.previousRSIBoundaryXRatio = rsiBoundaryXRatio

    // 7. Recalculate velocity for new timeframe
    // Speed adjusts so whale reaches CENTER in remaining time
    const remainingDistanceRatio = Math.abs(centerXRatio - this.positionRatio.x)
    const remainingTime = Math.max(timeframeDuration - age, 1)
    this.constantSpeedRatio = (remainingDistanceRatio / (remainingTime * PHYSICS_CONSTANTS.TARGET_FPS)) * PHYSICS_CONSTANTS.SPEED_MULTIPLIER
    this.velocityRatio.x = direction * this.constantSpeedRatio

    // 8. Reset arrival state - whale may not have arrived in new timeframe
    // Check if whale should be marked as arrived based on new progress
    if (progress >= 1.0) {
      this.hasArrived = true
      // Keep velocity for bounce physics - don't zero it
    } else {
      this.hasArrived = false
    }

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Whale] Recalculated: age=${age.toFixed(1)}s, progress=${(progress * 100).toFixed(1)}%, pos=${(this.positionRatio.x * 100).toFixed(1)}%, arrived=${this.hasArrived}`)
    }
  }

  // ===== UPDATE =====
  /**
   * Main update loop - called every frame
   * Handles physics simulation, collision detection, and smooth animations
   *
   * Update order is important:
   * 1. Fade out animation (if despawning)
   * 2. Position transition (if filter changed)
   * 3. Collision detection and avoidance
   * 4. Velocity updates
   * 5. Position updates
   * 6. Boundary constraints
   */
  update(whales, canvasWidth, canvasHeight) {
    // Update spawn animation (birth effect)
    if (this.isSpawning) {
      const elapsed = Date.now() - this.spawnStartTime

      // Advance spawn animation frames (6 frames total, ~12 FPS)
      this.spawnFrameTimer += 0.2  // Frame advancement speed
      if (this.spawnFrameTimer >= 1) {
        this.spawnFrameIndex++
        this.spawnFrameTimer = 0
      }

      // End spawn animation after duration
      if (elapsed >= this.spawnDuration) {
        this.isSpawning = false
      }
    }

    // Update fade out effect if despawning (early return - no physics)
    if (this.isDespawning) {
      const elapsed = Date.now() - this.despawnStartTime
      const progress = Math.min(elapsed / this.fadeOutDuration, 1.0)
      this.opacity = 1.0 - progress

      // Advance death animation frames (6 frames total, ~12 FPS)
      this.deathFrameTimer += 0.2  // Frame advancement speed
      if (this.deathFrameTimer >= 1) {
        this.deathFrameIndex++
        this.deathFrameTimer = 0
      }

      return
    }

    // Apply smooth transition interpolation if active (from filter change)
    // Uses easeOutCubic for natural-feeling movement
    if (this.transitionTarget && this.transitionStartTime) {
      const elapsed = Date.now() - this.transitionStartTime
      const progress = Math.min(elapsed / this.transitionDuration, 1.0)

      if (progress < 1.0) {
        // Lerp (linear interpolation) with cubic easing
        // Changed from 0.2 to 1.0 to complete transition in specified duration
        const eased = this.easeOutCubic(progress)
        this.positionRatio.x = this.positionRatio.x + (this.transitionTarget.x - this.positionRatio.x) * eased * 1.0
      } else {
        // Transition complete - clear transition state and switch to velocity mode
        this.transitionTarget = null
        this.transitionStartTime = null
      }
    }

    // Get pixel positions for collision detection
    const myPos = this.getPixelPosition(canvasWidth, canvasHeight)
    const centerX = this.getPixelTargetX(canvasWidth) // Movement target (center, 0.5)
    const rsiBoundaryX = this.rsiBoundaryXRatio * canvasWidth // RSI line (dynamic boundary)

    // Apply separation force (collision bounce with other whales)
    const separation = this.separate(whales, canvasWidth, canvasHeight)
    this.applyForce(separation, 1.0)

    // Apply seek force (pull toward RSI center line)
    // FIXED: Added seek behavior to prevent deadlock - pulls whales toward target
    const seek = this.seek(centerX, canvasWidth, canvasHeight)
    this.applyForce(seek, 0.8)  // Strong force (80%) - helps recovery in slow timeframes (1d)

    // Update velocity with acceleration
    this.velocityRatio.x += this.accelerationRatio.x
    this.velocityRatio.y += this.accelerationRatio.y

    // Movement direction
    const direction = this.type === 'inflow' ? -1 : 1

    // Not yet arrived - maintain constant speed toward center
    if (!this.hasArrived) {
      const currentDirection = Math.sign(this.velocityRatio.x)

      if (currentDirection === direction) {
        // Moving in correct direction - maintain constant speed
        const currentSpeedRatio = Math.abs(this.velocityRatio.x)

        if (currentSpeedRatio < this.constantSpeedRatio * COLLISION_CONSTANTS.SPEED_TOLERANCE_LOW) {
          this.velocityRatio.x = direction * this.constantSpeedRatio
        } else if (currentSpeedRatio > this.constantSpeedRatio * COLLISION_CONSTANTS.SPEED_TOLERANCE_HIGH) {
          this.velocityRatio.x = direction * this.constantSpeedRatio
        }
      }
    }

    // Dampen vertical movement
    this.velocityRatio.y *= COLLISION_CONSTANTS.VERTICAL_DAMPING

    // ===== RSI BOUNDARY ENFORCEMENT (simple wall - no bounce effects) =====
    // Update position first
    this.positionRatio.x += this.velocityRatio.x
    this.positionRatio.y += this.velocityRatio.y

    // Calculate RSI boundary position
    const boundaryPosRatio = this.type === 'inflow'
      ? (rsiBoundaryX + this.size) / canvasWidth  // Inflow whale: RSI 오른쪽에 멈춤
      : (rsiBoundaryX - this.size) / canvasWidth  // Outflow whale: RSI 왼쪽에 멈춤

    // Check if whale crossed RSI boundary
    const crossedBoundary = this.type === 'inflow'
      ? this.positionRatio.x < boundaryPosRatio  // Inflow whale crossed left boundary
      : this.positionRatio.x > boundaryPosRatio  // Outflow whale crossed right boundary

    if (crossedBoundary) {
      // Clamp position to boundary (simple wall)
      this.positionRatio.x = boundaryPosRatio

      // Block velocity toward boundary, allow velocity away from boundary
      const isMovingTowardBoundary = this.type === 'inflow'
        ? this.velocityRatio.x < 0  // Inflow whale moving left (toward boundary)
        : this.velocityRatio.x > 0  // Outflow whale moving right (toward boundary)

      if (isMovingTowardBoundary) {
        this.velocityRatio.x = 0  // Stop movement toward boundary
      }
      // velocityRatio.x > 0 for inflow (moving right/away) is allowed
      // velocityRatio.x < 0 for outflow (moving left/away) is allowed

      // Mark as arrived when first touching boundary
      if (!this.hasArrived) {
        this.hasArrived = true
      }
    }

    // Constrain Y position to safe zone
    if (this.positionRatio.y < SAFE_ZONE.TOP_RATIO) {
      this.positionRatio.y = SAFE_ZONE.TOP_RATIO
      this.velocityRatio.y = Math.abs(this.velocityRatio.y) * COLLISION_CONSTANTS.VERTICAL_BOUNCE_DAMPING
    } else if (this.positionRatio.y > SAFE_ZONE.BOTTOM_RATIO) {
      this.positionRatio.y = SAFE_ZONE.BOTTOM_RATIO
      this.velocityRatio.y = -Math.abs(this.velocityRatio.y) * COLLISION_CONSTANTS.VERTICAL_BOUNCE_DAMPING
    }

    // Constrain X position to canvas boundaries (prevent escaping left/right edges)
    const leftEdgeRatio = this.size / canvasWidth  // Left boundary with size padding
    const rightEdgeRatio = 1.0 - (this.size / canvasWidth)  // Right boundary with size padding

    if (this.positionRatio.x < leftEdgeRatio) {
      this.positionRatio.x = leftEdgeRatio

      // Block movement into boundary
      if (this.velocityRatio.x < 0) {
        this.velocityRatio.x = 0
      }

      // Edge stuck detection and recovery
      this.edgeStuckFrames++
      if (this.edgeStuckFrames > 180) {  // 3 seconds at 60 FPS
        // Force escape from edge with 5x speed boost
        const direction = this.type === 'inflow' ? -1 : 1
        this.velocityRatio.x = direction * this.constantSpeedRatio * 5
        this.edgeStuckFrames = 0
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Whale] Left edge stuck recovery triggered')
        }
      }
    } else if (this.positionRatio.x > rightEdgeRatio) {
      this.positionRatio.x = rightEdgeRatio

      // Block movement into boundary
      if (this.velocityRatio.x > 0) {
        this.velocityRatio.x = 0
      }

      // Edge stuck detection and recovery
      this.edgeStuckFrames++
      if (this.edgeStuckFrames > 180) {  // 3 seconds at 60 FPS
        // Force escape from edge with 5x speed boost
        const direction = this.type === 'inflow' ? -1 : 1
        this.velocityRatio.x = direction * this.constantSpeedRatio * 5
        this.edgeStuckFrames = 0
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Whale] Right edge stuck recovery triggered')
        }
      }
    } else {
      // Reset counter when away from edges
      this.edgeStuckFrames = 0
    }

    // Reset acceleration
    this.accelerationRatio = { x: 0, y: 0 }
  }

  applyForce(force, weight = 1.0) {
    this.accelerationRatio.x += force.x * weight
    this.accelerationRatio.y += force.y * weight
  }

  // ===== IMAGE LOADING ===== (REMOVED - using circles instead)

  // ===== RENDERING =====

  draw(ctx, canvasWidth, canvasHeight) {
    // Skip if sprites not loaded yet
    if (!whaleSprites.isLoaded()) {
      return
    }

    const pos = this.getPixelPosition(canvasWidth, canvasHeight)

    ctx.save()
    ctx.globalAlpha = this.opacity

    // ===== BIRTH EFFECT RENDERING =====
    if (this.isSpawning) {
      // Lazy initialization: cache sprite dimensions if not done in constructor
      // (Handles case where sprites loaded after whale creation)
      if (!this.cachedBirth) {
        const birthImage = whaleSprites.getEffectImage('birth')
        const birthMetadata = whaleSprites.getEffectMetadata('birth')
        const birthFrameWidth = birthImage.width / birthMetadata.columns
        const birthFrameHeight = birthImage.height / birthMetadata.rows
        const birthAspectRatio = birthFrameWidth / birthFrameHeight
        const birthDestWidth = this.size * 2.5
        const birthDestHeight = birthDestWidth / birthAspectRatio

        this.cachedBirth = {
          frameWidth: birthFrameWidth,
          frameHeight: birthFrameHeight,
          aspectRatio: birthAspectRatio,
          destWidth: birthDestWidth,
          destHeight: birthDestHeight
        }
      }

      const birthImage = whaleSprites.getEffectImage('birth')
      const birthMetadata = whaleSprites.getEffectMetadata('birth')

      // Get current birth frame (clamp to avoid overflow)
      const currentBirthFrame = Math.min(Math.floor(this.spawnFrameIndex), birthMetadata.frames - 1)
      const birthFrameRect = whaleSprites.getEffectFrameRect('birth', currentBirthFrame, this.cachedBirth.frameWidth, this.cachedBirth.frameHeight)

      // Use cached dimensions (2025-11-23: Performance optimization - no division)
      const { destWidth, destHeight } = this.cachedBirth

      // Draw birth effect (centered at position)
      ctx.drawImage(
        birthImage,
        birthFrameRect.sx, birthFrameRect.sy, birthFrameRect.sw, birthFrameRect.sh,  // Source
        pos.x - destWidth / 2, pos.y - destHeight / 2, destWidth, destHeight  // Destination
      )

      ctx.restore()
      return // Don't draw whale sprite during birth animation
    }

    // ===== DEATH EFFECT RENDERING =====
    if (this.isDespawning) {
      // Lazy initialization: cache sprite dimensions if not done in constructor
      // (Handles case where sprites loaded after whale creation)
      if (!this.cachedDeath) {
        const deathImage = whaleSprites.getEffectImage('die')
        const deathMetadata = whaleSprites.getEffectMetadata('die')
        const deathFrameWidth = deathImage.width / deathMetadata.columns
        const deathFrameHeight = deathImage.height / deathMetadata.rows
        const deathAspectRatio = deathFrameWidth / deathFrameHeight
        const deathDestWidth = this.size * 2.5
        const deathDestHeight = deathDestWidth / deathAspectRatio

        this.cachedDeath = {
          frameWidth: deathFrameWidth,
          frameHeight: deathFrameHeight,
          aspectRatio: deathAspectRatio,
          destWidth: deathDestWidth,
          destHeight: deathDestHeight
        }
      }

      const deathImage = whaleSprites.getEffectImage('die')
      const deathMetadata = whaleSprites.getEffectMetadata('die')

      // Get current death frame (clamp to avoid overflow)
      const currentDeathFrame = Math.min(Math.floor(this.deathFrameIndex), deathMetadata.frames - 1)
      const deathFrameRect = whaleSprites.getEffectFrameRect('die', currentDeathFrame, this.cachedDeath.frameWidth, this.cachedDeath.frameHeight)

      // Use cached dimensions (2025-11-23: Performance optimization - no division)
      const { destWidth, destHeight } = this.cachedDeath

      // Draw death effect (centered at position)
      ctx.drawImage(
        deathImage,
        deathFrameRect.sx, deathFrameRect.sy, deathFrameRect.sw, deathFrameRect.sh,  // Source
        pos.x - destWidth / 2, pos.y - destHeight / 2, destWidth, destHeight  // Destination
      )

      ctx.restore()
      return // Don't draw whale sprite during death animation
    }

    // ===== SPRITE ANIMATION UPDATE =====
    // Update frame index based on animation speed
    this.frameIndex = (this.frameIndex + this.animationSpeed) % this.frameCount
    const currentFrame = Math.floor(this.frameIndex)

    // ===== SPRITE RENDERING =====
    // Lazy initialization: cache sprite dimensions if not done in constructor
    // (Handles case where sprites loaded after whale creation)
    if (!this.cachedSprite) {
      const spriteImage = whaleSprites.getImage(this.tier)
      const metadata = whaleSprites.getMetadata(this.tier)
      const frameWidth = spriteImage.width / metadata.columns
      const frameHeight = spriteImage.height / metadata.rows
      const aspectRatio = frameWidth / frameHeight
      const destWidth = this.size * 2
      const destHeight = destWidth / aspectRatio

      this.cachedSprite = {
        frameWidth,
        frameHeight,
        aspectRatio,
        destWidth,
        destHeight
      }
    }

    const spriteImage = whaleSprites.getImage(this.tier)

    // Get source rectangle using cached frame dimensions (2025-11-23: Performance optimization)
    const frameRect = whaleSprites.getFrameRect(this.tier, currentFrame, this.cachedSprite.frameWidth, this.cachedSprite.frameHeight)

    // Use cached destination size (maintain aspect ratio) - no division!
    const { destWidth, destHeight } = this.cachedSprite

    // Apply horizontal flip based on type only (simplified)
    // All sprite images face LEFT (←) by default in the original PNG files
    //
    // FIXED: Use type-only logic to ensure consistent direction regardless of velocity
    // - INFLOW whales: Spawn right, move left → Face LEFT (no flip needed)
    // - OUTFLOW whales: Spawn left, move right → Face RIGHT (flip needed)
    const shouldFlip = this.type === 'outflow'

    if (shouldFlip) {
      ctx.translate(pos.x, pos.y)
      ctx.scale(-1, 1)  // Horizontal flip to face right
      ctx.translate(-pos.x, -pos.y)
    }

    // Draw sprite (centered at position)
    ctx.drawImage(
      spriteImage,
      frameRect.sx, frameRect.sy, frameRect.sw, frameRect.sh,  // Source (from sprite sheet)
      pos.x - destWidth / 2, pos.y - destHeight / 2, destWidth, destHeight  // Destination (on canvas)
    )

    // Selection glow
    if (this.isSelected) {
      ctx.shadowColor = this.type === 'inflow'
        ? '#52AF7CFF' // Green glow for inflow
        : '#D3484EFF'  // Red glow for outflow
      ctx.shadowBlur = RENDER_CONSTANTS.GLOW_BLUR_RADIUS
      ctx.strokeStyle = this.type === 'inflow' ? '#52AF7CFF' : '#D3484EFF'
      ctx.lineWidth = RENDER_CONSTANTS.SELECTION_STROKE_WIDTH
      ctx.strokeRect(pos.x - destWidth / 2 - 2, pos.y - destHeight / 2 - 2, destWidth + 4, destHeight + 4)
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  drawDebug(ctx, canvasWidth, canvasHeight) {
    const pos = this.getPixelPosition(canvasWidth, canvasHeight)
    const perceptionRadius = this.getPerceptionRadius(canvasWidth)

    ctx.save()
    ctx.strokeStyle = '#FFFFFF1A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, perceptionRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // ===== LIFECYCLE =====

  startDespawn() {
    if (!this.isDespawning) {
      this.isDespawning = true
      this.despawnStartTime = Date.now()
    }
  }

  shouldStartDespawn() {
    return Date.now() - this.spawnTime > this.lifetime
  }

  shouldDespawn() {
    if (!this.isDespawning) return false
    return Date.now() - this.despawnStartTime > this.fadeOutDuration
  }

  // ===== UTILITIES =====

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  distance(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  limit(vector, max) {
    const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
    if (mag > max) {
      return {
        x: (vector.x / mag) * max,
        y: (vector.y / mag) * max
      }
    }
    return vector
  }

  containsPoint(x, y, canvasWidth, canvasHeight) {
    const pos = this.getPixelPosition(canvasWidth, canvasHeight)

    // Simple circle collision detection
    const dx = x - pos.x
    const dy = y - pos.y
    const distanceSquared = dx * dx + dy * dy
    // Add 20% padding for easier clicking
    const clickRadius = this.size * 1.2
    return distanceSquared <= clickRadius * clickRadius
  }

  // Update RSI boundary when RSI value changes
  // Movement target (this.targetXRatio) is always 0.5 (center) and doesn't change
  // RSI boundary is dynamic and acts as a wall that whales cannot cross
  updateRSIBoundary(rsiBoundaryXRatio) {
    this.previousRSIBoundaryXRatio = this.rsiBoundaryXRatio
    this.rsiBoundaryXRatio = rsiBoundaryXRatio
  }
}

export default Whale
