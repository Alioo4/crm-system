# Statistics API Documentation

> **Faqat ADMIN** roli uchun. Barcha so'rovlarda `Authorization: Bearer <token>` header bo'lishi shart.

---

## 1. Workers — Ishchilar statistikasi

### Endpoint

```
GET /api/statistics/workers
```

### Query parametrlar

| Parametr | Tur    | Majburiy | Tavsif                                      | Misol                                  |
|----------|--------|----------|---------------------------------------------|----------------------------------------|
| `from`   | string | Yo'q     | Boshlanish sanasi `YYYY-MM-DD`              | `2026-06-01`                           |
| `to`     | string | Yo'q     | Tugash sanasi `YYYY-MM-DD`                  | `2026-06-30`                           |
| `role`   | string | Yo'q     | `MANAGER` \| `ZAMIR` \| `ZAVOD` \| `USTANOVCHIK` | `ZAMIR`                           |
| `userId` | UUID   | Yo'q     | Bitta ishchining ID si                      | `c729558c-45d7-4d81-9c00-c203286cd3a3` |

### "Bajarildi" qoidasi

Har bir rol uchun orderning statusiga qarab "ishni tugatdi" deb hisoblanadi:

| Rol          | O'tish                                  | Sana manba              |
|--------------|-----------------------------------------|-------------------------|
| `ZAMIR`      | `ZAMIR` → `ZAVOD` / `USTANOVCHIK` / `DONE` | `OrderStatusHistory.createdAt` |
| `ZAVOD`      | `ZAVOD` → `USTANOVCHIK` / `DONE`       | `OrderStatusHistory.createdAt` |
| `USTANOVCHIK`| `USTANOVCHIK` → `DONE`                 | `OrderStatusHistory.createdAt` |
| `MANAGER`    | istalgan → `DONE`                       | `OrderStatusHistory.createdAt` |

> Order `DONE` bo'lishi shart emas — masalan, ZAMIR uchun order `ZAVOD` statusida bo'lsa ham "bajarilgan" hisoblanadi.

### Filter stsenariylari

| `role`   | `userId` | Natija                                   |
|----------|----------|------------------------------------------|
| —        | —        | Barcha rollar, barcha ishchilar          |
| `ZAMIR`  | —        | Faqat zamir bo'limi, barchasi            |
| `ZAMIR`  | `uuid`   | Faqat shu zamir ishchisi                 |
| —        | `uuid`   | Shu ishchini barcha rollarda ko'rsatadi  |

### Response

```json
{
  "success": true,
  "message": "Successfully found!",
  "data": {
    "dateRange": {
      "from": "2026-06-01",
      "to": "2026-06-30"
    },
    "filter": {
      "role": "ZAMIR",
      "userId": "c729558c-45d7-4d81-9c00-c203286cd3a3"
    },
    "byRole": [
      {
        "role": "ZAMIR",
        "totalOrders": 12,
        "workers": [
          {
            "userId": "c729558c-45d7-4d81-9c00-c203286cd3a3",
            "name": "Bobur",
            "totalOrders": 5,
            "byDay": [
              {
                "date": "2026-06-01",
                "count": 2,
                "orders": [
                  {
                    "orderId": "2896d51a-ae6c-4bb4-a49a-346e90d56fd7",
                    "clientName": "Ravshanbek",
                    "phone": "998901234567",
                    "completedAt": "2026-06-01T09:23:14.000Z"
                  }
                ]
              },
              {
                "date": "2026-06-03",
                "count": 3,
                "orders": [...]
              }
            ]
          }
        ]
      },
      {
        "role": "MANAGER",
        "totalOrders": 8,
        "workers": [...]
      }
    ]
  }
}
```

### Response fieldlari

#### `byRole[]`

| Field         | Tur      | Tavsif                          |
|---------------|----------|---------------------------------|
| `role`        | string   | `MANAGER` / `ZAMIR` / `ZAVOD` / `USTANOVCHIK` |
| `totalOrders` | number   | Shu roldagi barcha ishchilarning jami orderlari |
| `workers`     | array    | Shu roldagi ishchilar ro'yxati  |

#### `byRole[].workers[]`

| Field         | Tur    | Tavsif                              |
|---------------|--------|-------------------------------------|
| `userId`      | UUID   | Ishchi ID si                        |
| `name`        | string | Ishchi ismi                         |
| `totalOrders` | number | Ushbu ishchi bajargan orderlar soni |
| `byDay`       | array  | Kunlik breakdown                    |

#### `byRole[].workers[].byDay[]`

| Field    | Tur    | Tavsif                                    |
|----------|--------|-------------------------------------------|
| `date`   | string | Sana `YYYY-MM-DD` formatida               |
| `count`  | number | Shu kuni bajarilgan orderlar soni         |
| `orders` | array  | Shu kundagi orderlar ro'yxati             |

#### `orders[]`

| Field         | Tur             | Tavsif                              |
|---------------|-----------------|-------------------------------------|
| `orderId`     | UUID            | Order ID si                         |
| `clientName`  | string \| null  | Mijoz ismi                          |
| `phone`       | string \| null  | Mijoz telefoni                      |
| `completedAt` | ISO 8601 string | Ishchi shu orderni tugatgan aniq vaqt |

### So'rov misollari

```
# Bugun barcha ishchilar
GET /api/statistics/workers?from=2026-06-04&to=2026-06-04

# Bu oyda faqat zamirlar
GET /api/statistics/workers?from=2026-06-01&to=2026-06-30&role=ZAMIR

# Bitta zamir ning barcha bajarganlarini ko'rish
GET /api/statistics/workers?role=ZAMIR&userId=c729558c-45d7-4d81-9c00-c203286cd3a3

# Bitta ishchini barcha rollarda ko'rish
GET /api/statistics/workers?userId=c729558c-45d7-4d81-9c00-c203286cd3a3
```

