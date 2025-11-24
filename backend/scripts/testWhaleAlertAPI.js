import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

(async () => {
  const apiKey = process.env.WHALE_ALERT_API_KEY;
  console.log('🔑 API Key loaded:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

  if (!apiKey) {
    console.log('❌ API key not found');
    return;
  }

  console.log('\n🔍 Fetching recent whale transactions from REST API...\n');

  try {
    const response = await axios.get('https://api.whale-alert.io/v1/transactions', {
      params: {
        api_key: apiKey,
        min_value: 10000000,
        limit: 10
      },
      timeout: 15000
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Transaction count:', response.data.transactions?.length || 0);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (response.data.transactions && response.data.transactions.length > 0) {
      response.data.transactions.forEach((tx, i) => {
        const date = new Date(tx.timestamp * 1000);
        const hoursAgo = ((Date.now() / 1000 - tx.timestamp) / 3600).toFixed(1);
        console.log(`${i+1}. ${tx.blockchain.toUpperCase()} - $${(tx.amount_usd / 1000000).toFixed(2)}M ${tx.symbol}`);
        console.log(`   Time: ${date.toLocaleString()} (${hoursAgo}h ago)`);
        console.log(`   From: ${tx.from.owner_type || 'unknown'} → To: ${tx.to.owner_type || 'unknown'}`);
        console.log();
      });

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 Analysis:');
      const mostRecent = response.data.transactions[0];
      const hoursAgo = ((Date.now() / 1000 - mostRecent.timestamp) / 3600).toFixed(1);
      console.log(`   Most recent: ${hoursAgo} hours ago`);
      console.log(`   WebSocket last message: ~6.7 hours ago`);

      if (hoursAgo > 1) {
        console.log('   ⚠️  Market has been quiet (no $10M+ txs recently)');
      } else {
        console.log('   🚨 WebSocket may be stuck - recent txs exist but not received!');
      }
    } else {
      console.log('⚠️  No transactions found with min_value=$10M');
      console.log('   This confirms the market is quiet.');
    }
  } catch (err) {
    console.log('❌ Error:', err.response?.status, err.response?.data || err.message);
  }
})();
