import React from 'react'
import Header from '../components/Header'
import NewsCard from '../components/NewsCard'
import { useNews } from '../hooks/useNews'
import { Newspaper } from 'lucide-react'

/**
 * NewsPage - Crypto News powered by NewsAPI.org
 * Features:
 * - Latest crypto market news with images
 * - Auto-detected tags (BTC, ETH, DeFi, etc.)
 * - Masonry grid layout
 * - 12-hour cache (2 API calls/day)
 */
function NewsPage() {
  const { data, loading, error } = useNews(true)

  const { articles } = data

  return (
    <div className="min-h-screen bg-surface-100 text-surface-600">
      <Header />
      <div className="max-w-[1440px] mx-auto relative p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📰 뉴스 · 리포트</h1>
        </div>

        {/* Loading State - Skeleton Loader */}
        {loading && !error && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card animate-pulse break-inside-avoid mb-6">
                <div className="h-48 bg-surface-300 rounded mb-4"></div>
                <div className="h-6 bg-surface-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-surface-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-surface-300 rounded w-5/6 mb-4"></div>
                <div className="h-20 bg-surface-300 rounded mb-3"></div>
                <div className="h-4 bg-surface-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-20">
            <Newspaper size={64} className="mx-auto text-surface-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-surface-600">뉴스를 불러오는 중입니다</h3>
            <p className="text-surface-500">
              잠시 후 자동으로 최신 암호화폐 뉴스가 표시됩니다.
            </p>
          </div>
        )}

        {/* Masonry Grid Layout */}
        {!loading && !error && articles.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {articles.map((article, index) => (
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsPage
