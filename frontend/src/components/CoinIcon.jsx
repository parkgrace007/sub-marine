import React, { useState } from 'react'
import { Coins } from 'lucide-react'

/**
 * Coin symbol to filename mapping
 * Maps common symbol variations to SVG filenames
 */
const COIN_MAP = {
  // Bitcoin
  'BTC': 'bitcoin-btc',
  'BITCOIN': 'bitcoin-btc',

  // Ethereum
  'ETH': 'ethereum-eth',
  'ETHEREUM': 'ethereum-eth',

  // XRP
  'XRP': 'xrp-xrp',
  'RIPPLE': 'xrp-xrp',

  // Cardano
  'ADA': 'cardano-ada',
  'CARDANO': 'cardano-ada',

  // USDC
  'USDC': 'usd-coin-usdc',
  'USD COIN': 'usd-coin-usdc',

  // Dogecoin
  'DOGE': 'dogecoin-doge',
  'DOGECOIN': 'dogecoin-doge',

  // BNB
  'BNB': 'bnb-bnb',
  'BINANCE': 'bnb-bnb',

  // Tron
  'TRX': 'tron-trx',
  'TRON': 'tron-trx',

  // Tether
  'USDT': 'tether-usdt',
  'TETHER': 'tether-usdt',

  // Avalanche
  'AVAX': 'avalanche-avax',
  'AVALANCHE': 'avalanche-avax',

  // Shiba Inu
  'SHIB': 'shiba-inu-shib',
  'SHIBA INU': 'shiba-inu-shib',
  'SHIBA': 'shiba-inu-shib',

  // Solana
  'SOL': 'solana-sol',
  'SOLANA': 'solana-sol'
}

/**
 * CoinIcon - Universal coin icon component
 *
 * @param {string} symbol - Coin symbol (BTC, ETH, etc.)
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {string} className - Additional CSS classes
 */
function CoinIcon({ symbol, size = 24, className = '' }) {
  const [imageError, setImageError] = useState(false)

  if (!symbol) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-300 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Coins size={size * 0.6} className="text-surface-500" />
      </div>
    )
  }

  // Normalize symbol (uppercase, trim)
  const normalizedSymbol = symbol.toString().toUpperCase().trim()

  // Get filename from map
  const filename = COIN_MAP[normalizedSymbol]

  // If no mapping or image error, show fallback
  if (!filename || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-300 rounded-full ${className}`}
        style={{ width: size, height: size }}
        title={symbol}
      >
        <span className="text-surface-600 font-bold" style={{ fontSize: size * 0.4 }}>
          {normalizedSymbol.substring(0, 3)}
        </span>
      </div>
    )
  }

  return (
    <img
      src={`/simbol/coin/${filename}-logo.svg`}
      alt={symbol}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  )
}

export default CoinIcon
