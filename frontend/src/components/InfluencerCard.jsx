import React from 'react'
import { ExternalLink, Twitter, Users } from 'lucide-react'

/**
 * InfluencerCard - Display top crypto influencer
 */
function InfluencerCard({ influencer }) {
  const { name, url, followers, influence_score } = influencer

  // Format follower count
  const formatFollowers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Format influence score (0-100)
  const formatScore = (score) => {
    return score ? Math.round(score) : 'N/A'
  }

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-surface-500'
  }

  return (
    <div className="card hover:border-primary transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Twitter size={18} className="text-blue-400" />
          <h3 className="text-base font-semibold text-surface-600 group-hover:text-primary transition-colors">
            {name || 'Unknown Influencer'}
          </h3>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        {/* Followers */}
        {followers && (
          <div className="flex items-center gap-1 text-sm">
            <Users size={14} className="text-surface-500" />
            <span className="text-surface-600 font-medium">{formatFollowers(followers)}</span>
            <span className="text-surface-400 text-xs">followers</span>
          </div>
        )}

        {/* Influence Score */}
        {influence_score !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <span className="text-surface-400 text-xs">Influence:</span>
            <span className={`font-bold ${getScoreColor(influence_score)}`}>
              {formatScore(influence_score)}
            </span>
          </div>
        )}
      </div>

      {/* Profile Link */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          <span>View profile</span>
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}

export default InfluencerCard
