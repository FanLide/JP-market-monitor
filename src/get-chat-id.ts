import { TelegramNotifier } from './notifiers/telegram';

// Quick script to find Chat ID
async function main() {
  const notifier = new TelegramNotifier();
  await notifier.startPollingForChatId();
}

main().catch(console.error);
