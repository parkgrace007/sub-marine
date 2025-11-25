import React, { useState, useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * DeepDiveReport - Market Briefing Display Component
 *
 * Displays AI-generated market analysis from Claude
 * Supports bilingual content (Korean/English)
 * Updates every 6 hours (00:00, 06:00, 12:00, 18:00)
 *
 * Now uses Backend API instead of direct Supabase calls
 */
function DeepDiveReport({ className = '' }) {
  const { t, i18n } = useTranslation()
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const eventSourceRef = useRef(null)
  const isMountedRef = useRef(true)
  const reconnectTimeoutRef = useRef(null)

  // Fetch latest briefing from Backend API
  const fetchLatestBriefing = async () => {
    try {
      setLoading(true)
      console.log('📰 [DeepDiveReport] Fetching briefing via Backend API...')

      const response = await fetch(`${API_URL}/api/briefings/latest`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch briefing')
      }

      // Only update state if still mounted
      if (isMountedRef.current) {
        // json.data can be null if no briefings exist yet
        setBriefing(json.data)
        setError(null)
        console.log(`✅ [DeepDiveReport] Loaded briefing in ${json.queryTime}ms`)
      }
    } catch (err) {
      console.error('❌ [DeepDiveReport] Error fetching briefing:', err)
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Connect to SSE for real-time updates
  const connectSSE = () => {
    // Don't connect if unmounted
    if (!isMountedRef.current) return

    console.log('🔴 [SSE/DeepDiveReport] Connecting to briefing stream...')

    const eventSource = new EventSource(`${API_URL}/api/briefings/stream`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', () => {
      console.log('✅ [SSE/DeepDiveReport] Connected to briefing stream')
    })

    eventSource.addEventListener('briefing', (event) => {
      try {
        const newBriefing = JSON.parse(event.data)
        console.log('📰 [SSE/DeepDiveReport] New briefing received')
        if (isMountedRef.current) {
          setBriefing(newBriefing)
        }
      } catch (e) {
        console.error('❌ [SSE/DeepDiveReport] Parse error:', e)
      }
    })

    eventSource.addEventListener('ping', () => {
      // Heartbeat received
    })

    eventSource.onerror = (err) => {
      console.error('❌ [SSE/DeepDiveReport] Error:', err)

      // Close current connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Only reconnect if still mounted
      if (isMountedRef.current) {
        console.log('🔄 [SSE/DeepDiveReport] Reconnecting in 5s...')
        reconnectTimeoutRef.current = setTimeout(connectSSE, 5000)
      }
    }
  }

  // Set up on mount
  useEffect(() => {
    isMountedRef.current = true

    // Initial fetch, then connect SSE after fetch completes
    const initializeData = async () => {
      await fetchLatestBriefing()
      // Only connect SSE after initial fetch completes to avoid race condition
      if (isMountedRef.current) {
        connectSSE()
      }
    }

    initializeData()

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  // Format timestamp based on current language
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'
    return date.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get content based on current language
  const getBriefingContent = () => {
    if (!briefing) return null

    // Use content_en for English, content for Korean (default)
    if (i18n.language === 'en' && briefing.content_en) {
      return briefing.content_en
    }
    return briefing.content
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
          <span className="text-xs font-bold text-surface-600 tracking-wider">{t('briefing.title')}</span>
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
              <span className="text-xs">{t('briefing.loading')}</span>
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
            <span className="text-xs">{t('briefing.noData')}</span>
            <span className="text-xs text-surface-400">{t('briefing.nextUpdate')}: {t('briefing.schedule')}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Briefing Sections */}
            <div className="space-y-3">
              {parseBriefingContent(getBriefingContent()).map((section, index) => (
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
