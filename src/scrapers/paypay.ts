import { chromium, Browser, Page } from 'playwright';
import { Item } from '../types';

export class PayPayScraper {
  private browser: Browser | null = null;

  async init() {
    this.browser = await chromium.launch({
      headless: true, // Set to false to see the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrape(keyword: string): Promise<Item[]> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const url = `https://paypayfleamarket.yahoo.co.jp/search/${encodeURIComponent(keyword)}?open=1`; // open=1 usually means currently for sale
    console.log(`Navigating to: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000); // Wait for hydration

      // PayPay uses hydration, let's grab data from DOM
      // Selectors might change, so we try to be generic. 
      // Look for links that contain '/item/'
      const items: Item[] = await page.evaluate(() => {
        const results: any[] = [];
        const links = document.querySelectorAll('a[href^="/item/"]');
        
        links.forEach((link) => {
          const url = (link as HTMLAnchorElement).href;
          const id = url.split('/item/')[1]?.split('?')[0];
          
          // Try to find image
          const img = link.querySelector('img');
          const imageUrl = img?.src || '';
          const title = img?.alt || '';
          
          // Try to find price - usually nearby or inside
          // This is tricky without specific classes. Let's look for text starting with "¥" or ending with "円"
          const textContent = link.textContent || '';
          // Extract numbers from text content that look like price
          const priceMatch = textContent.match(/([0-9,]+)円/);
          let price = 0;
          if (priceMatch) {
            price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          } else {
             // Fallback: look for generic number regex if "円" is separate
             const numbers = textContent.replace(/,/g, '').match(/(\d{3,})/);
             if (numbers) price = parseInt(numbers[1], 10);
          }

          if (id && title && price > 0) {
            results.push({
              id,
              title,
              price,
              url,
              imageUrl,
              platform: 'PayPay',
              timestamp: new Date().toISOString() // String for transfer, parsed later
            });
          }
        });
        return results;
      });

      // Deduplicate by ID
      const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
      
      // Fix dates
      return uniqueItems.map(i => ({ ...i, timestamp: new Date(i.timestamp) }));

    } catch (e) {
      console.error('Error scraping PayPay:', e);
      return [];
    } finally {
      await context.close();
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
