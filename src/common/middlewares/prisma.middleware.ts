import { Prisma } from '@prisma/client'

export const timezoneOffsetMiddleware: Prisma.Middleware = async (params, next) => {
  const now = new Date();
  const tashkentTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  if (params.action === 'create') {
    if (params.args.data) {
      if (!params.args.data.createdAt) {
        params.args.data.createdAt = tashkentTime;
      }
      if (!params.args.data.updatedAt) {
        params.args.data.updatedAt = tashkentTime;
      }
    }
  }

  if (params.action === 'update') {
    if (params.args.data) {
      params.args.data.updatedAt = tashkentTime;
    }
  }

  return next(params);
};
