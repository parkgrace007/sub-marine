import React from 'react'

/**
 * ⚠️ DESIGN SYSTEM EXCEPTION
 *
 * This file contains a gradient visualization for RSI (Relative Strength Index) indicator.
 * The gradient is FUNCTIONAL data visualization, not decorative design.
 *
 * DO NOT apply Supabase Amber "no gradient" rule to this component.
 * DO NOT modify the color scheme or gradient logic.
 *
 * Purpose: Real-time market sentiment visualization (Red = Sell pressure, Green = Buy pressure)
 */

function Background({ bullRatio = 0.6 }) {
  // Visual transformation: map bullRatio [0, 1] to visualPosition [0.9, 0.1] (REVERSED)
  // Low RSI (oversold/buy) → RIGHT (blue), High RSI (overbought/sell) → LEFT (red)
  const visualPosition = 0.9 - (bullRatio * 0.8)

  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        background: `linear-gradient(to right,
          rgba(211, 72, 78, 0.5) 0%,
          rgba(211, 72, 78, 0.5) ${visualPosition * 100}%,
          rgba(82, 175, 124, 0.5) ${visualPosition * 100}%,
          rgba(82, 175, 124, 0.5) 100%)`
      }}
    />
  )
}

export default Background
