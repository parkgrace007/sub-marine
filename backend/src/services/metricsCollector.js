/**
 * Metrics Collector Service
 * Collects and stores system metrics, API call stats, and errors
 * Data is stored in-memory (last 24 hours)
 */

import os from 'os'

class MetricsCollector {
  constructor() {
    // System metrics (circular buffer)
    this.systemMetrics = []
    this.maxSystemMetrics = 1440  // 24 hours at 1-minute intervals

    // API call statistics
    this.apiCalls = []
    this.maxApiCalls = 10000  // Last 10,000 API calls

    // Error logs
    this.errors = []
    this.maxErrors = 1000  // Last 1,000 errors

    // Service status cache
    this.serviceStatus = {}

    // Aggregated stats (hourly, daily)
    this.aggregatedStats = {
      hourly: {},  // Last 24 hours
      daily: {}    // Last 30 days
    }

    // Start periodic system metrics collection
    this.startMetricsCollection()

    console.log('📊 [Metrics] Metrics collector initialized')
  }

  // ===== SYSTEM METRICS =====

  startMetricsCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics()
    }, 60 * 1000)  // 60 seconds

    // Immediate collection
    this.collectSystemMetrics()
  }

  collectSystemMetrics() {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const cpus = os.cpus()
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
      const idle = cpu.times.idle
      return acc + ((total - idle) / total)
    }, 0) / cpus.length

    const metric = {
      timestamp: Date.now(),
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: (usedMem / totalMem) * 100
      },
      cpu: {
        usage: cpuUsage * 100,
        cores: cpus.length
      },
      uptime: process.uptime()
    }

    this.systemMetrics.push(metric)

    // Keep only last 24 hours
    if (this.systemMetrics.length > this.maxSystemMetrics) {
      this.systemMetrics.shift()
    }
  }

  getSystemMetrics(minutes = 60) {
    // Return last N minutes of system metrics
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.systemMetrics.filter(m => m.timestamp >= cutoff)
  }

  getCurrentSystemMetrics() {
    return this.systemMetrics[this.systemMetrics.length - 1] || {}
  }

  // ===== API CALL TRACKING =====

  trackApiCall(req, res, duration) {
    const call = {
      timestamp: Date.now(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,  // milliseconds
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    }

    this.apiCalls.push(call)

    // Keep only last 10,000 calls
    if (this.apiCalls.length > this.maxApiCalls) {
      this.apiCalls.shift()
    }

    // Update aggregated stats
    this.updateAggregatedStats(call)
  }

  getApiCallStats(minutes = 60) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    const recentCalls = this.apiCalls.filter(c => c.timestamp >= cutoff)

    // Aggregate by endpoint
    const byEndpoint = {}
    const byStatus = {}
    let totalDuration = 0

    recentCalls.forEach(call => {
      // By endpoint
      if (!byEndpoint[call.path]) {
        byEndpoint[call.path] = { count: 0, avgDuration: 0, errors: 0 }
      }
      byEndpoint[call.path].count++
      byEndpoint[call.path].avgDuration += call.duration
      if (call.statusCode >= 400) byEndpoint[call.path].errors++

      // By status code
      if (!byStatus[call.statusCode]) {
        byStatus[call.statusCode] = 0
      }
      byStatus[call.statusCode]++

      totalDuration += call.duration
    })

    // Calculate averages
    Object.keys(byEndpoint).forEach(path => {
      byEndpoint[path].avgDuration /= byEndpoint[path].count
    })

    return {
      total: recentCalls.length,
      avgDuration: recentCalls.length > 0 ? totalDuration / recentCalls.length : 0,
      byEndpoint,
      byStatus,
      successRate: recentCalls.length > 0
        ? (recentCalls.filter(c => c.statusCode < 400).length / recentCalls.length) * 100
        : 100
    }
  }

  updateAggregatedStats(call) {
    const hour = new Date(call.timestamp).toISOString().slice(0, 13)  // YYYY-MM-DDTHH
    const day = new Date(call.timestamp).toISOString().slice(0, 10)   // YYYY-MM-DD

    // Hourly
    if (!this.aggregatedStats.hourly[hour]) {
      this.aggregatedStats.hourly[hour] = { total: 0, errors: 0, duration: 0 }
    }
    this.aggregatedStats.hourly[hour].total++
    this.aggregatedStats.hourly[hour].duration += call.duration
    if (call.statusCode >= 400) this.aggregatedStats.hourly[hour].errors++

    // Daily
    if (!this.aggregatedStats.daily[day]) {
      this.aggregatedStats.daily[day] = { total: 0, errors: 0, duration: 0 }
    }
    this.aggregatedStats.daily[day].total++
    this.aggregatedStats.daily[day].duration += call.duration
    if (call.statusCode >= 400) this.aggregatedStats.daily[day].errors++

    // Cleanup old entries (keep last 24 hours for hourly, last 30 days for daily)
    const now = Date.now()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString().slice(0, 13)
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    Object.keys(this.aggregatedStats.hourly).forEach(hour => {
      if (hour < oneDayAgo) delete this.aggregatedStats.hourly[hour]
    })

    Object.keys(this.aggregatedStats.daily).forEach(day => {
      if (day < thirtyDaysAgo) delete this.aggregatedStats.daily[day]
    })
  }

  getAggregatedStats() {
    return this.aggregatedStats
  }

  // ===== ERROR TRACKING =====

  trackError(error, context = {}) {
    const errorLog = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      context
    }

    this.errors.push(errorLog)

    // Keep only last 1,000 errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    console.error('❌ [Metrics] Error tracked:', error.message)
  }

  getErrors(minutes = 60) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.errors.filter(e => e.timestamp >= cutoff)
  }

  getErrorStats(minutes = 60) {
    const recentErrors = this.getErrors(minutes)

    // Group by error message
    const byMessage = {}
    recentErrors.forEach(err => {
      if (!byMessage[err.message]) {
        byMessage[err.message] = { count: 0, lastOccurred: 0 }
      }
      byMessage[err.message].count++
      byMessage[err.message].lastOccurred = Math.max(
        byMessage[err.message].lastOccurred,
        err.timestamp
      )
    })

    return {
      total: recentErrors.length,
      byMessage,
      mostFrequent: Object.entries(byMessage)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
    }
  }

  // ===== SERVICE STATUS =====

  updateServiceStatus(serviceName, status) {
    this.serviceStatus[serviceName] = {
      ...status,
      lastUpdated: Date.now()
    }
  }

  getServiceStatus(serviceName) {
    return this.serviceStatus[serviceName] || null
  }

  getAllServiceStatus() {
    return this.serviceStatus
  }

  // ===== EXPORT/SUMMARY =====

  getSummary() {
    const now = Date.now()
    const recentApiCalls = this.getApiCallStats(60)
    const recentErrors = this.getErrorStats(60)
    const currentSystem = this.getCurrentSystemMetrics()

    return {
      timestamp: now,
      system: currentSystem,
      apiCalls: {
        lastHour: recentApiCalls.total,
        avgResponseTime: Math.round(recentApiCalls.avgDuration),
        successRate: Math.round(recentApiCalls.successRate * 100) / 100
      },
      errors: {
        lastHour: recentErrors.total,
        topErrors: recentErrors.mostFrequent.slice(0, 3)
      },
      services: this.serviceStatus
    }
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector()

export default metricsCollector
