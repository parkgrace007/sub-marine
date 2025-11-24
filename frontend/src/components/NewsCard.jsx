import React, { useState } from 'react'
import { ExternalLink, Clock } from 'lucide-react'
import CoinIcon from './CoinIcon'

/**
 * NewsCard - Enhanced news article card with image, tags, and read time
 */
function NewsCard({ article }) {
  const { title, body, url, created, publisher_name, image, author, tags, readTime } = article
  const [imageError, setImageError] = useState(false)

  // List of known coin symbols for icon display
  const knownCoins = ['BTC', 'ETH', 'XRP', 'ADA', 'USDC', 'DOGE', 'BNB', 'TRX', 'USDT', 'AVAX', 'SHIB', 'SOL']

  // Check if tag is a coin symbol
  const isCoinTag = (tag) => {
    return knownCoins.includes(tag.toUpperCase())
  }

  // Format date
  const date = created ? new Date(created) : null
  const timeAgo = date ? getTimeAgo(date) : 'Unknown date'

  // Truncate body to 200 characters
  const summary = body ? (body.length > 200 ? body.slice(0, 200) + '...' : body) : 'No summary available'

  return (
    <div className="card hover:border-primary transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 group break-inside-avoid mb-6">
      {/* Image Thumbnail */}
      {image && !imageError && (
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover rounded-t-lg -mt-3 -mx-3 mb-3"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
            >
              {isCoinTag(tag) && <CoinIcon symbol={tag} size={12} />}
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-bold text-surface-600 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {title || 'Untitled Article'}
        </h3>
      </div>

      {/* Source, Author, Date & Read Time */}
      <div className="flex items-center gap-2 text-xs text-surface-500 mb-3 flex-wrap">
        {publisher_name && (
          <>
            <span className="font-medium">{publisher_name}</span>
            <span>•</span>
          </>
        )}
        {author && (
          <>
            <span className="italic">{author}</span>
            <span>•</span>
          </>
        )}
        <span>{timeAgo}</span>
        {readTime && readTime > 0 && (
          <>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{readTime}분 읽기</span>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-surface-500 mb-4 line-clamp-4 leading-relaxed">
        {summary}
      </p>

      {/* Read More Link */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          <span>Read full article</span>
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}

/**
 * Calculate time ago from date
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default NewsCard
