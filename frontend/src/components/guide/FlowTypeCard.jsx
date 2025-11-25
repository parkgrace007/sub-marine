import React from 'react'
import { useTranslation } from 'react-i18next'

function FlowTypeCard({ type, name, nameEn, direction, meaning, meaningEn, impact, impactEn, description, descriptionEn, color }) {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language === 'en' || i18n.language.startsWith('en-')

  const borderColorMap = {
    'success': 'border-success',
    'danger': 'border-danger',
    'warning': 'border-warning',
    'neutral': 'border-surface-400',
    'gray': 'border-surface-400'
  }

  const bgColorMap = {
    'success': 'bg-success/10',
    'danger': 'bg-danger/10',
    'warning': 'bg-warning/10',
    'neutral': 'bg-surface-200',
    'gray': 'bg-surface-200'
  }

  const displayName = isEnglish && nameEn ? nameEn : name
  const displayMeaning = isEnglish && meaningEn ? meaningEn : meaning
  const displayImpact = isEnglish && impactEn ? impactEn : impact
  const displayDescription = isEnglish && descriptionEn ? descriptionEn : description

  return (
    <div className={`card p-5 border-l-4 ${borderColorMap[color] || 'border-surface-400'} ${bgColorMap[color] || 'bg-surface-100'}`}>
      <h4 className="text-lg font-bold text-surface-600 mb-2">{displayName}</h4>
      <p className="text-sm text-surface-500 font-mono mb-3 bg-surface-200 px-3 py-1 rounded inline-block">
        {direction}
      </p>
      <p className="text-sm text-surface-600 mb-2">{displayMeaning}</p>
      <p className="text-sm font-semibold mb-3">{displayImpact}</p>
      <p className="text-xs text-surface-500 leading-relaxed">{displayDescription}</p>
    </div>
  )
}

export default FlowTypeCard
