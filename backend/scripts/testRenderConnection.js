#!/usr/bin/env node

/**
 * DIAGNOSTIC SCRIPT (2025-11-24)
 * Test Supabase REST API connection from Render environment
 *
 * This script tests the exact same query that useWhaleData.js makes
 * to isolate whether the timeout is network/API related
 *
 * Usage:
 *   Local: node backend/scripts/testRenderConnection.js
 *   Render Shell: node scripts/testRenderConnection.js
 */

const https = require('https')
const { performance } = require('perf_hooks')

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅ Present' : '❌ Missing')
  console.error('   ANON_KEY:', ANON_KEY ? '✅ Present' : '❌ Missing')
  process.exit(1)
}

console.log('🔍 DIAGNOSTIC: Testing Supabase REST API Connection')
console.log('=' .repeat(60))
console.log('Environment:')
console.log('   SUPABASE_URL:', SUPABASE_URL)
console.log('   ANON_KEY:', ANON_KEY.substring(0, 20) + '...')
console.log('=' .repeat(60))

// Build query parameters (matching useWhaleData.js logic)
const timeframeDuration = 3600000 // 1 hour in ms
const bufferMultiplier = 2
const fetchWindow = timeframeDuration * bufferMultiplier
const cutoffTimestamp = Math.floor((Date.now() - fetchWindow) / 1000)

const queryParams = new URLSearchParams({
  select: 'id,timestamp,symbol,amount_usd,flow_type,blockchain,from_owner_type,to_owner_type,from_address,to_address',
  timestamp: `gte.${cutoffTimestamp}`,
  amount_usd: 'gte.10000000',
  flow_type: 'in.(inflow,outflow)',
  order: 'timestamp.desc',
  limit: '500'
})

const apiUrl = `${SUPABASE_URL}/rest/v1/whale_events?${queryParams.toString()}`

console.log('\n📡 Request Details:')
console.log('   Method: GET')
console.log('   URL:', apiUrl)
console.log('   Headers:')
console.log('      apikey:', ANON_KEY.substring(0, 20) + '...')
console.log('      Authorization: Bearer ' + ANON_KEY.substring(0, 20) + '...')
console.log('=' .repeat(60))

const startTime = performance.now()

const request = https.get(apiUrl, {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
}, (res) => {
  const duration = performance.now() - startTime
  console.log(`\n✅ Response received in ${duration.toFixed(0)}ms`)
  console.log('   Status:', res.statusCode)
  console.log('   Headers:', JSON.stringify(res.headers, null, 2))

  let data = ''

  res.on('data', (chunk) => {
    data += chunk
    console.log(`   Received ${data.length} bytes so far...`)
  })

  res.on('end', () => {
    const totalDuration = performance.now() - startTime
    console.log(`\n✅ Request completed in ${totalDuration.toFixed(0)}ms`)
    console.log(`   Total data size: ${data.length} bytes`)

    try {
      const parsed = JSON.parse(data)
      console.log(`   Records received: ${parsed.length}`)
      console.log(`\n📊 Sample Record:`)
      console.log(JSON.stringify(parsed[0], null, 2))

      console.log('\n' + '='.repeat(60))
      console.log('🎉 SUCCESS: Supabase REST API is working!')
      console.log('   Query time:', totalDuration.toFixed(0) + 'ms')
      console.log('   Records:', parsed.length)
      console.log('   Data size:', (data.length / 1024).toFixed(2) + 'KB')
      console.log('=' .repeat(60))
    } catch (err) {
      console.error('❌ Failed to parse JSON response:', err.message)
      console.error('   Raw data:', data.substring(0, 500))
    }
  })
})

request.on('timeout', () => {
  const duration = performance.now() - startTime
  console.error(`\n❌ REQUEST TIMEOUT after ${duration.toFixed(0)}ms`)
  console.error('   This indicates a network or API layer issue')
  request.destroy()
  process.exit(1)
})

request.on('error', (err) => {
  const duration = performance.now() - startTime
  console.error(`\n❌ REQUEST ERROR after ${duration.toFixed(0)}ms`)
  console.error('   Error name:', err.name)
  console.error('   Error message:', err.message)
  console.error('   Error code:', err.code)
  console.error('   Error stack:', err.stack)
  process.exit(1)
})

console.log('\n⏳ Waiting for response (30s timeout)...')
