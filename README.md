# Elyptek

تطبيق واحد لإدارة التدفق النقدي وحضور الموظفين: الواجهة وواجهة الـ API في نفس المشروع، ويُنشَران على منفذ واحد.

## الهيكل

- `web/` — واجهة React
- `src/` — Express + MongoDB
- `dist/` — ناتج البناء (`dist/server.js` للـ API و`dist/web` للواجهة)

## التشغيل

المتطلبات: Node.js 20+ و MongoDB.

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

- الواجهة: http://localhost:5173
- الـ API: http://localhost:5001/api

حساب المدير (للتطوير فقط): `admin@example.com` / `change-me`

## الإنتاج (منفذ واحد)

```bash
npm run build
npm start
```

يفتح على http://localhost:5001

## Docker

```bash
docker build -t elyptek .
docker run --rm -p 5001:5001 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/elyptek-manage" \
  -e JWT_SECRET="your-production-secret" \
  elyptek
```
