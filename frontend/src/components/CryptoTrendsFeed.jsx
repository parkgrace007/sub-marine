import React, { useState } from 'react'
import { useNews } from '../hooks/useNews'
import { Newspaper, ExternalLink, Clock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import CoinIcon from './CoinIcon'

/**
 * CryptoTrendsFeed - Latest News Preview (6 articles)
 * Displays 6 latest crypto news articles from NewsPage in 3x2 grid
 */
function CryptoTrendsFeed({ className = '' }) {
  const { data, loading, error } = useNews(true)
  const { articles } = data

  // List of known coin symbols for icon display
  const knownCoins = ['BTC', 'ETH', 'XRP', 'ADA', 'USDC', 'DOGE', 'BNB', 'TRX', 'USDT', 'AVAX', 'SHIB', 'SOL']

  // Check if tag is a coin symbol
  const isCoinTag = (tag) => {
    return knownCoins.includes(tag.toUpperCase())
  }

  // Get only first 6 articles
  const latestNews = articles.slice(0, 6)

  // Format time ago
  const getTimeAgo = (created) => {
    if (!created) return 'Unknown'
    const now = new Date()
    const postTime = new Date(created)
    const diffSeconds = Math.floor((now - postTime) / 1000)

    if (diffSeconds < 60) return '방금 전'
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}시간 전`
    return `${Math.floor(diffSeconds / 86400)}일 전`
  }

  return (
    <div className={`bg-surface-200 border border-surface-300 rounded-md overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-200 border-b border-surface-300">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-primary" />
          <span className="text-sm font-bold text-surface-600 tracking-wider">📰 최신 뉴스</span>
        </div>
        <Link
          to="/news"
          className="text-xs text-surface-500 hover:text-primary transition-colors flex items-center gap-1"
        >
          <span>전체 보기</span>
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-surface-500 animate-pulse">뉴스 로딩 중...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-surface-500 text-sm mb-2">
              ⚠️ 뉴스를 불러올 수 없습니다
            </div>
            <div className="text-xs text-surface-500/60">{error}</div>
          </div>
        )}

        {/* News Grid - 3 columns x 2 rows */}
        {!loading && !error && latestNews.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {latestNews.map((article, index) => (
              <NewsPreviewCard key={`${article.url}-${index}`} article={article} getTimeAgo={getTimeAgo} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && latestNews.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-surface-500 opacity-50 text-sm">
              📰 뉴스가 없습니다
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * NewsPreviewCard - Compact news card for dashboard
 */
function NewsPreviewCard({ article, getTimeAgo }) {
  const { title, body, url, created, publisher_name, image, tags } = article
  const [imageError, setImageError] = useState(false)

  // List of known coin symbols for icon display
  const knownCoins = ['BTC', 'ETH', 'XRP', 'ADA', 'USDC', 'DOGE', 'BNB', 'TRX', 'USDT', 'AVAX', 'SHIB', 'SOL']

  // Check if tag is a coin symbol
  const isCoinTag = (tag) => {
    return knownCoins.includes(tag.toUpperCase())
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surface-300/60 border border-surface-400 rounded overflow-hidden
                 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg transition-all
                 flex flex-col"
    >
      {/* Image Thumbnail */}
      {image && !imageError && (
        <img
          src={image}
          alt={title}
          className="w-full h-32 object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-0.5"
              >
                {isCoinTag(tag) && <CoinIcon symbol={tag} size={10} />}
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-xs text-surface-600 leading-tight line-clamp-2">
          {title || 'Untitled Article'}
        </h3>

        {/* Summary */}
        {body && (
          <p className="text-[10px] text-surface-500 line-clamp-2 leading-relaxed">
            {body.length > 100 ? body.slice(0, 100) + '...' : body}
          </p>
        )}

        {/* Footer: Source + Time */}
        <div className="mt-auto pt-2 border-t border-surface-400/30 flex items-center justify-between gap-2">
          <span className="text-[9px] text-surface-500 font-medium truncate">
            {publisher_name || 'Unknown'}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock size={8} className="text-surface-500" />
            <span className="text-[9px] text-surface-500">
              {getTimeAgo(created)}
            </span>
          </div>
        </div>

        {/* Read More */}
        <div className="flex items-center gap-1 text-primary text-[10px] font-medium mt-1">
          <span>Read more</span>
          <ExternalLink size={10} />
        </div>
      </div>
    </a>
  )
}

export default CryptoTrendsFeed
