"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
                delete: false
            },
        }),
        prisma.permissionAll.upsert({
            where: { path: 'location' },
            update: {},
            create: {
                path: 'location',
                get: true,
                post: false,
                patch: true,
                delete: false
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
                delete: false
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
                delete: false
            },
        }),
        prisma.permissionAll.upsert({
            where: { path: 'price-order' },
            update: {},
            create: {
                path: 'price-order',
                get: true,
                post: false,
                patch: true,
                delete: false
            },
        }),
        prisma.permissionAll.upsert({
            where: { path: 'roles' },
            update: {},
            create: {
                path: 'roles',
                get: true,
                post: false,
                patch: false,
                delete: false
            },
        }),
        prisma.permissionAll.upsert({
            where: { path: 'status' },
            update: {},
            create: {
                path: 'status',
                get: true,
                post: false,
                patch: false,
                delete: false
            },
        }),
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
//# sourceMappingURL=seed.js.map