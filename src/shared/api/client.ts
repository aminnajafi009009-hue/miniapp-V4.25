import WebApp from "@twa-dev/sdk"

// آدرس بک‌اند Flask (webapp_api.py). موقع دیپلوی، این مقدار را در فایل .env
// به‌صورت VITE_API_BASE_URL تنظیم کنید (مثلا https://api.yourdomain.com).
// آدرس بک‌اند (ربات). ترتیب اولویت:
// ۱) فایل public/config.js  → window.__APP_CONFIG__.API_BASE_URL (بدون نیاز به build دوباره)
// ۲) متغیر VITE_API_BASE_URL موقع build
// ۳) همان دامنه‌ی خود مینی‌اپ (فقط وقتی API روی همان دامنه است)
// توجه: عمداً آدرس API از query-string خوانده نمی‌شود؛ چون لینک مخرب می‌توانست
// initData کاربر را به سرور دیگری بفرستد.
function resolveBaseUrl(): string {
    let cfg = ""
    try {
        cfg = ((window as any).__APP_CONFIG__?.API_BASE_URL || "").toString().trim()
    } catch {
        cfg = ""
    }
    const raw = cfg || (import.meta.env.VITE_API_BASE_URL as string) || (typeof window !== "undefined" ? window.location.origin : "")
    return raw.replace(/\/$/, "")
}
const BASE_URL = resolveBaseUrl()

const REQUEST_TIMEOUT_MS = 12000

function withTimeout(init: RequestInit = {}): { request: RequestInit; timer: ReturnType<typeof setTimeout> } {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const signal = init.signal
    if (signal) {
        signal.addEventListener("abort", () => controller.abort(), { once: true })
    }
    return { request: { ...init, signal: controller.signal, headers: init.headers }, timer }
}

export class ApiError extends Error {
    status: number
    code?: string
    reason?: string
    serverMessage?: string
    constructor(status: number, message: string, code?: string, reason?: string) {
        super(message)
        this.status = status
        this.code = code
        this.reason = reason
    }
}

// پیام قابل‌فهم برای خطای احراز هویت تلگرام (invalid_auth)؛ reason از بک‌اند می‌آید:
// missing = مینی‌اپ بدون initData باز شده، bad_hash = توکن ربات با توکن سرور نمی‌خواند،
// expired = نشست قدیمی (مینی‌اپ را ببندید و دوباره باز کنید).
const AUTH_REASON_MESSAGES: Record<string, string> = {
    missing: "مینی‌اپ بدون اطلاعات تلگرام باز شده؛ آن را از دکمه‌ی داخل ربات (نه لینک مرورگر) باز کنید.",
    bad_hash: "اطلاعات تلگرام با توکن سرور نمی‌خواند؛ مطمئن شوید توکن ربات روی سرور همان رباتی است که مینی‌اپ را باز می‌کند.",
    expired: "نشست شما منقضی شده؛ مینی‌اپ را ببندید و دوباره از داخل ربات باز کنید.",
}

export function authErrorMessage(reason?: string): string {
    return (reason && AUTH_REASON_MESSAGES[reason]) || "احراز هویت تلگرام ناموفق بود؛ مینی‌اپ را ببندید و دوباره از داخل ربات باز کنید."
}

function readInitData(): string {
    // initData همان چیزی است که بک‌اند برای اعتبارسنجی HMAC استفاده می‌کند؛
    // این تنها منبع هویت کاربر است، نه چیزی که ما دستی بسازیم.
    // اگر SDK خالی برگرداند (مثلاً تلگرام دیر initData را ست کند)، مستقیم از شیء خود تلگرام هم می‌خوانیم.
    let data = ""
    try { data = WebApp.initData || "" } catch { data = "" }
    if (!data) {
        try { data = (window as any).Telegram?.WebApp?.initData || "" } catch { data = "" }
    }
    return data
}

function authHeader(): Record<string, string> {
    const initData = readInitData()
    return initData ? { Authorization: `tma ${initData}` } : {}
}

async function handleResponse(res: Response) {
    let body: any = null
    let isJson = true
    try {
        body = await res.json()
    } catch {
        isJson = false
    }
    // اگر آدرس API اشتباه باشد، سایت استاتیک به‌جای JSON همان index.html را (با کد 200)
    // برمی‌گرداند. این حالت قبلاً بی‌صدا null برمی‌گرداند و صفحه خالی می‌ماند.
    const ctype = res.headers.get("content-type") || ""
    if (res.ok && !isJson && ctype.includes("text/html")) {
        throw new ApiError(502, `پاسخ سرور JSON نیست؛ آدرس API درست تنظیم نشده است (${res.url})`, "api_misconfigured")
    }
    if (!res.ok) {
        if (body?.error === "invalid_auth") {
            const msg = authErrorMessage(body?.reason)
            throw new ApiError(res.status, `${msg} (invalid_auth${body?.reason ? `: ${body.reason}` : ""})`, "invalid_auth", body?.reason)
        }
        const err = new ApiError(res.status, body?.error || `HTTP ${res.status}`, body?.error)
        if (typeof body?.message === "string" && body.message) err.serverMessage = body.message
        throw err
    }
    return body
}

