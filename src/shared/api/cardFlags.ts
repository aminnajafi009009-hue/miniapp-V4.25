/** تنظیمات ادمین برای صفحه‌ی کارت‌به‌کارت (دکمه‌های کپی)؛ از پاسخ API فاکتور کارت به‌روز می‌شود. */
export const cardFlags = { copyCard: true, copyAmount: true }
export function applyCardFlags<T>(r: T): T {
    const x = r as { show_copy_card?: boolean; show_copy_amount?: boolean }
    if (x && typeof x === "object") {
        if (typeof x.show_copy_card === "boolean") cardFlags.copyCard = x.show_copy_card
        if (typeof x.show_copy_amount === "boolean") cardFlags.copyAmount = x.show_copy_amount
    }
    return r
}
