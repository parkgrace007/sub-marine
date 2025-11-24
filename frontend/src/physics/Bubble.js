/**
 * Bubble - Individual bubble particle for underwater effect
 * Rises from bottom to top with horizontal wobble
 */
class Bubble {
  constructor(canvasWidth, canvasHeight) {
    this.reset(canvasWidth, canvasHeight, true)
  }

  /**
   * Reset bubble to initial state
   * @param {boolean} randomY - If true, spawn at random Y position (initial spawn)
   */
  reset(canvasWidth, canvasHeight, randomY = false) {
    // Position
    this.x = Math.random() * canvasWidth
    this.y = randomY
      ? Math.random() * canvasHeight // Random Y for initial spawn
      : canvasHeight + 10 // Bottom spawn for recycling

    // Size (0.9px-3.6px) - 10% smaller
    this.size = 0.9 + Math.random() * 2.7

    // Speed (slower, more static) - 50% slower
    this.speed = 0.15 + Math.random() * 0.35

    // Wobble (horizontal oscillation) - Very minimal
    this.wobbleAmplitude = 1.5 + Math.random() * 4
    this.wobbleSpeed = 0.01 + Math.random() * 0.015
    this.wobbleOffset = Math.random() * Math.PI * 2

    // Opacity (very subtle)
    this.baseOpacity = 0.05 + Math.random() * 0.1
    this.opacity = this.baseOpacity

    // Lifespan (30% of bubbles fade out midway)
    this.hasFastFade = Math.random() < 0.3 // 30% chance
    this.maxLifespan = this.hasFastFade
      ? 100 + Math.random() * 150 // Fast fade: 100-250 frames
      : Infinity // Normal: never fade

    // Age (for time-based wobble and fade)
    this.age = 0
  }

  /**
   * Update bubble position
   */
  update(canvasWidth, canvasHeight) {
    // Increment age
    this.age++

    // Rise upward
    this.y -= this.speed

    // Horizontal wobble (sin wave)
    const wobblePhase = this.age * this.wobbleSpeed + this.wobbleOffset
    const wobble = Math.sin(wobblePhase) * this.wobbleAmplitude
    this.x += wobble * 0.1

    // Handle fast fade (30% of bubbles)
    if (this.hasFastFade) {
      const fadeProgress = this.age / this.maxLifespan
      if (fadeProgress >= 1) {
        // Fully faded, respawn
        this.reset(canvasWidth, canvasHeight, false)
        return // Skip rest of update after reset
      } else if (fadeProgress >= 0.7) {
        // Start fading at 70% of lifespan
        const fadeAmount = (fadeProgress - 0.7) / 0.3
        this.opacity = this.baseOpacity * (1 - fadeAmount)
      }
    }

    // Recycle if off-screen (top)
    if (this.y + this.size < 0) {
      this.reset(canvasWidth, canvasHeight, false)
    }

    // Keep within horizontal bounds
    if (this.x < -this.size) this.x = canvasWidth + this.size
    if (this.x > canvasWidth + this.size) this.x = -this.size
  }

  /**
   * Draw bubble on canvas
   */
  draw(ctx) {
    ctx.save()

    // Set bubble style
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
    ctx.shadowBlur = this.size * 2
    ctx.shadowColor = `rgba(255, 255, 255, ${this.opacity * 0.5})`

    // Draw circle
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()

    // Add inner highlight for depth
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.3})`
    ctx.beginPath()
    ctx.arc(
      this.x - this.size * 0.3,
      this.y - this.size * 0.3,
      this.size * 0.4,
      0,
      Math.PI * 2
    )
    ctx.fill()

    ctx.restore()
  }
}

export default Bubble
