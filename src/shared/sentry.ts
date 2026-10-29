import * as Sentry from "@sentry/react";

/**
 * راه‌اندازی اختیاری Sentry برای Mini App. اگر VITE_SENTRY_DSN در build-time
 * تنظیم نشده باشد (فایل .env یا Environment Variables روی Render/Vercel)،
 * این تابع هیچ کاری نمی‌کند و بقیه‌ی برنامه دقیقاً مثل قبل کار می‌کند.
 *
 * برای فعال‌سازی: یک پروژه‌ی رایگان (نوع React) روی sentry.io بساز، DSN اش
 * رو کپی کن و به‌عنوان VITE_SENTRY_DSN به Environment Variables اضافه کن،
 * بعد دوباره build بگیر (چون Vite این متغیرها رو در زمان build جاسازی می‌کنه).
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.05,
    // initData تلگرام و اطلاعات کاربر رو خودکار نمی‌فرستیم (حریم خصوصی).
    sendDefaultPii: false,
  });
}

export { Sentry };
