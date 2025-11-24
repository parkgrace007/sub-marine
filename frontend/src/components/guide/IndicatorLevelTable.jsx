import React from 'react'

function IndicatorLevelTable({ levels, title, type = 'default' }) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-surface-600 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-surface-300 bg-surface-200">
              <th className="text-left p-3 font-semibold text-surface-600">Level</th>
              <th className="text-left p-3 font-semibold text-surface-600">범위</th>
              <th className="text-left p-3 font-semibold text-surface-600">이름</th>
              <th className="text-left p-3 font-semibold text-surface-600">설명</th>
              <th className="text-left p-3 font-semibold text-surface-600">전략</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, index) => (
              <tr
                key={level.level || index}
                className="border-b border-surface-200 hover:bg-surface-100 transition-colors"
              >
                <td className="p-3">
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm shadow-sm"
                    style={{
                      backgroundColor: level.color,
                      color: level.color === '#808080' || level.color === '#FFA500' ? '#fff' : '#000'
                    }}
                  >
                    {level.level}
                  </div>
                </td>
                <td className="p-3">
                  <code className="text-sm bg-surface-200 px-2 py-1 rounded font-mono">
                    {level.range}
                  </code>
                </td>
                <td className="p-3 font-semibold text-surface-600">{level.name}</td>
                <td className="p-3 text-sm text-surface-500">{level.description}</td>
                <td className="p-3 text-sm text-surface-600">{level.strategy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IndicatorLevelTable
