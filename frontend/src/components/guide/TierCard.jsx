import React from 'react'
import AnimatedWhaleSprite from './AnimatedWhaleSprite'

function TierCard({ tier, name, range, rangeKRW, frequency, meaning, strategy }) {
  return (
    <div className="card p-6 hover:border-primary transition-colors">
      <div className="flex items-start gap-4">
        {/* 고래 애니메이션 */}
        <AnimatedWhaleSprite tier={tier} size={80} />

        {/* 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-primary">Tier {tier}</span>
            <h3 className="text-xl font-bold text-surface-600">{name}</h3>
          </div>
          <p className="text-lg text-primary font-mono font-semibold mb-1">{range}</p>
          <p className="text-sm text-surface-500 font-mono mb-4">≈ {rangeKRW}</p>

          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-surface-500 font-semibold min-w-[100px]">발생 빈도:</span>
              <span className="text-surface-600">{frequency}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-surface-500 font-semibold min-w-[100px]">의미:</span>
              <span className="text-surface-600">{meaning}</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-surface-200 rounded-lg border border-surface-300">
            <span className="text-surface-500 font-semibold text-sm">💡 전략:</span>
            <p className="mt-2 text-surface-600 leading-relaxed">{strategy}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TierCard
