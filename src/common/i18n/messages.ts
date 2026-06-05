export const MSG = {
  // Auth
  USER_NOT_FOUND:        'USER_NOT_FOUND',
  PASSWORD_INCORRECT:    'PASSWORD_INCORRECT',
  ACCOUNT_DEACTIVATED:   'ACCOUNT_DEACTIVATED',
  PHONE_ALREADY_EXISTS:  'PHONE_ALREADY_EXISTS',

  // Order
  ORDER_NOT_FOUND:          'ORDER_NOT_FOUND',
  ORDERS_NOT_FOUND:         'ORDERS_NOT_FOUND',
  ORDER_UPDATE_FORBIDDEN:   'ORDER_UPDATE_FORBIDDEN',
  ORDER_ALREADY_ASSIGNED:   'ORDER_ALREADY_ASSIGNED',
  ORDER_ASSIGN_FORBIDDEN:   'ORDER_ASSIGN_FORBIDDEN',
  ORDER_UNASSIGN_FORBIDDEN: 'ORDER_UNASSIGN_FORBIDDEN',

  // Finance
  SALE_ALREADY_EXISTS:    'SALE_ALREADY_EXISTS',
  SALE_REQUIRED:          'SALE_REQUIRED',
  PAYMENT_EXCEEDS_SALE:   'PAYMENT_EXCEEDS_SALE',

  // References
  REGION_NOT_FOUND:       'REGION_NOT_FOUND',
  SOCIAL_NOT_FOUND:       'SOCIAL_NOT_FOUND',
  ORDER_STATUS_NOT_FOUND: 'ORDER_STATUS_NOT_FOUND',
  ORDER_STATUS_EXISTS:    'ORDER_STATUS_EXISTS',
  HASHTAG_NOT_FOUND:      'HASHTAG_NOT_FOUND',
  HASHTAG_EXISTS:         'HASHTAG_EXISTS',
  HASHTAG_NAME_TAKEN:     'HASHTAG_NAME_TAKEN',
  ROOM_NOT_FOUND:         'ROOM_NOT_FOUND',
  CURRENCY_ORDER_NOT_FOUND: 'CURRENCY_ORDER_NOT_FOUND',
  HISTORY_NOT_FOUND:      'HISTORY_NOT_FOUND',
  NAME_ALREADY_EXISTS:    'NAME_ALREADY_EXISTS',

  // Handover
  HANDOVER_NOT_FOUND:    'HANDOVER_NOT_FOUND',
  HANDOVER_ALREADY_DONE: 'HANDOVER_ALREADY_DONE',

  // Common
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type MessageKey = (typeof MSG)[keyof typeof MSG];

type Translations = Record<MessageKey, string>;

const uz: Translations = {
  USER_NOT_FOUND:           "Foydalanuvchi topilmadi",
  PASSWORD_INCORRECT:       "Parol noto'g'ri",
  ACCOUNT_DEACTIVATED:      "Hisobingiz faolsizlantirilgan",
  PHONE_ALREADY_EXISTS:     "Bu telefon raqam allaqachon ro'yxatdan o'tgan",

  ORDER_NOT_FOUND:          "Buyurtma topilmadi",
  ORDERS_NOT_FOUND:         "Buyurtmalar topilmadi",
  ORDER_UPDATE_FORBIDDEN:   "Ushbu buyurtmani yangilash uchun ruxsatingiz yo'q",
  ORDER_ALREADY_ASSIGNED:   "Bu buyurtma boshqa foydalanuvchiga biriktirilgan",
  ORDER_ASSIGN_FORBIDDEN:   "Buyurtmani biriktirish uchun ruxsatingiz yo'q",
  ORDER_UNASSIGN_FORBIDDEN: "Buyurtmadan ajratish uchun ruxsatingiz yo'q",

  SALE_ALREADY_EXISTS:  "Umumiy savdo kiritilgan, iltimos boshqa savdo turini kiriting",
  SALE_REQUIRED:        "Umumiy miqdor kiriting",
  PAYMENT_EXCEEDS_SALE: "To'lov miqdori umumiy savdo summasidan oshib ketmoqda",

  REGION_NOT_FOUND:         "Hudud topilmadi",
  SOCIAL_NOT_FOUND:         "Ijtimoiy tarmoq topilmadi",
  ORDER_STATUS_NOT_FOUND:   "Buyurtma holati topilmadi",
  ORDER_STATUS_EXISTS:      "Bu holat allaqachon mavjud",
  HASHTAG_NOT_FOUND:        "Hashtag topilmadi",
  HASHTAG_EXISTS:           "Bu hashtag allaqachon mavjud",
  HASHTAG_NAME_TAKEN:       "Bu hashtag nomi band",
  ROOM_NOT_FOUND:           "Xona topilmadi",
  CURRENCY_ORDER_NOT_FOUND: "Valyuta buyurtmasi topilmadi",
  HISTORY_NOT_FOUND:        "Tarix topilmadi",
  NAME_ALREADY_EXISTS:      "Bu nom allaqachon mavjud",

  HANDOVER_NOT_FOUND:    "To'lov topilmadi",
  HANDOVER_ALREADY_DONE: "Bu to'lov allaqachon topshirilgan",

  PERMISSION_DENIED: "Ruxsat yo'q",
};

const ru: Translations = {
  USER_NOT_FOUND:           "Пользователь не найден",
  PASSWORD_INCORRECT:       "Неверный пароль",
  ACCOUNT_DEACTIVATED:      "Ваш аккаунт деактивирован",
  PHONE_ALREADY_EXISTS:     "Этот номер телефона уже зарегистрирован",

  ORDER_NOT_FOUND:          "Заказ не найден",
  ORDERS_NOT_FOUND:         "Заказы не найдены",
  ORDER_UPDATE_FORBIDDEN:   "У вас нет прав для обновления этого заказа",
  ORDER_ALREADY_ASSIGNED:   "Этот заказ уже назначен другому пользователю",
  ORDER_ASSIGN_FORBIDDEN:   "У вас нет прав для назначения заказа",
  ORDER_UNASSIGN_FORBIDDEN: "У вас нет прав для снятия назначения заказа",

  SALE_ALREADY_EXISTS:  "Общая сумма продажи уже введена, введите другой тип",
  SALE_REQUIRED:        "Введите общую сумму",
  PAYMENT_EXCEEDS_SALE: "Сумма оплаты превышает общую сумму продажи",

  REGION_NOT_FOUND:         "Регион не найден",
  SOCIAL_NOT_FOUND:         "Социальная сеть не найдена",
  ORDER_STATUS_NOT_FOUND:   "Статус заказа не найден",
  ORDER_STATUS_EXISTS:      "Этот статус уже существует",
  HASHTAG_NOT_FOUND:        "Хэштег не найден",
  HASHTAG_EXISTS:           "Этот хэштег уже существует",
  HASHTAG_NAME_TAKEN:       "Это название хэштега занято",
  ROOM_NOT_FOUND:           "Комната не найдена",
  CURRENCY_ORDER_NOT_FOUND: "Валютный заказ не найден",
  HISTORY_NOT_FOUND:        "История не найдена",
  NAME_ALREADY_EXISTS:      "Это название уже существует",

  HANDOVER_NOT_FOUND:    "Платёж не найден",
  HANDOVER_ALREADY_DONE: "Этот платёж уже передан",

  PERMISSION_DENIED: "Доступ запрещён",
};

const langs: Record<string, Translations> = { uz, ru };

export function translate(key: string, lang = 'uz'): string {
  const dict = langs[lang] ?? langs.uz;
  return dict[key as MessageKey] ?? key;
}
