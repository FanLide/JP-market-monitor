import { PayPayScraper } from './scrapers/paypay';
import { TelegramNotifier } from './notifiers/telegram';
import { config } from './config';
import { Item } from './types';

async function main() {
  console.log('-------------------------------------------');
  console.log(`🚀 JapanMarketMonitor MVP Started`);
  console.log(`🎯 Keyword: ${config.scraper.keyword}`);
  console.log(`💰 Threshold: < ${config.scraper.priceThreshold} JPY`);
  console.log('-------------------------------------------');

  const scraper = new PayPayScraper();
  const notifier = new TelegramNotifier();

  try {
    // 1. Scrape items
    console.log('🔍 Scraping PayPay...');
    const items = await scraper.scrape(config.scraper.keyword);
    console.log(`✅ Found ${items.length} items total.`);

    // 2. Filter for bargains
    const bargains = items.filter(item => item.price < config.scraper.priceThreshold);
    console.log(`💎 Found ${bargains.length} bargains under ${config.scraper.priceThreshold} JPY.`);

    // 3. Send notifications (Limit to first 3 to avoid spamming while testing)
    // In production, we would check if we already sent this item ID.
    const limit = 3; 
    let sentCount = 0;

    for (const item of bargains) {
      if (sentCount >= limit) break;
      
      console.log(`📤 Sending alert for: ${item.title} (${item.price} JPY)`);
      await notifier.sendAlert(item);
      sentCount++;
      
      // Wait a bit between messages to be nice to Telegram API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (bargains.length > limit) {
      console.log(`... and ${bargains.length - limit} more items were found but not sent (spam protection).`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await scraper.close();
    console.log('🏁 Task completed.');
    process.exit(0);
  }
}

main();
