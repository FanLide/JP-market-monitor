import { Telegraf } from 'telegraf';
import { config } from '../config';
import { Item } from '../types';

export class TelegramNotifier {
  private bot: Telegraf;

  constructor() {
    if (!config.telegram.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set!');
    }
    this.bot = new Telegraf(config.telegram.botToken);
  }

  // Helper to get Chat ID: You can run this once to find your ID
  async startPollingForChatId() {
    console.log('Bot is polling... Please send a message to the bot to get your Chat ID.');
    this.bot.on('text', (ctx) => {
      console.log(`Your Chat ID is: ${ctx.chat.id}`);
      ctx.reply(`Hello! Your Chat ID is: ${ctx.chat.id}. Please add this to your .env file.`);
    });
    await this.bot.launch();
  }

  async sendAlert(item: Item) {
    if (!config.telegram.chatId) {
      console.warn('Cannot send alert: TELEGRAM_CHAT_ID is missing.');
      return;
    }

    const message = `
🚨 <b>Deal Alert!</b> [${item.platform}]
<b>${item.title}</b>

💰 <b>${item.price.toLocaleString()} JPY</b>
🔗 <a href="${item.url}">View Item</a>
    `;

    try {
      // Send photo with caption
      if (item.imageUrl) {
        try {
            await this.bot.telegram.sendPhoto(config.telegram.chatId, item.imageUrl, {
            caption: message,
            parse_mode: 'HTML',
            });
        } catch (photoError) {
             console.warn('Failed to send photo, falling back to text message:', photoError);
             await this.bot.telegram.sendMessage(config.telegram.chatId, message, {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: false }
              });
        }
      } else {
        await this.bot.telegram.sendMessage(config.telegram.chatId, message, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: false }
        });
      }
      console.log(`Alert sent for: ${item.title}`);
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
    }
  }
}
