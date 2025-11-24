import React from 'react'

/**
 * VolumeSpine - RSI 라인에 붙어 움직이는 거래량 척추 그래프
 * 최근 24개 캔들의 거래량을 세로 막대 그래프로 표시 (상단=최신)
 *
 * @param {Array<Number>} history - 최근 24개 캔들의 거래량 배열 (오래된 순서)
 */
function VolumeSpine({ history = [] }) {
  // Validate history data
  if (!history || history.length === 0) {
    return null
  }

  // Reverse array to show latest data at top
  const reversedHistory = [...history].reverse()

  // Calculate max volume for relative width calculation
  const maxVolume = Math.max(...reversedHistory)

  // Avoid division by zero
  if (maxVolume === 0) {
    return null
  }

  return (
    <div className="absolute top-0 w-full h-full flex flex-col items-center justify-center gap-[4px] z-0 pointer-events-none">
      {reversedHistory.map((volume, index) => {
        // Calculate width as percentage of max (up to 150px max)
        const widthPercent = (volume / maxVolume) * 100

        // Calculate opacity gradient: top (latest) = 0.5, bottom (oldest) = 0.05
        // Linear interpolation from 0.5 to 0.05
        const opacityValue = 0.5 - (index / (reversedHistory.length - 1)) * (0.5 - 0.05)

        return (
          <div
            key={`spine-${index}`}
            className="h-[6px] bg-white rounded-full transition-all duration-500 max-w-[150px]"
            style={{
              width: `${widthPercent}%`,
              opacity: opacityValue
            }}
          />
        )
      })}
    </div>
  )
}

export default VolumeSpine
