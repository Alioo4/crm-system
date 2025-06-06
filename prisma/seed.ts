import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.$transaction([
    prisma.permissionAll.upsert({
      where: { path: 'auth' },
      update: {},
      create: {
        path: 'auth',
        get: false,
        post: true,
        patch: false,
        delete: false,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'order' },
      update: {},
      create: {
        path: 'order',
        get: true,
        post: false,
        patch: true,
        delete: false,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'order-status' },
      update: {},
      create: {
        path: 'order-status',
        get: true,
        post: false,
        patch: true,
        delete: false,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'history' },
      update: {},
      create: {
        path: 'history',
        get: true,
        post: false,
        patch: false,
        delete: false,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'regions' },
      update: {},
      create: {
        path: 'regions',
        get: true,
        post: false,
        patch: false,
        delete: false,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'room-meansurement' },
      update: {
        delete: true,
      },
      create: {
        path: 'room-meansurement',
        get: true,
        post: true,
        patch: true,
        delete: true,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'social' },
      update: {},
      create: {
        path: 'social',
        get: true,
        post: false,
        patch: false,
        delete: false,
      },
    }),
    prisma.permissionAll.upsert({
      where: { path: 'order-currency' },
      update: {},
      create: {
        path: 'order-currency',
        get: true,
        post: true,
        patch: true,
        delete: true,
      },
    }),
    prisma.user.upsert({
      where: { phone: '998332218888' },
      update: {},
      create: {
        phone: '998332218888',
        role: Role.ADMIN,
        password: '$2b$12$yD1xwXePX/KB5nlc5m1HM.mtb1uuSzVG2n1mefpdmHvw3VgiZtYIa',
        name: 'Quvonchbek'
      }
    })
  ]);

  console.log('✅ Service va Endpoint lar yuklandi!');
}

main()
  .catch((e) => {
    console.error('❌ Xatolik:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
