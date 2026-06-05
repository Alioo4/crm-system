import { Prisma } from '@prisma/client'

// Bu modellarda updatedAt field yo'q — middleware qo'shmasin
const MODELS_WITHOUT_UPDATED_AT = new Set([
  'OrderStatusHistory',
  'FinanceTransaction',
]);

export const timezoneOffsetMiddleware: Prisma.Middleware = async (params, next) => {
  const now = new Date();
  const tashkentTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  const hasUpdatedAt = !MODELS_WITHOUT_UPDATED_AT.has(params.model ?? '');

  if (params.action === 'create') {
    // createMany da data array bo'ladi — har bir elementni o'zgartirish kerak emas
    if (params.args?.data && !Array.isArray(params.args.data)) {
      if (!params.args.data.createdAt) {
        params.args.data.createdAt = tashkentTime;
      }
      if (hasUpdatedAt && !params.args.data.updatedAt) {
        params.args.data.updatedAt = tashkentTime;
      }
    }
  }

  if (params.action === 'update' || params.action === 'updateMany') {
    if (params.args?.data && hasUpdatedAt) {
      params.args.data.updatedAt = tashkentTime;
    }
  }

  return next(params);
};
