import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IOrder } from '../types';

const configService = new ConfigService();

function formatDateUzbek(date?: string | Date | null): string {
  if (!date) return '—';

  return new Date(date).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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

export function sendTelegramOrderForReport(data: IOrder): Promise<void> {
  const message = createTelegramMessageTextForReport(
    '📝 <b>Buyurtma tafsilotlari</b>',
    data,
  );
  return sendMessageTelegramForReport(message);
}

export function sendTelegramOrderDeleted(data: IOrder, userData: DeletedByUser): Promise<void> {
  const message = createDeletedOrderTelegramMessage(
    data,
    userData,
  );
  return sendMessageTelegramForReport(message);
}


export async function sendMessageTelegramForReport(
  message: string,
): Promise<void> {
  const botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
  const chatId = configService.get<string>('TELEGRAM_CHAT_ID_REPORT');

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

function formatMoney(amount?: number | null): string {
  if (amount === null || amount === undefined) return '—';

  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

function escapeHtml(text?: string | null): string {
  if (!text) return '—';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createTelegramMessageTextForReport(
  title: string,
  data: IOrder,
): string {
  const locationLink =
    data.latitude && data.longitude
      ? `https://yandex.com/maps/?ll=${data.longitude},${data.latitude}&z=16&rtext=~${data.latitude},${data.longitude}&rtt=auto`
      : null;

  const roomDetails =
    (data?.roomMeasurement ?? []).length > 0
      ? (data.roomMeasurement ?? [])
          .map(
            (room, idx) => `
🛋️ <b>Xona ${idx + 1}</b>
├ 📍 <b>Nomi:</b> ${escapeHtml(room.name)}
├ 🔑 <b>Key:</b> ${escapeHtml(room.key)}
└ 📏 <b>O'lcham:</b> ${escapeHtml(room.value)}
`,
          )
          .join('\n')
      : `❌ Xona o'lchamlari mavjud emas`;

  return `
${title}

━━━━━━━━━━━━━━━━━━
📦 <b>ZAKAZ MA'LUMOTI</b>
━━━━━━━━━━━━━━━━━━

🆔 <b>ID:</b>
<code>${data.id}</code>

📌 <b>Status:</b> ${escapeHtml(data.status)}

📅 <b>Yaratilgan:</b>
${formatDateUzbek(data.createdAt)}

♻️ <b>Yangilangan:</b>
${formatDateUzbek(data.updatedAt)}

━━━━━━━━━━━━━━━━━━
👤 <b>KLIENT</b>
━━━━━━━━━━━━━━━━━━

🙍 <b>Ism:</b> ${escapeHtml(data.name || '—')}

📞 <b>Telefon:</b>
<code>${data.phone || '-'}</code>

💬 <b>Izoh:</b>
${escapeHtml(data.comment || '—')}

🌐 <b>Region:</b>
${escapeHtml(data.region?.name || '—')}

📢 <b>Manba:</b>
${escapeHtml(data.social?.name || '—')}

━━━━━━━━━━━━━━━━━━
💰 <b>TO'LOV</b>
━━━━━━━━━━━━━━━━━━

💵 <b>Umumiy summa:</b>
${formatMoney(data.total)}

💸 <b>Predoplata:</b>
${formatMoney(data.prePayment)}

📉 <b>Qarz:</b>
${formatMoney(data.dueAmount)}

💰 <b>Predoplata olingan:</b>
${formatDateUzbek(data.getPrePaymentDate)}

💳 <b>To'liq to'lov olingan:</b>
${formatDateUzbek(data.getAllPaymentDate)}

━━━━━━━━━━━━━━━━━━
⏰ <b>ISH VAQTLARI</b>
━━━━━━━━━━━━━━━━━━

🚚 <b>Usta borish vaqti:</b>
${formatDateUzbek(data.workerArrivalDate)}

🏁 <b>Ish tugash vaqti:</b>
${formatDateUzbek(data.endDateJob)}

━━━━━━━━━━━━━━━━━━
👨‍💼 <b>XODIMLAR</b>
━━━━━━━━━━━━━━━━━━

👩‍💼 <b>Manager:</b>
${escapeHtml(data.managerName || '—')}

📞 <code>${data.managerphone || '—'}</code>

━━━━━━━━

👨‍🔧 <b>Zamir:</b>
${escapeHtml(data.zamirName || '—')}

📞 <code>${data.zamirPhone || '—'}</code>

━━━━━━━━

🏭 <b>Zavod:</b>
${escapeHtml(data.zavodName || '—')}

📞 <code>${data.zavodPhone || '—'}</code>

━━━━━━━━

🛠️ <b>Usta:</b>
${escapeHtml(data.ustName || '—')}

📞 <code>${data.ustPhone || '—'}</code>

━━━━━━━━━━━━━━━━━━
🏠 <b>XONALAR</b>
━━━━━━━━━━━━━━━━━━

${roomDetails}

━━━━━━━━━━━━━━━━━━
📍 <b>LOKATSIYA</b>
━━━━━━━━━━━━━━━━━━

🌍 <b>Latitude:</b>
<code>${data.latitude ?? '—'}</code>

🌍 <b>Longitude:</b>
<code>${data.longitude ?? '—'}</code>

${
  locationLink
    ? `🗺 <a href="${locationLink}">Xaritada ochish</a>`
    : '❌ Lokatsiya mavjud emas'
}

━━━━━━━━━━━━━━━━━━
🧾 <b>QO‘SHIMCHA</b>
━━━━━━━━━━━━━━━━━━

👤 <b>Social ID:</b>
<code>${data.socialId || '—'}</code>

📦 <b>Order Status ID:</b>
<code>${data.orderStatusId || '—'}</code>

🌐 <b>Region ID:</b>
<code>${data.regionId || '—'}</code>
`.trim();
}

interface DeletedByUser {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
}

function createDeletedOrderTelegramMessage(
  order: IOrder,
  deletedBy: DeletedByUser,
): string {
  return `
🗑 <b>Buyurtma o‘chirildi</b>

━━━━━━━━━━━━━━━━━━

🆔 <b>Zakaz ID:</b>
<code>${order.id}</code>

📌 <b>Status:</b>
${escapeHtml(order.status || '—')}

━━━━━━━━━━━━━━━━━━
👤 <b>KLIENT</b>
━━━━━━━━━━━━━━━━━━

🙍 <b>Ism:</b>
${escapeHtml(order.name || '—')}

📞 <b>Telefon:</b>
<code>${order.phone || '—'}</code>

🌐 <b>Region:</b>
${escapeHtml(order.region?.name || '—')}

💰 <b>Summa:</b>
${formatMoney(order.total)}

━━━━━━━━━━━━━━━━━━
👨‍💼 <b>MAS'ULLAR</b>
━━━━━━━━━━━━━━━━━━

👩‍💼 <b>Manager:</b>
${escapeHtml(order.managerName || '—')}

👨‍🔧 <b>Zamir:</b>
${escapeHtml(order.zamirName || '—')}

🏭 <b>Zavod:</b>
${escapeHtml(order.zavodName || '—')}

🛠️ <b>Usta:</b>
${escapeHtml(order.ustName || '—')}

━━━━━━━━━━━━━━━━━━
❌ <b>KIM O‘CHIRDI</b>
━━━━━━━━━━━━━━━━━━

👤 <b>F.I.O:</b>
${escapeHtml(deletedBy?.name || 'Nomaʼlum')}

📞 <b>Telefon:</b>
<code>${deletedBy?.phone || '—'}</code>

🆔 <b>User ID:</b>
<code>${deletedBy?.id || '—'}</code>

━━━━━━━━━━━━━━━━━━

🕒 <b>O‘chirilgan vaqt:</b>
${formatDateUzbek(new Date())}
`.trim();
}
