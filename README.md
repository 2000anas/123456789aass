# Elyptek Manage

نظام بسيط واحترافي لإدارة التدفق النقدي وحضور الموظفين لشركة إليبتك.

## المميزات

- إدارة وارد/صادر نقدي بعملتي USD و SYP
- إدارة الموظفين والجداول
- تسجيل حضور/انصراف بتوقيت الخادم (Asia/Damascus)
- حساب الراتب الشهري مع خصم الغياب والتأخير
- تقارير مالية قابلة للطباعة
- واجهة عربية RTL مستوحاة من هوية إليبتك

## التقنيات

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt

## التشغيل

### المتطلبات

- Node.js 20+
- MongoDB يعمل محلياً

### التثبيت

```bash
cd server && npm install
cd ../client && npm install
cd .. && npm install
```

### إعداد البيئة

انسخ `server/.env.example` إلى `server/.env` وعدّل القيم عند الحاجة.

### بيانات أولية

```bash
npm run seed --prefix server
```

حساب المدير (للتطوير فقط — غيّر كلمة المرور):

- Email: `admin@example.com`
- Password: `change-me`

موظفين تجريبيين:

- `ahmad@example.com` / `employee123`
- `sara@example.com` / `employee123`
- `mahmoud@example.com` / `employee123`

### تشغيل التطوير

```bash
# من جذر المشروع
npm run dev --prefix server
npm run dev --prefix client
```

- API: http://localhost:5001
- App: http://localhost:5173

## النشر على Netlify (الواجهة الأمامية)

Netlify يستضيف **واجهة React فقط**. خادم Express و MongoDB يحتاجان استضافة منفصلة (مثل Render + MongoDB Atlas).

### الطريقة 1: ربط Git (موصى بها)

1. ارفع المشروع إلى GitHub/GitLab.
2. في [Netlify](https://app.netlify.com) → **Add new site** → **Import from Git**.
3. Netlify يقرأ `netlify.toml` تلقائياً:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
4. في **Site settings → Environment variables** أضف:
   - `VITE_API_URL` = `https://YOUR-BACKEND-URL/api`
5. انشر الموقع، ثم حدّث `CLIENT_URL` في خادم API ليطابق رابط Netlify.

### الطريقة 2: رفع يدوي (Drag & Drop)

```bash
cd client
npm install
# عدّل .env أو export قبل البناء:
# export VITE_API_URL=https://YOUR-BACKEND-URL/api
npm run build
```

ارفع مجلد **`client/dist`** إلى [Netlify Drop](https://app.netlify.com/drop).

### بناء محلي للتحقق

```bash
cd client && npm run build
```

الملفات الجاهزة للرفع ستكون في `client/dist/`.

## العملات

النظام يدعم **USD** و **SYP** في نفس الوقت:

- كل معاملة لها عملة محددة
- الرصيد يُحسب لكل عملة: `إجمالي الوارد - إجمالي الصادر`
- رواتب الموظفين يمكن أن تكون بأي من العملتين

## المنطقة الزمنية

الافتراضي: `Asia/Damascus` عبر متغير `APP_TIMEZONE`.
أوقات الحضور تؤخذ من الخادم وليس من متصفح المستخدم.