// 🐛 فیکس: قبلاً وقتی شبکه درخواست رو اصلاً به سرور نمی‌رسوند (مثلاً چون
// VITE_API_BASE_URL موقع build تنظیم نشده و روی localhost مونده، یا اینکه CORS به
// خاطر عدم تطابق MINIAPP_ORIGIN بسته می‌شه)، مرورگر یک خطای کاملاً مبهم
// مثل "Failed to fetch" می‌دهد و هیچ سرنخی از اینکه دقیقاً کدام URL را زده
// نمی‌دهد. اینجا آن را می‌گیریم و یک پیام واضح‌تر می‌سازیم که آدرس دقیق رو
// نشون می‌دهد (فقط در متن خطا، نه توی رابط کاربر)، تا دیباگ رفع مشکل
// فوری مشخص بشود که دقیقاً کجای کد دارد مشکل.
async function fetchWithContext(url: string, init: RequestInit) {
    try {
        const { request, timer } = withTimeout(init)
        try {
            return await fetch(url, request)
        } finally {
            clearTimeout(timer)
        }
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err)
        throw new Error(`${reason} (آدرس مقصد: ${url})`)
    }
}

export async function apiGet(path: string) {
    const res = await fetchWithContext(`${BASE_URL}${path}`, {
        method: "GET",
        headers: { ...authHeader() },
    })
    return handleResponse(res)
}

export async function apiPost(path: string, body?: unknown) {
    const res = await fetchWithContext(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return handleResponse(res)
}

export async function apiPostForm(path: string, form: FormData) {
    const res = await fetchWithContext(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { ...authHeader() },
        body: form,
    })
    return handleResponse(res)
}

/** برای دانلود فایل (کیوآرکد / فایل کانفیگ گیمینگ) به‌صورت Blob با هدر احراز هویت. */
export async function apiGetBlob(path: string): Promise<Blob> {
    const res = await fetchWithContext(`${BASE_URL}${path}`, {
        method: "GET",
        headers: { ...authHeader() },
    })
    if (!res.ok) {
        throw new ApiError(res.status, `HTTP ${res.status}`)
    }
    return res.blob()
}

// نگاشت کد خطاهای بک‌اند به پیام قابل‌فهم برای کاربر فارسی‌زبان.
// وقتی بک‌اند کد جدیدی برمی‌گرداند که اینجا نیست، از fallback خود همان
// صفحه (یا پیام پیش‌فرض) استفاده می‌شود، نه یک پیام مبهم یکسان برای همه.
export const ERROR_CODE_MESSAGES: Record<string, string> = {
    invoice_expired:
        "⏰ مهلت ۳۰ دقیقه‌ای این فاکتور به پایان رسیده و به‌طور خودکار منقضی شد. لطفاً دوباره سفارش را ثبت کنید.",
    orders_closed: "بخش سفارشات موقتاً بسته است.",
    insufficient_balance: "موجودی کیف پول کافی نیست.",
    invalid_file_type: "فرمت فایل رسید نامعتبر است؛ لطفاً یک تصویر انتخاب کنید.",
    invalid_request: "درخواست نامعتبر است؛ لطفاً دوباره تلاش کنید.",
    telegram_delivery_failed: "ارسال رسید به ادمین موقتاً با خطا مواجه شد؛ لطفاً چند لحظه دیگر دوباره تلاش کنید.",
    free_test_already_used: "شما قبلاً از تست رایگان استفاده کرده‌اید.",
    plan_not_found: "این پلن دیگر در دسترس نیست.",
    gateway_disabled: "درگاه پرداخت آنلاین موقتاً غیرفعال است.",
    gateway_error: "ارتباط با درگاه پرداخت ��ا خطا مواجه شد؛ لطفاً دوباره تلاش کنید.",
    name_required: "برای این سرویس باید یک نام انتخاب کنید.",
    invalid_name: "نام نامعتبر است؛ فقط حروف انگلیسی، عدد و _ (۳ تا ۲۶ نویسه).",
    name_taken: "❌ نام تکراری است. لطفاً یک اسم دیگر انتخاب کنید.",
    name_taken_panel: "❌ این نام قبلاً در پنل وجود دارد. لطفاً یک اسم دیگر انتخاب کنید.",
    name_unavailable: "نتوانستیم نام یکتایی بسازیم؛ نام دیگری امتحان کنید.",
    amount_too_high: "مبلغ از سقف مجاز بیشتر است.",
    not_found: "موردی یافت نشد.",
    forbidden: "دسترسی مجاز نیست.",
}

/** پیام دوستانه‌ی متناظر با خطای بک‌اند؛ اگر کد شناخته‌شده نبود، fallback داده‌شده نمایش داده می‌شود. */
export function friendlyErrorMessage(e: unknown, fallback: string): string {
    if (e instanceof ApiError && e.serverMessage && /[\u0600-\u06FF]/.test(e.serverMessage)) return e.serverMessage
    if (e instanceof ApiError && e.code && ERROR_CODE_MESSAGES[e.code]) {
        return ERROR_CODE_MESSAGES[e.code]
    }
    return fallback
}

export { BASE_URL }
