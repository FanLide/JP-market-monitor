import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  scraper: {
    keyword: process.env.SEARCH_KEYWORD || 'PlayStation 5',
    priceThreshold: parseInt(process.env.PRICE_THRESHOLD || '50000', 10),
  },
  proxy: process.env.PROXY_URL,
};
