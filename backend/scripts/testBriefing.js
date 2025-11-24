/**
 * 🧪 Test Market Briefing System
 *
 * Manually trigger a briefing generation to test the system
 */

import briefingService from '../src/services/briefingService.js'

async function test() {
  console.log('🧪 Testing Market Briefing System\n')
  console.log('='.repeat(60))

  try {
    const result = await briefingService.generateBriefing()
    console.log('='.repeat(60))
    console.log('\n✅ Test completed successfully!')
    console.log('\n📊 Briefing ID:', result.id)
    console.log('🕐 Created at:', new Date(result.created_at).toLocaleString('ko-KR'))

    process.exit(0)
  } catch (error) {
    console.log('='.repeat(60))
    console.error('\n❌ Test failed:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

test()
