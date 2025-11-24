import React, { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { supabase } from '../utils/supabase'

/**
 * DeepDiveReport - Market Briefing Display Component
 *
 * Displays AI-generated market analysis from Claude
 * Updates every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
 * Data source: market_briefings table
 */
function DeepDiveReport({ className = '' }) {
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch latest briefing
  const fetchLatestBriefing = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('market_briefings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows found - this is okay, just no briefings yet
          setBriefing(null)
          setError(null)
        } else {
          throw fetchError
        }
      } else {
        setBriefing(data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching briefing:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    // Initial fetch
    fetchLatestBriefing()

    // Subscribe to INSERT events
    const channel = supabase
      .channel('market_briefings_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_briefings'
        },
        (payload) => {
          console.log('📰 New briefing received:', payload.new)
          setBriefing(payload.new)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Parse briefing content (split by emoji sections)
  const parseBriefingContent = (content) => {
    if (!content) return []

    const lines = content.split('\n').filter(line => line.trim())
    const sections = []
    let currentSection = null

    lines.forEach(line => {
      // Check if line starts with an emoji (section header)
      if (/^[📉🔥🔭]/.test(line)) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: line.trim(),
          content: []
        }
      } else if (currentSection) {
        currentSection.content.push(line.trim())
      }
    })

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  return (
    <div className={`flex flex-col bg-surface-200 border border-surface-300 rounded-md overflow-hidden shadow-sm ${className}`}>
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-200 border-b border-surface-300">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-surface-500" />
          <span className="text-xs font-bold text-surface-600 tracking-wider">DEEP DIVE REPORT</span>
        </div>
        <div className="flex items-center gap-2">
          {briefing && (
            <span className="text-xs text-surface-500">
              {formatTime(briefing.created_at)}
            </span>
          )}
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success/20 border border-success/50" />
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex-1 p-4 overflow-y-auto bg-surface-100 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-surface-500">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin">⚡</div>
              <span className="text-xs">Loading briefing...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-danger opacity-70">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="text-xs">{error}</span>
            </div>
          </div>
        ) : !briefing ? (
          <div className="h-full flex flex-col items-center justify-center text-surface-500 opacity-50 gap-2">
            <span className="text-xl">📊</span>
            <span className="text-xs">No briefings yet</span>
            <span className="text-xs text-surface-400">Next: 00:00, 04:00, 08:00, 12:00, 16:00, or 20:00</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Briefing Sections */}
            <div className="space-y-3">
              {parseBriefingContent(briefing.content).map((section, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-sm font-bold text-surface-700 flex items-center gap-2">
                    {section.title}
                  </div>
                  <div className="text-xs text-surface-600 leading-relaxed pl-4">
                    {section.content.join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeepDiveReport
