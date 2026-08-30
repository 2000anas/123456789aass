# Elyptek

تطبيق واحد لإدارة التدفق النقدي وحضور الموظفين — الواجهة + API + MongoDB Atlas.

## الهيكل

- `web/` — واجهة React
- `src/` — Express API
- `netlify/functions/` — API على Netlify (نفس المنفذ/النطاق)
- `dist/web/` — ملفات الواجهة بعد البناء

## التشغيل المحلي (منفذ واحد)

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

يفتح على **http://localhost:5001** — الواجهة و `/api` معاً.

## التشغيل المحلي (مثل Netlify — منفذ 8888)

```bash
npm run dev:netlify
```

## التشغيل المحلي (منفذان — Vite + Express)

```bash
npm run dev:local
```

- الواجهة: http://localhost:5173  
- API: http://localhost:5001/api

## الإنتاج على جهازك (منفذ واحد)

```bash
npm run build
npm start
```

يفتح على http://localhost:5001

## النشر على Netlify (مشروع واحد)

1. ارفع المشروع إلى GitHub.
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
3. Netlify يقرأ `netlify.toml` تلقائياً:
   - Build: `npm run build`
   - Publish: `dist/web`
   - Functions: `netlify/functions/server.ts` (كل طلبات `/api/*`)
4. **Site settings → Environment variables** — أضف:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | سلسلة عشوائية طويلة |
| `JWT_EXPIRES_IN` | `7d` |
| `APP_TIMEZONE` | `Asia/Damascus` |
| `CLIENT_URL` | `https://your-site.netlify.app` |

5. Deploy.

بعد النشر:
- الموقع: `https://your-site.netlify.app`
- API: `https://your-site.netlify.app/api/health`

### بيانات تجريبية

شغّل محلياً مرة واحدة (يتصل بـ Atlas):

```bash
npm run seed
```

## Docker (بديل)

```bash
docker build -t elyptek .
docker run --rm -p 5001:5001 -e MONGODB_URI="..." -e JWT_SECRET="..." elyptek
```
