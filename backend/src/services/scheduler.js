import cron from 'node-cron'
import alertSystem from './alertSystem.js'
import briefingService from './briefingService.js'
import { getNewsAPIData } from './newsapi.js'
import { supabase } from '../utils/supabase.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Scheduler Service
 * Manages automated cron jobs for alert monitoring and database cleanup
 *
 * Jobs:
 * 1. ALERT_System Monitoring (every 1 minute)
 * 2. Market Briefing (every 4 hours at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
 * 3. News Refresh (every 3 hours at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
 * 4. Database Cleanup (daily at 3:00 AM)
 */
class SchedulerService {
  constructor() {
    this.jobs = []
    this.isRunning = false
    this.alertMonitoringInterval = null
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduler already running')
      return
    }

    console.log('⏰ Starting scheduler...')

    // Job 1: Market Briefing (every 4 hours at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    const briefingJob = cron.schedule('0 0,4,8,12,16,20 * * *', async () => {
      await this.runMarketBriefing()
    })

    this.jobs.push({ name: 'Market Briefing', job: briefingJob })
    console.log(`   Market Briefing: Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)`)

    // Job 2: News Refresh (every 3 hours)
    const newsRefreshJob = cron.schedule('0 */3 * * *', async () => {
      await this.runNewsRefresh()
    })

    this.jobs.push({ name: 'News Refresh', job: newsRefreshJob })
    console.log(`   News Refresh: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)`)

    // Job 3: Database Cleanup (daily at 3:00 AM)
    const cleanupJob = cron.schedule('0 3 * * *', async () => {
      await this.runDatabaseCleanup()
    })

    this.jobs.push({ name: 'Database Cleanup', job: cleanupJob })
    console.log(`   Database cleanup: Daily at 3:00 AM`)

    // Job 4: ALERT_System Monitoring (every 1 minute)
    console.log('   Starting ALERT_System monitoring...')
    this.startAlertMonitoring()
    console.log(`   Alert monitoring: Every 1 minute`)

    this.isRunning = true
    console.log(`\n✅ Scheduler started with ${this.jobs.length} jobs + Alert monitoring\n`)

    // Run initial alert check
    setTimeout(() => {
      console.log('🚨 Running initial alert system check...\n')
      this.runAlertCheck()
    }, 5000) // Wait 5 seconds for services to initialize
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    console.log('⏰ Stopping scheduler...')

    this.jobs.forEach(({ name, job }) => {
      job.stop()
      console.log(`   ✓ Stopped: ${name}`)
    })

    // Stop alert monitoring
    if (this.alertMonitoringInterval) {
      clearInterval(this.alertMonitoringInterval)
      console.log(`   ✓ Stopped: Alert Monitoring`)
    }

    this.jobs = []
    this.isRunning = false

    console.log('✅ Scheduler stopped')
  }

  /**
   * Start ALERT_System monitoring
   * Runs every 1 minute to check for trading signals
   */
  startAlertMonitoring() {
    // Use setInterval for sub-cron precision
    this.alertMonitoringInterval = setInterval(async () => {
      await this.runAlertCheck()
    }, 60000) // Every 60 seconds (1 minute)
  }

  /**
   * Run ALERT_System check
   */
  async runAlertCheck() {
    try {
      const startTime = Date.now()
      console.log(`\n🚨 [${new Date().toLocaleTimeString()}] Checking for trading alerts...`)

      // Check all signals
      const alerts = await alertSystem.checkAllSignals()

      const duration = Date.now() - startTime

      if (alerts.length > 0) {
        console.log(`📢 Found ${alerts.length} new alerts:`)
        alerts.forEach(alert => {
          const icon = alert.tier === 'S' ? '🔴' :
                       alert.tier === 'A' ? '🟠' :
                       alert.tier === 'B' ? '🟡' :
                       '⚪'
          console.log(`   ${icon} [${alert.tier}] ${alert.message}`)
        })
      } else {
        console.log(`   No new alerts (checked in ${duration}ms)`)
      }
    } catch (error) {
      console.error('❌ Alert check failed:', error.message)
    }
  }

  /**
   * Market Briefing Job
   * Generates AI-powered market analysis every 4 hours
   */
  async runMarketBriefing() {
    const startTime = Date.now()

    try {
      console.log('\n━'.repeat(30))
      console.log(`📰 [${new Date().toLocaleTimeString()}] Market Briefing Job Started`)
      console.log('━'.repeat(30))

      await briefingService.generateBriefing()

      const duration = Date.now() - startTime
      console.log(`\n✅ Market briefing completed in ${duration}ms`)
      console.log('━'.repeat(30) + '\n')
    } catch (error) {
      console.error('\n❌ Market briefing job failed:', error.message)
      console.error('   Stack:', error.stack)
      console.log('━'.repeat(30) + '\n')
    }
  }

  /**
   * News Refresh Job
   * Fetches latest crypto news from NewsAPI.org (last 6 hours)
   * Runs every 3 hours to keep news ultra-fresh
   */
  async runNewsRefresh() {
    const startTime = Date.now()

    try {
      console.log('\n━'.repeat(30))
      console.log(`📰 [${new Date().toLocaleTimeString()}] News Refresh Job Started`)
      console.log('━'.repeat(30))

      const data = await getNewsAPIData(true) // Force refresh

      const duration = Date.now() - startTime
      const articleCount = data.totalResults || 0

      console.log(`\n✅ News refresh completed in ${duration}ms`)
      console.log(`   Fetched ${articleCount} fresh articles (last 6 hours)`)
      console.log('━'.repeat(30) + '\n')
    } catch (error) {
      console.error('\n❌ News refresh job failed:', error.message)
      console.error('   Stack:', error.stack)
      console.log('━'.repeat(30) + '\n')
    }
  }

  /**
   * Database Cleanup Job
   * Deletes old whale events to stay within Supabase free tier limits
   *
   * Retention policy:
   * - whale_events: Keep 30 days
   */
  async runDatabaseCleanup() {
    const startTime = Date.now()

    try {
      console.log('\n━'.repeat(30))
      console.log(`🗑️  [${new Date().toLocaleTimeString()}] Database Cleanup Job Started`)
      console.log('━'.repeat(30))

      // Delete whale_events older than 30 days
      const whaleEventsCutoff = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)

      const { count: whaleEventsDeleted, error: whaleError } = await supabase
        .from('whale_events')
        .delete({ count: 'exact' })
        .lt('timestamp', whaleEventsCutoff)

      if (whaleError) {
        console.error('   ❌ Error deleting whale_events:', whaleError.message)
      } else {
        const deleted = whaleEventsDeleted || 0
        if (deleted > 0) {
          console.log(`   ✓ Deleted ${deleted} old whale_events (>30d)`)
        } else {
          console.log(`   ✓ No old whale_events to delete`)
        }
      }

      const duration = Date.now() - startTime
      console.log(`\n✅ Database cleanup completed in ${duration}ms`)
      console.log('━'.repeat(30) + '\n')
    } catch (error) {
      console.error('\n❌ Database cleanup job failed:', error.message)
      console.error('   Stack:', error.stack)
      console.log('━'.repeat(30) + '\n')
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length,
      jobs: this.jobs.map(({ name }) => name),
      alertMonitoring: this.alertMonitoringInterval !== null
    }
  }
}

export default new SchedulerService()
