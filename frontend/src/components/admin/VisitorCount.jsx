/**
 * VisitorCount - 헤더용 실시간 접속자 수 (작은 버전)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Users } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function VisitorCount() {
  const [count, setCount] = useState(null)
  const [error, setError] = useState(false)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/visitors/count`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setCount(data.count)
      setError(false)
    } catch (err) {
      setError(true)
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 10000) // 10초마다 갱신
    return () => clearInterval(interval)
  }, [fetchCount])

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-surface-500 text-sm">
        <Users className="w-4 h-4" />
        <span>-</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <Users className="w-4 h-4 text-green-400" />
      </div>
      <span className="text-white font-medium">{count ?? '-'}</span>
      <span className="text-surface-400 text-xs">online</span>
    </div>
  )
}
