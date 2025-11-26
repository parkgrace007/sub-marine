import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import whaleSprites from '../utils/WhaleSprites'
import CoinIcon from './CoinIcon'
import ExchangeIcon from './ExchangeIcon'

/**
 * WhaleTooltip - Displays detailed whale transaction information
 * Enhanced with sprite animation and user-friendly information
 * Supports bilingual display: Korean (translated) / English (raw API data)
 */
function WhaleTooltip({ whale, position, onClose }) {
  const { t, i18n } = useTranslation()
  const isKorean = i18n.language === 'ko' || i18n.language?.startsWith('ko-')

  const canvasRef = useRef(null)
  const frameIndexRef = useRef(0)
  const animationRef = useRef(null)

  if (!whale) return null

  const whaleMetadata = whale.metadata || {}
  const { blockchain, symbol, amount, amountUSD, hash, fromOwner, toOwner, fromOwnerType, toOwnerType } = whaleMetadata

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num?.toFixed(2) || '0'
  }

  // Get owner label: Korean uses translation, English uses raw API data
  const getOwnerLabel = (owner) => {
    if (!owner) {
      return isKorean ? t('whale.ownerTypes.wallet') : 'Wallet'
    }
    if (isKorean) {
      return t(`whale.exchanges.${owner}`, { defaultValue: owner })
    }
    return owner // English: raw API data
  }

  // Get tier name: Korean uses translation, English uses tier number
  const getTierName = (tier) => {
    if (isKorean) {
      return t(`whale.tiers.${tier}`, { defaultValue: `Tier ${tier}` })
    }
    return t(`whale.tiers.${tier}`, { defaultValue: `Tier ${tier}` })
  }

  // Truncate hash
  const truncateHash = (hash) => {
    if (!hash) return 'N/A'
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  // Position tooltip (avoid edges)
  const tooltipStyle = {
    left: position.x > window.innerWidth / 2 ? 'auto' : `${position.x + 20}px`,
    right: position.x > window.innerWidth / 2 ? `${window.innerWidth - position.x + 20}px` : 'auto',
    top: position.y > window.innerHeight / 2 ? 'auto' : `${position.y}px`,
    bottom: position.y > window.innerHeight / 2 ? `${window.innerHeight - position.y}px` : 'auto'
  }

  // Render sprite animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !whaleSprites.isLoaded()) return

    const ctx = canvas.getContext('2d')
    const tier = whale.tier
    const spriteImage = whaleSprites.getImage(tier)
    const spriteMetadata = whaleSprites.getMetadata(tier)

    // Calculate frame dimensions
    const frameWidth = spriteImage.width / spriteMetadata.columns
    const frameHeight = spriteImage.height / spriteMetadata.rows

    // Animation loop
    const animate = () => {
      // Update frame index
      frameIndexRef.current = (frameIndexRef.current + 0.15) % spriteMetadata.frames

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get current frame rect
      const currentFrame = Math.floor(frameIndexRef.current)
      const frameRect = whaleSprites.getFrameRect(tier, currentFrame, frameWidth, frameHeight)

      // Calculate destination size (fit to canvas)
      const aspectRatio = frameWidth / frameHeight
      let destWidth = canvas.width * 0.8
      let destHeight = destWidth / aspectRatio

      // Center on canvas
      const offsetX = (canvas.width - destWidth) / 2
      const offsetY = (canvas.height - destHeight) / 2

      ctx.save()

      // Apply horizontal flip for OUTFLOW whales
      if (whale.type === 'outflow') {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)
      }

      // Draw sprite frame
      ctx.drawImage(
        spriteImage,
        frameRect.sx, frameRect.sy, frameRect.sw, frameRect.sh,
        offsetX, offsetY, destWidth, destHeight
      )

      ctx.restore()

      // Continue animation
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [whale.tier, whale.type])

  return (
    <>
      {/* Backdrop for click-outside */}
      <div
        className="fixed inset-0 z-[100] pointer-events-auto"
        onClick={onClose}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[110] bg-surface-200 opacity-95 border border-surface-300 p-4 shadow-lg min-w-[280px] max-w-[320px] pointer-events-auto"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Whale Animation + Type */}
        <div className="flex items-start gap-3 mb-3 pb-3 border-b border-surface-300">
          {/* Animated Whale Sprite */}
          <div className="flex-shrink-0">
            <canvas
              ref={canvasRef}
              width="80"
              height="80"
              className="w-20 h-20"
            />
          </div>

          {/* Transaction Info */}
          <div className="flex-1 min-w-0">
            {/* FROM → TO */}
            <div className="flex items-center gap-1 text-xs mb-1">
              <div className="flex items-center gap-1 truncate max-w-[90px]">
                {fromOwnerType === 'exchange' && fromOwner && (
                  <ExchangeIcon name={fromOwner} size={14} />
                )}
                <span className="text-surface-600 opacity-80 font-medium truncate">
                  {getOwnerLabel(fromOwner)}
                </span>
              </div>
              <span className="text-surface-600 opacity-40 flex-shrink-0">→</span>
              <div className="flex items-center gap-1 truncate max-w-[90px]">
                {toOwnerType === 'exchange' && toOwner && (
                  <ExchangeIcon name={toOwner} size={14} />
                )}
                <span className="text-surface-600 opacity-80 font-medium truncate">
                  {getOwnerLabel(toOwner)}
                </span>
              </div>
            </div>

            {/* INFLOW/OUTFLOW Badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                whale.type === 'inflow'
                  ? 'bg-success/20 text-success'
                  : 'bg-danger/20 text-danger'
              }`}>
                {whale.type === 'inflow' ? t('whale.flowLabels.inflow') : t('whale.flowLabels.outflow')}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="text-surface-600 opacity-60 hover:opacity-100 transition-opacity text-xl flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Transaction Details */}
        <div className="space-y-2 text-sm">
          {/* Value (Most Important) */}
          <div className="flex justify-between items-center bg-surface-300/30 p-2 rounded">
            <span className="text-surface-600 opacity-60 font-medium">Value:</span>
            <span className="font-bold text-surface-600 text-lg">
              ${formatNumber(amountUSD || whale.size * 10000)}
            </span>
          </div>

          {/* Tier */}
          <div className="flex justify-between items-center">
            <span className="text-surface-600 opacity-60">Tier:</span>
            <span className="text-surface-600 font-medium">
              {whale.tier} - {getTierName(whale.tier)}
            </span>
          </div>

          {/* Blockchain */}
          {blockchain && (
            <div className="flex justify-between items-center">
              <span className="text-surface-600 opacity-60">Chain:</span>
              <span className="text-surface-600 font-mono uppercase text-xs">
                {blockchain}
              </span>
            </div>
          )}

          {/* Symbol */}
          {symbol && (
            <div className="flex justify-between items-center">
              <span className="text-surface-600 opacity-60">Token:</span>
              <div className="flex items-center gap-2">
                <CoinIcon symbol={symbol} size={20} />
                <span className="text-surface-600 font-mono uppercase font-bold">
                  {symbol}
                </span>
              </div>
            </div>
          )}

          {/* Amount */}
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-surface-600 opacity-60">Amount:</span>
              <span className="text-surface-600 font-mono">{formatNumber(amount)}</span>
            </div>
          )}

          {/* Age */}
          <div className="flex justify-between items-center">
            <span className="text-surface-600 opacity-60">Age:</span>
            <span className="text-surface-600 opacity-80 text-xs font-mono">
              {(() => {
                const ageSeconds = Math.floor((Date.now() - whale.spawnTime) / 1000)
                if (ageSeconds >= 3600) return `${Math.floor(ageSeconds / 3600)}h ${Math.floor((ageSeconds % 3600) / 60)}m`
                if (ageSeconds >= 60) return `${Math.floor(ageSeconds / 60)}m ${ageSeconds % 60}s`
                return `${ageSeconds}s`
              })()}
            </span>
          </div>
        </div>

        {/* Footer - Transaction Hash */}
        {hash && (
          <div className="mt-3 pt-3 border-t border-surface-300">
            <div className="flex justify-between items-center">
              <span className="text-surface-600 opacity-60 text-xs">Tx Hash:</span>
              <a
                href={`https://etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary opacity-80 hover:opacity-100 font-mono text-xs underline"
                onClick={(e) => e.stopPropagation()}
              >
                {truncateHash(hash)}
              </a>
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-3 pt-2 border-t border-surface-300 text-xs text-surface-600 opacity-40 text-center">
          Click outside to close
        </div>
      </div>
    </>
  )
}

export default WhaleTooltip
