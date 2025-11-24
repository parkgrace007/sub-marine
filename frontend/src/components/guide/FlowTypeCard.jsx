import React from 'react'

function FlowTypeCard({ type, direction, meaning, impact, description, color }) {
  const borderColorMap = {
    'success': 'border-success',
    'danger': 'border-danger',
    'warning': 'border-warning',
    'gray': 'border-surface-400'
  }

  const bgColorMap = {
    'success': 'bg-success/10',
    'danger': 'bg-danger/10',
    'warning': 'bg-warning/10',
    'gray': 'bg-surface-200'
  }

  return (
    <div className={`card p-5 border-l-4 ${borderColorMap[color] || 'border-surface-400'} ${bgColorMap[color] || 'bg-surface-100'}`}>
      <h4 className="text-lg font-bold text-surface-600 mb-2">{type}</h4>
      <p className="text-sm text-surface-500 font-mono mb-3 bg-surface-200 px-3 py-1 rounded inline-block">
        {direction}
      </p>
      <p className="text-sm text-surface-600 mb-2">{meaning}</p>
      <p className="text-sm font-semibold mb-3">{impact}</p>
      <p className="text-xs text-surface-500 leading-relaxed">{description}</p>
    </div>
  )
}

export default FlowTypeCard
