import React, { useState } from 'react'
import { Building2 } from 'lucide-react'

/**
 * Exchange name to filename mapping
 * Maps common exchange name variations to SVG filenames
 */
const EXCHANGE_MAP = {
  // Binance
  'BINANCE': 'binance',
  'BN': 'binance',

  // Coinbase
  'COINBASE': 'Coinbase',
  'CB': 'Coinbase',

  // OKX
  'OKX': 'OKX',
  'OKEX': 'OKX'
}

/**
 * ExchangeIcon - Universal exchange icon component
 *
 * @param {string} name - Exchange name (Binance, Coinbase, OKX, etc.)
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {string} className - Additional CSS classes
 */
function ExchangeIcon({ name, size = 24, className = '' }) {
  const [imageError, setImageError] = useState(false)

  if (!name) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-300 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Building2 size={size * 0.6} className="text-surface-500" />
      </div>
    )
  }

  // Normalize name (uppercase, trim)
  const normalizedName = name.toString().toUpperCase().trim()

  // Get filename from map
  const filename = EXCHANGE_MAP[normalizedName]

  // If no mapping or image error, show fallback
  if (!filename || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-300 rounded-full ${className}`}
        style={{ width: size, height: size }}
        title={name}
      >
        <span className="text-surface-600 font-bold" style={{ fontSize: size * 0.4 }}>
          {normalizedName.substring(0, 2)}
        </span>
      </div>
    )
  }

  return (
    <img
      src={`/simbol/exchange/${filename}.svg`}
      alt={name}
      className={`rounded ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  )
}

export default ExchangeIcon
