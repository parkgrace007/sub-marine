import React from 'react'

/**
 * TierSummaryPanel - Left panel showing tier-based alerts
 * Shows only the most recent alert for each tier with visual distinction
 */
function TierSummaryPanel({ alerts = [], className = '' }) {
  // Group alerts by tier and get the most recent one for each
  const tierAlerts = {
    S: alerts.filter(a => a.tier === 'S')[0],
    A: alerts.filter(a => a.tier === 'A')[0],
    B: alerts.filter(a => a.tier === 'B')[0],
    C: alerts.filter(a => a.tier === 'C')[0]
  }

  const tierConfig = {
    S: {
      label: 'SUPREME',
      bgColor: 'bg-tier-s/80',
      borderColor: 'border-tier-s',
      textColor: 'text-primary-text',
      glowEffect: 'tier-s-glow',
      pulseAnimation: 'animate-pulse',
      icon: '/icons/outflow.png',
      isImage: true,
      description: 'Critical Signal'
    },
    A: {
      label: 'ACTION',
      bgColor: 'bg-tier-a/80',
      borderColor: 'border-tier-a',
      textColor: 'text-primary-text',
      glowEffect: '',
      pulseAnimation: '',
      icon: '🟠',
      isImage: false,
      description: 'Strong Signal'
    },
    B: {
      label: 'BEWARE',
      bgColor: 'bg-tier-b/80',
      borderColor: 'border-tier-b',
      textColor: 'text-primary-text',
      glowEffect: '',
      pulseAnimation: '',
      icon: '🟡',
      isImage: false,
      description: 'Moderate Signal'
    },
    C: {
      label: 'CONTEXT',
      bgColor: 'bg-tier-c/80',
      borderColor: 'border-tier-c',
      textColor: 'text-surface-600',
      glowEffect: '',
      pulseAnimation: '',
      icon: '⚪',
      isImage: false,
      description: 'Info Signal'
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {['S', 'A', 'B', 'C'].map(tier => {
        const alert = tierAlerts[tier]
        const config = tierConfig[tier]

        return (
          <div
            key={tier}
            className={`
              relative rounded-lg border p-3 transition-all duration-300
              ${config.bgColor} ${config.borderColor}
              ${alert ? 'opacity-100' : 'opacity-40'}
              ${alert && tier === 'S' ? `${config.pulseAnimation} ${config.glowEffect}` : ''}
              ${alert && tier === 'A' ? config.glowEffect : ''}
            `}
          >
            {/* Tier Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {config.isImage ? (
                  <img src={config.icon} alt={`Tier ${tier}`} className="w-5 h-5 object-contain" />
                ) : (
                  <span className="text-lg">{config.icon}</span>
                )}
                <span className={`font-bold text-xs ${config.textColor}`}>
                  TIER {tier}
                </span>
                <span className={`text-xs ${config.textColor} opacity-70`}>
                  {config.label}
                </span>
              </div>
              {alert && (
                <span className="text-xs text-surface-600 opacity-50">
                  {formatTime(alert.created_at)}
                </span>
              )}
            </div>

            {/* Alert Content */}
            {alert ? (
              <div className="space-y-1">
                <div className={`text-xs font-mono ${config.textColor}`}>
                  {alert.signal_type}
                </div>
                <div className={`text-xs ${config.textColor} opacity-80 line-clamp-2`}>
                  {alert.message}
                </div>
                {alert.conditions && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(alert.conditions).slice(0, 3).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs px-1.5 py-0.5 bg-surface-100/50 rounded font-mono text-surface-600 opacity-80"
                      >
                        {key}:{typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-xs ${config.textColor} opacity-40 italic`}>
                No {config.description} Active
              </div>
            )}

            {/* Active Indicator */}
            {alert && (
              <div className="absolute top-2 right-2">
                <div className={`w-2 h-2 rounded-full ${config.bgColor} animate-pulse`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-ping"></div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TierSummaryPanel