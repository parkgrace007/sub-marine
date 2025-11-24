#!/usr/bin/env node
/**
 * Analyze BB (Bollinger Bands) width statistics for each timeframe
 * This helps determine optimal visual width ratios for the frontend
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function analyzeBBWidth() {
  console.log('📊 BB Width Analysis Starting...\n')
  console.log('=' .repeat(80))

  const timeframes = ['1h', '4h', '8h', '12h', '1d']
  const results = {}

  for (const timeframe of timeframes) {
    console.log(`\n📈 Analyzing ${timeframe} timeframe...`)

    // Fetch recent BB data (last 1000 points or 7 days, whichever is less)
    const { data, error } = await supabase
      .from('market_sentiment')
      .select('bb_upper, bb_middle, bb_lower, created_at')
      .eq('symbol', 'COMBINED')
      .eq('timeframe', timeframe)
      .not('bb_middle', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error(`❌ Error fetching ${timeframe} data:`, error)
      continue
    }

    if (!data || data.length === 0) {
      console.log(`⚠️  No data found for ${timeframe}`)
      continue
    }

    // Calculate BB width statistics
    const widths = data
      .filter(d => d.bb_upper && d.bb_lower && d.bb_middle)
      .filter(d => d.bb_middle >= 80000 && d.bb_middle <= 110000) // Filter outliers
      .map(d => d.bb_upper - d.bb_lower)
      .filter(w => w > 1000 && w < 20000) // Valid width range

    if (widths.length === 0) {
      console.log(`⚠️  No valid BB width data for ${timeframe}`)
      continue
    }

    // Calculate statistics
    const stats = {
      count: widths.length,
      min: Math.min(...widths),
      max: Math.max(...widths),
      avg: widths.reduce((a, b) => a + b, 0) / widths.length,
      median: widths.sort((a, b) => a - b)[Math.floor(widths.length / 2)],
      stdDev: 0,
      p10: widths.sort((a, b) => a - b)[Math.floor(widths.length * 0.1)],
      p50: widths.sort((a, b) => a - b)[Math.floor(widths.length * 0.5)],
      p90: widths.sort((a, b) => a - b)[Math.floor(widths.length * 0.9)]
    }

    // Calculate standard deviation
    const variance = widths.reduce((sum, w) => sum + Math.pow(w - stats.avg, 2), 0) / widths.length
    stats.stdDev = Math.sqrt(variance)

    results[timeframe] = stats

    // Display statistics
    console.log(`  📊 Data points: ${stats.count}`)
    console.log(`  📉 Min width: $${stats.min.toFixed(0)}`)
    console.log(`  📈 Max width: $${stats.max.toFixed(0)}`)
    console.log(`  📊 Average: $${stats.avg.toFixed(0)}`)
    console.log(`  📊 Median: $${stats.median.toFixed(0)}`)
    console.log(`  📊 Std Dev: $${stats.stdDev.toFixed(0)}`)
    console.log(`  📊 10th percentile: $${stats.p10.toFixed(0)}`)
    console.log(`  📊 90th percentile: $${stats.p90.toFixed(0)}`)
  }

  // Calculate optimal visual ratios
  console.log('\n' + '='.repeat(80))
  console.log('📐 OPTIMAL VISUAL WIDTH RATIO CALCULATIONS\n')

  // Use 1h as baseline (smallest typical width)
  const baseline1h = results['1h']?.p50 || 3000

  console.log('Strategy: Make BB visually consistent across timeframes')
  console.log(`Baseline (1h median): $${baseline1h.toFixed(0)}\n`)

  const recommendations = {}

  for (const tf of timeframes) {
    if (!results[tf]) continue

    const median = results[tf].p50
    const p90 = results[tf].p90

    // Calculate ratio to maintain visual consistency
    // If we want 1h to use 40% of container, scale others proportionally
    const baseRatio = 0.40 // 1h target
    const scaleFactor = baseline1h / median
    const recommendedRatio = baseRatio * scaleFactor

    // Clamp to reasonable range
    const finalRatio = Math.min(0.6, Math.max(0.2, recommendedRatio))

    recommendations[tf] = {
      median: median,
      p90: p90,
      scaleFactor: scaleFactor,
      recommendedRatio: finalRatio
    }

    console.log(`${tf}:`)
    console.log(`  Median width: $${median.toFixed(0)}`)
    console.log(`  Scale factor: ${scaleFactor.toFixed(2)}x vs 1h`)
    console.log(`  Recommended ratio: ${(finalRatio * 100).toFixed(0)}%`)
    console.log(`  → BB will appear ~${(median * finalRatio / baseline1h * 100).toFixed(0)}% as wide as 1h\n`)
  }

  // Generate config code
  console.log('='.repeat(80))
  console.log('📝 GENERATED CONFIG CODE\n')
  console.log('// Add to frontend/src/config/bbConfig.js:')
  console.log('export const BB_CONFIG = {')

  for (const tf of timeframes) {
    if (!recommendations[tf]) continue
    const r = recommendations[tf]
    console.log(`  '${tf}': {`)
    console.log(`    visualWidthRatio: ${r.recommendedRatio.toFixed(2)},`)
    console.log(`    expectedMedianWidth: ${r.median.toFixed(0)},`)
    console.log(`    expected90thWidth: ${r.p90.toFixed(0)}`)
    console.log(`  },`)
  }
  console.log('}')

  console.log('\n' + '='.repeat(80))
  console.log('✅ Analysis Complete!\n')

  // Summary table
  console.log('SUMMARY TABLE:')
  console.log('┌─────────┬──────────┬──────────┬──────────┬────────────┐')
  console.log('│ TF      │ Min      │ Median   │ Max      │ Ratio      │')
  console.log('├─────────┼──────────┼──────────┼──────────┼────────────┤')

  for (const tf of timeframes) {
    if (!results[tf]) continue
    const s = results[tf]
    const r = recommendations[tf]
    console.log(
      `│ ${tf.padEnd(7)} │ ` +
      `$${s.min.toFixed(0).padStart(7)} │ ` +
      `$${s.median.toFixed(0).padStart(7)} │ ` +
      `$${s.max.toFixed(0).padStart(7)} │ ` +
      `${(r.recommendedRatio * 100).toFixed(0).padStart(9)}% │`
    )
  }
  console.log('└─────────┴──────────┴──────────┴──────────┴────────────┘')

  process.exit(0)
}

// Run the analysis
analyzeBBWidth().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})