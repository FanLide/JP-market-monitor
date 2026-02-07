import { PayPayScraper } from './scrapers/paypay';
import { TelegramNotifier } from './notifiers/telegram';
import { DataManager } from './data-manager';
import { config } from './config';
import { Item } from './types';

// Global Singleton
const scraper = new PayPayScraper();
const notifier = new TelegramNotifier();
const dataManager = new DataManager();

// Main Logic
async function runCycle() {
  const now = new Date();
  const hour = now.getHours();
  
  // Time Check (Japan Time)
  if (hour < 8 || hour >= 24) {
    console.log(`🌙 Sleeping... (Current hour: ${hour})`);
    return;
  }

  console.log(`⚡ Cycle Start: ${now.toLocaleTimeString()}`);
  
  // Get Tasks
  const tasks = await dataManager.getTasks();
  const enabledTasks = tasks.filter((t: any) => t.enabled);

  for (const task of enabledTasks) {
    // Dynamic Min Price Logic: Use config or fallback to Threshold - 15000 (Safer than 7000)
    // If you strictly want -7000, change 15000 to 7000 below.
    const minPrice = task.minPrice || (task.priceThreshold - 15000);
    
    console.log(`🔎 Checking: ${task.name} (${minPrice} < price < ${task.priceThreshold})`);
    
    try {
      // 1. Scrape
      const items = await scraper.scrape(task.keyword);
      
      // 2. Filter
      const bargains = items.filter((item: Item) => {
          if (item.price >= task.priceThreshold) return false;
          if (item.price < minPrice) return false;
          return true;
      });
      
      // 3. Process & Limit
      let sentCount = 0;
      const MAX_PUSH_PER_CYCLE = 5; // Limit per task per cycle

      for (const item of bargains) {
        if (sentCount >= MAX_PUSH_PER_CYCLE) break;
        
        if (await dataManager.isSent(item.id)) {
          continue; // Already sent
        }

        // Send Alert
        console.log(`📤 NEW! Sending alert for: ${item.title}`);
        await notifier.sendAlert(item);
        await dataManager.markAsSent(item); 
        sentCount++;
        
        // Anti-spam delay
        await new Promise(r => setTimeout(r, 2000));
      }

      console.log(`✅ ${task.name}: Found ${bargains.length} matches, Sent ${sentCount} (Limit: ${MAX_PUSH_PER_CYCLE}).`);
    
    } catch (e) {
      console.error(`❌ Error processing task ${task.name}:`, e);
    }
    
    // Delay between tasks
    await new Promise(r => setTimeout(r, 5000));
  }
  
  console.log('🏁 Cycle Complete. Waiting for next run...');
}

// Cleanup Task (Run daily at 2am, or check every cycle if needed)
async function cleanupTask() {
  console.log('🧹 Running Daily Cleanup...');
  await dataManager.cleanupOldData(5); // Keep 5 days
}

// Entry Point
async function main() {
  console.log('🚀 JapanMarketMonitor Service Started');
  console.log('🕒 Schedule: Every 5 minutes, 08:00 - 24:00 JST');
  
  // Run immediately on start
  await runCycle();

  // Schedule Loop (5 minutes = 300,000 ms)
  setInterval(() => {
    runCycle().catch(console.error);
  }, 5 * 60 * 1000);

  // Schedule Cleanup
  setInterval(() => {
      cleanupTask().catch(console.error);
  }, 24 * 60 * 60 * 1000);
}

// Handle Exit
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  await scraper.close();
  process.exit();
});

main();
