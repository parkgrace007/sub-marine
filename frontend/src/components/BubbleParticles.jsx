import React, { useRef, useEffect } from 'react'
import Bubble from '../physics/Bubble'

/**
 * BubbleParticles - Underwater bubble effect
 * Creates ambient bubbles rising from bottom to top
 */
function BubbleParticles({ containerRef, className }) {
  const canvasRef = useRef(null)
  const bubblesRef = useRef([])
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    // Set canvas size from container
    const resize = () => {
      const container = containerRef?.current
      if (container) {
        canvas.width = container.offsetWidth
        canvas.height = container.offsetHeight
      } else {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }

      // Initialize bubbles on first load or recreate on resize
      if (bubblesRef.current.length === 0 || canvas.width > 0) {
        const bubbleCount = 32 // 32 bubbles (20% reduction from 40)
        bubblesRef.current = Array.from(
          { length: bubbleCount },
          () => new Bubble(canvas.width, canvas.height)
        )
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw all bubbles
      bubblesRef.current.forEach((bubble) => {
        bubble.update(canvas.width, canvas.height)
        bubble.draw(ctx)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [containerRef])

  return (
    <canvas
      ref={canvasRef}
      className={className || 'absolute inset-0 w-full h-full pointer-events-none'}
    />
  )
}

export default BubbleParticles
