import fs from 'fs/promises';
import path from 'path';
import { Item } from './types';

interface Task {
  id: string;
  name: string;
  keyword: string;
  priceThreshold: number;
  minPrice?: number;
  enabled: boolean;
}

interface SentItems {
  [itemId: string]: {
    timestamp: string;
    price: number;
  }
}

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json');
const SENT_ITEMS_FILE = path.join(process.cwd(), 'data', 'sent_items.json');

export class DataManager {
  async getTasks(): Promise<Task[]> {
    try {
      const data = await fs.readFile(TASKS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading tasks:', error);
      return [];
    }
  }

  async getSentItems(): Promise<SentItems> {
    try {
      // Check if file exists
      try {
        await fs.access(SENT_ITEMS_FILE);
      } catch {
        await fs.writeFile(SENT_ITEMS_FILE, '{}');
        return {};
      }
      const data = await fs.readFile(SENT_ITEMS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
       console.error('Error reading sent items:', error);
       return {};
    }
  }

  async markAsSent(item: Item) {
    const sent = await this.getSentItems();
    sent[item.id] = {
      timestamp: new Date().toISOString(),
      price: item.price
    };
    await fs.writeFile(SENT_ITEMS_FILE, JSON.stringify(sent, null, 2));
  }

  async isSent(itemId: string): Promise<boolean> {
    const sent = await this.getSentItems();
    return !!sent[itemId];
  }

  // Cleanup old sent items (older than days)
  async cleanupOldData(days: number = 5) {
    const sent = await this.getSentItems();
    const now = new Date();
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    const newSent: SentItems = {};

    for (const [id, data] of Object.entries(sent)) {
      if (new Date(data.timestamp) > threshold) {
        newSent[id] = data;
      } else {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old records.`);
      await fs.writeFile(SENT_ITEMS_FILE, JSON.stringify(newSent, null, 2));
    }
  }
}