---

## 2. Sources — Manba statistikasi

### Endpoint

```
GET /api/statistics/sources
```

### Query parametrlar

| Parametr   | Tur    | Majburiy | Tavsif                         | Misol                                  |
|------------|--------|----------|--------------------------------|----------------------------------------|
| `from`     | string | Yo'q     | Boshlanish sanasi `YYYY-MM-DD` | `2026-06-01`                           |
| `to`       | string | Yo'q     | Tugash sanasi `YYYY-MM-DD`     | `2026-06-30`                           |
| `socialId` | UUID   | Yo'q     | Bitta ijtimoiy tarmoq ID si    | `550e8400-e29b-41d4-a716-446655440001` |
| `regionId` | UUID   | Yo'q     | Bitta hudud ID si              | `550e8400-e29b-41d4-a716-446655440000` |

> `socialId` va `regionId` bir vaqtda berilsa — ikkalasi ham filtrelanadi.

### Sana filtri haqida

Sana filtri `order.createdAt` ga qaraydi — order **yaratilgan** sana bo'yicha.

### Response

```json
{
  "success": true,
  "message": "Successfully found!",
  "data": {
    "dateRange": {
      "from": "2026-06-01",
      "to": "2026-06-30"
    },
    "totalOrders": 55,
    "bySocial": [
      {
        "id": "a1b2c3d4-...",
        "name": "Instagram",
        "totalOrders": 40,
        "byDay": [
          { "date": "2026-06-01", "count": 8 },
          { "date": "2026-06-02", "count": 5 },
          { "date": "2026-06-03", "count": 12 }
        ]
      },
      {
        "id": "e5f6g7h8-...",
        "name": "Telegram",
        "totalOrders": 8,
        "byDay": [
          { "date": "2026-06-01", "count": 3 }
        ]
      },
      {
        "id": null,
        "name": "Ko'rsatilmagan",
        "totalOrders": 7,
        "byDay": [
          { "date": "2026-06-01", "count": 7 }
        ]
      }
    ],
    "byRegion": [
      {
        "id": "r1s2t3u4-...",
        "name": "Yunusobod",
        "totalOrders": 15,
        "byDay": [
          { "date": "2026-06-01", "count": 5 },
          { "date": "2026-06-03", "count": 10 }
        ]
      },
      {
        "id": "v5w6x7y8-...",
        "name": "Chilonzor",
        "totalOrders": 10,
        "byDay": [
          { "date": "2026-06-02", "count": 4 },
          { "date": "2026-06-04", "count": 6 }
        ]
      },
      {
        "id": null,
        "name": "Ko'rsatilmagan",
        "totalOrders": 5,
        "byDay": [
          { "date": "2026-06-01", "count": 5 }
        ]
      }
    ]
  }
}
```

### Response fieldlari

#### Root

| Field         | Tur    | Tavsif                                        |
|---------------|--------|-----------------------------------------------|
| `dateRange`   | object | So'ralgan sana oralig'i                       |
| `totalOrders` | number | Filtrlangan orderlarning umumiy soni          |
| `filter`      | object | Faqat filter berilganda ko'rinadi             |
| `bySocial`    | array  | Ijtimoiy tarmoqlar bo'yicha breakdown         |
| `byRegion`    | array  | Hududlar bo'yicha breakdown                  |

#### `bySocial[]` va `byRegion[]`

| Field         | Tur             | Tavsif                                          |
|---------------|-----------------|-------------------------------------------------|
| `id`          | UUID \| null    | Manba ID si. `null` = ko'rsatilmagan orderlar   |
| `name`        | string          | Manba nomi (Instagram, Yunusobod, ...)          |
| `totalOrders` | number          | Ushbu manbadan kelgan umumiy orderlar           |
| `byDay`       | array           | Kunlik breakdown                                |

#### `byDay[]`

| Field   | Tur    | Tavsif                                |
|---------|--------|---------------------------------------|
| `date`  | string | Sana `YYYY-MM-DD` formatida           |
| `count` | number | Shu kuni ushbu manbadan kelgan orderlar |

> `bySocial` va `byRegion` `totalOrders` bo'yicha **kamayish tartibida** saralanadi.

### So'rov misollari

```
# Bu oyda barcha manbalar
GET /api/statistics/sources?from=2026-06-01&to=2026-06-30

# Faqat Instagram bo'yicha
GET /api/statistics/sources?from=2026-06-01&to=2026-06-30&socialId=a1b2c3d4-...

# Faqat Yunusobod bo'yicha
GET /api/statistics/sources?from=2026-06-01&to=2026-06-30&regionId=r1s2t3u4-...

# Instagram va Yunusobod kesimida
GET /api/statistics/sources?socialId=a1b2c3d4-...&regionId=r1s2t3u4-...
```

---

## Umumiy eslatmalar

### Autentifikatsiya

Barcha so'rovlarda header bo'lishi shart:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Faqat `ADMIN` roli ruxsat etilgan. Boshqa roldagilar `403 Forbidden` oladi.

### Xato javoblari

| HTTP kod | Sabab                                      |
|----------|--------------------------------------------|
| `400`    | Parametr formati noto'g'ri                 |
| `401`    | Token yo'q yoki noto'g'ri                  |
| `403`    | Ruxsat yo'q (ADMIN emas)                   |

```json
{
  "success": false,
  "message": "Ruxsat yo'q"
}
```

### Sana formati

- Barcha sanalar **ISO 8601** formatida qaytariladi: `2026-06-01T09:23:14.000Z`
- Query parametrlarda `YYYY-MM-DD` formatida yuboriladi: `2026-06-01`
- Vaqt zonasi: **UTC+5 (Toshkent)**
