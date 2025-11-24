import whaleAlertService from '../src/services/whaleAlert.js'

console.log('🐋 Whale Alert WebSocket Test\n')
console.log('━'.repeat(60))

// Connect to WebSocket
console.log('\n📡 Starting WebSocket connection...')
whaleAlertService.connect()

// Log status every 10 seconds
const statusInterval = setInterval(() => {
  const status = whaleAlertService.getStatus()
  console.log('\n📊 Status Update:')
  console.log(`   Connected: ${status.connected ? '✅' : '❌'}`)
  console.log(`   Alerts this hour: ${status.alertsThisHour}/100`)
  console.log(`   Next reset: ${new Date(status.nextReset).toLocaleTimeString()}`)
  console.log(`   Reconnect attempts: ${status.reconnectAttempts}`)
}, 10000)

// Run for 5 minutes then exit
const testDuration = 5 * 60 * 1000 // 5 minutes
console.log(`\n⏱️  Test will run for ${testDuration / 1000} seconds`)
console.log('   Waiting for whale alerts...\n')
console.log('━'.repeat(60))

setTimeout(() => {
  console.log('\n\n━'.repeat(60))
  console.log('⏹️  Test completed!')
  const finalStatus = whaleAlertService.getStatus()
  console.log('\n📊 Final Statistics:')
  console.log(`   Total alerts received: ${finalStatus.alertsThisHour}`)
  console.log(`   Connection stable: ${finalStatus.connected ? 'Yes ✅' : 'No ❌'}`)

  clearInterval(statusInterval)
  whaleAlertService.disconnect()

  console.log('\n✅ WebSocket test finished\n')
  process.exit(0)
}, testDuration)

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user')
  clearInterval(statusInterval)
  whaleAlertService.disconnect()
  console.log('✅ Disconnected cleanly\n')
  process.exit(0)
})
