import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const configService = new ConfigService();

function formatDateUzbek(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface OrderTelegramData {
  name: string;
  phone: string;
  comment: string;
  regionName: string;
  lon: number;
  lat: number;
  workerArriveDate: string;
  endedjobDate: string;
  rooms: { name: string; key: string; value: string }[];
}

function createTelegramMessageText(
  title: string,
  data: OrderTelegramData,
): string {
  const locationLink = `https://yandex.com/maps/?ll=${data.lon},${data.lat}&z=16&rtext=~${data.lat},${data.lon}&rtt=auto`;
  ``;

  const roomDetails = data.rooms
    .map(
      (room, idx) =>
        `🛋️ <b>Xona ${idx + 1}:</b> ${room.name} — <i>${room.key}:</i> ${room.value}`,
    )
    .join('\n');

  return `
${title}

👤 <b>Mijoz:</b> ${data.name}
📞 <b>Telefon raqami:</b> ${data.phone}
📍 <b>Hudud:</b> ${data.regionName}
💬 <b>Izoh:</b> ${data.comment}

🚚 <b>Usta kelish sanasi:</b> ${formatDateUzbek(data.workerArriveDate)}
🛠️ <b>Ish tugash sanasi:</b> ${formatDateUzbek(data.endedjobDate)}

${roomDetails}

📌 <b>Joylashuv:</b> <a href="${locationLink}">Xaritada ochish (Yandex)</a>
  `.trim();
}

export function generateTelegramMessage(
  data: OrderTelegramData,
): Promise<void> {
  const message = createTelegramMessageText('🆕 <b>Yangi buyurtma!</b>', data);
  return sendMessageTelegram(message);
}

export function sendTelegramOrderChange(
  data: OrderTelegramData,
): Promise<void> {
  const message = createTelegramMessageText(
    '🔧 <b>Zakazga o‘zgartirishlar kiritildi!</b>',
    data,
  );
  return sendMessageTelegram(message);
}

export function sendTelegramOrderDone(data: OrderTelegramData): Promise<void> {
  const message = createTelegramMessageText(
    '🎉 <b>Buyurtma muvaffaqiyatli yakunlandi!</b>',
    data,
  );
  return sendMessageTelegram(message);
}

export async function sendMessageTelegram(message: string): Promise<void> {
  const botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
  const chatId = configService.get<string>('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not defined');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
    throw new Error('Failed to send message to Telegram');
  }
}

interface DeletedItems {
  name: string;
  phone: string;
  item: string;
  itemName: string;
  itemPhone?: string;
}

export async function deletedOrderSendBot(data: DeletedItems): Promise<void> {
  const botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
  const chatId = configService.get<string>('TELEGRAM_CHAT_ID');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const message = `
❌ <b>Buyurtma o'chirildi</b>

👤 <b>O'chirgan:</b> ${data.name}
📞 <b>Telefon raqami:</b> ${data.phone}

📦 <b>O'chirilgan obyekt turi:</b> ${data.item}
🏷️ <b>Obyekt nomi:</b> ${data.itemName}
${data.itemPhone ? `📞 <b>Obyekt telefon raqami:</b> ${data.itemPhone}` : ''}`.trim();

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
    throw new Error('Failed to send message to Telegram');
  }
}
