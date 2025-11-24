import React, { useRef, useEffect, useState } from 'react'
import whaleSprites from '../../utils/WhaleSprites'

/**
 * AnimatedWhaleSprite - Animated sprite component for guide page
 * Displays a looping whale animation using sprite sheets
 */
function AnimatedWhaleSprite({ tier, size = 80 }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const frameIndexRef = useRef(0)
  const [spritesLoaded, setSpritesLoaded] = useState(false)

  // Load sprites
  useEffect(() => {
    whaleSprites.load()
      .then(() => {
        setSpritesLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load whale sprites:', error)
      })
  }, [])

  // Animation loop
  useEffect(() => {
    if (!spritesLoaded) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const spriteImage = whaleSprites.getImage(tier)
    const metadata = whaleSprites.getMetadata(tier)

    // Set canvas size
    canvas.width = size
    canvas.height = size

    // Calculate frame dimensions
    const frameWidth = spriteImage.width / metadata.columns
    const frameHeight = spriteImage.height / metadata.rows

    let lastFrameTime = 0
    const frameDelay = 100 // 100ms per frame = 10 FPS

    const animate = (currentTime) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update frame at 10 FPS
      if (currentTime - lastFrameTime >= frameDelay) {
        frameIndexRef.current = (frameIndexRef.current + 1) % metadata.frames
        lastFrameTime = currentTime
      }

      // Get frame rectangle
      const frameRect = whaleSprites.getFrameRect(
        tier,
        frameIndexRef.current,
        frameWidth,
        frameHeight
      )

      // Draw sprite frame centered in canvas
      const scale = Math.min(size / frameWidth, size / frameHeight) * 0.8 // 80% of canvas
      const drawWidth = frameWidth * scale
      const drawHeight = frameHeight * scale
      const offsetX = (size - drawWidth) / 2
      const offsetY = (size - drawHeight) / 2

      ctx.drawImage(
        spriteImage,
        frameRect.sx,
        frameRect.sy,
        frameRect.sw,
        frameRect.sh,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [tier, size, spritesLoaded])

  return (
    <div className="flex-shrink-0" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}

export default AnimatedWhaleSprite
