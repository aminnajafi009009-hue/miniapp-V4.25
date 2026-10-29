import { applyCardFlags } from "./cardFlags"
import { apiGet, apiGetBlob, apiPost, apiPostForm } from "./client"
import type {
    CustomBuildLimits,
    CustomBuildOrderType,
    DiscountValidateResult,
    FreeTrialResponse,
    Me,
    Plan,
    PlansResponse,
    ReferralStats,
    ServicesResponse,
    Wallet,
} from "./types"

export const getMe = (): Promise<Me> => apiGet("/api/me")

export const getMembershipStatus = (): Promise<{
    joined: boolean
    channels: { name: string; url: string }[]
}> => apiGet("/api/membership/status")

export const getPlans = (): Promise<PlansResponse> => apiGet("/api/plans")

export const getFreeTrial = (): Promise<FreeTrialResponse> => apiGet("/api/free-trial")

export const getCustomBuildLimits = (): Promise<CustomBuildLimits> => apiGet("/api/custom-build/limits")

export const validateDiscount = (code: string, planKey?: string): Promise<DiscountValidateResult> =>
    apiPost("/api/discount/validate", { code, plan_key: planKey })

export const buyPlanWithWallet = (planKey: string, discountCode?: string, serviceName?: string | null) =>
    apiPost("/api/orders/wallet", { plan_key: planKey, discount_code: discountCode || "", ...(serviceName ? { service_name: serviceName } : {}) })

/** نام سرویس (حالت «نامگذاری توسط کاربر»): اعتبارسنجی و ساخت نام نهایی base_12345 */
export const resolveServiceName = (planKey: string, name: string): Promise<{ required: boolean; name: string | null }> =>
    apiPost("/api/orders/service-name", { plan_key: planKey, name })

export interface OnlineCreateResult {
    payment_id: number; payment_link: string; price: number; expires_at?: string; expiry_minutes?: number
    gateway?: string | null; payment_link2?: string | null; tron_amount?: number | null; info_lines?: string[] | null
}

export const createOnlinePayment = (
    planKey: string,
    discountCode?: string,
    opts?: { gateway?: string | null; serviceName?: string | null },
): Promise<OnlineCreateResult> =>
    apiPost("/api/orders/online/create", {
        plan_key: planKey, discount_code: discountCode || "",
        ...(opts?.gateway ? { gateway: opts.gateway } : {}),
        ...(opts?.serviceName ? { service_name: opts.serviceName } : {}),
    })

export interface OnlineStatus {
    status: "pending" | "paid"; order_id?: number; note?: string
    /** TonPays: less = مبلغ کمتر واریز شده (رسید مابقی)، more = مبلغ بیشتر (ثبت کارت عودت) */
    action?: "less" | "more"; done?: boolean
    remaining_amount?: number | null; remaining_card_number?: string | null; remaining_card_holder?: string | null; refund_amount?: number | null
}

export const getOnlinePaymentStatus = (
    paymentId: number,
): Promise<OnlineStatus> =>
    apiGet(`/api/orders/online/status?id=${paymentId}`)

export const tonpaysRegisterRefund = (paymentId: number, cardNumber: string, cardHolder: string) =>
    apiPost(`/api/orders/online/${paymentId}/tonpays/refund`, { card_number: cardNumber, card_holder: cardHolder })

export const tonpaysSendRemainder = (paymentId: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiPostForm(`/api/orders/online/${paymentId}/tonpays/remainder`, form)
}

export const getCardInfo = (planKey: string, discountCode?: string, serviceName?: string | null): Promise<{ card_number: string; card_holder: string; price: number; invoice_id: number; expires_at: string }> =>
    apiPost("/api/orders/card/info", { plan_key: planKey, discount_code: discountCode || "", ...(serviceName ? { service_name: serviceName } : {}) }).then(applyCardFlags)

export const uploadPlanReceipt = (planKey: string, discountCode: string, file: File, invoiceId?: number, serviceName?: string | null) => {
    const form = new FormData()
    form.append("plan_key", planKey)
    form.append("discount_code", discountCode || "")
    form.append("receipt", file)
    if (invoiceId) form.append("invoice_id", String(invoiceId))
    if (serviceName) form.append("service_name", serviceName)
    return apiPostForm("/api/orders/card/receipt", form)
}

export const getWallet = (): Promise<Wallet> => apiGet("/api/wallet")

export const createWalletCardInvoice = (
    amount: number,
): Promise<{ invoice_id: number; expires_at: string; expiry_minutes: number; card_number: string; card_holder: string; price: number }> =>
    apiPost("/api/wallet/card/create", { amount }).then(applyCardFlags)

export const topupWallet = (amount: number, file: File, invoiceId?: number) => {
    const form = new FormData()
    form.append("amount", String(amount))
    form.append("receipt", file)
    if (invoiceId) form.append("invoice_id", String(invoiceId))
    return apiPostForm("/api/wallet/topup", form)
}

export const createWalletOnlinePayment = (
    amount: number,
    gateway?: string | null,
): Promise<OnlineCreateResult> =>
    apiPost("/api/wallet/online/create", { amount, ...(gateway ? { gateway } : {}) })

export const getServices = (): Promise<ServicesResponse> => apiGet("/api/services")

export const getServiceUsage = (configId: number): Promise<import("./types").ServiceUsageResponse> =>
    apiGet(`/api/services/${configId}/usage`)

export const getServiceDetail = (configId: number): Promise<import("./types").ServiceDetail> =>
    apiGet(`/api/services/${configId}`)

export const getServiceUsageHistory = (configId: number, days = 30): Promise<import("./types").UsageHistory> =>
    apiGet(`/api/services/${configId}/usage-history?days=${days}`)

export const revokeServiceLink = (configId: number): Promise<{ success: boolean; sub_link?: string }> =>
    apiPost(`/api/services/${configId}/revoke`)

export const toggleServiceLink = (configId: number, enabled: boolean): Promise<{ success: boolean; link_disabled?: boolean }> =>
    apiPost(`/api/services/${configId}/toggle`, { enabled })

export const getHome = (): Promise<import("./types").HomeData> => apiGet("/api/home")
export const getProfile = (): Promise<import("./types").ProfileData> => apiGet("/api/profile")
export const getSettings = (): Promise<import("./types").UserSettings> => apiGet("/api/settings")
export const saveSettings = (patch: Partial<{ notifications: Partial<import("./types").UserSettings["notifications"]>; default_app: string | null }>): Promise<import("./types").UserSettings> =>
    apiPost("/api/settings", patch)
export const getCustomBuildOptions = (): Promise<{ options: import("./types").MapOption[] }> => apiGet("/api/custom-build/options")

export const getServiceConfigs = (configId: number): Promise<{ configs: string[] }> =>
    apiGet(`/api/services/${configId}/configs`)

export const getServiceQrBlob = (configId: number): Promise<Blob> => apiGetBlob(`/api/services/${configId}/qr`)


export const deleteService = (configId: number) => apiPost(`/api/services/${configId}/delete`)

export const customBuildQuote = (volumeGb: number, days: number, orderType: CustomBuildOrderType = "new", renewMode?: "time" | "volume" | "both"): Promise<{ price: number }> =>
    apiPost("/api/custom-build/quote", { volume_gb: volumeGb, days, order_type: orderType, renew_mode: renewMode })

export const customBuildCardInfo = (
    volumeGb: number,
    days: number,
    orderType: CustomBuildOrderType = "new",
    name?: string,
    targetConfigId?: number,
    renewMode?: "time" | "volume" | "both",
): Promise<{ card_number: string; card_holder: string; price: number; invoice_id: number; expires_at: string }> =>
    apiPost("/api/custom-build/card/info", { volume_gb: volumeGb, days, name, order_type: orderType, target_config_id: targetConfigId, renew_mode: renewMode })

export const customBuildWallet = (params: {
    volumeGb: number
    days: number
    name?: string
    orderType: CustomBuildOrderType
    renewMode?: "time" | "volume" | "both"
    targetConfigId?: number
}) =>
    apiPost("/api/custom-build/wallet", {
        volume_gb: params.volumeGb, days: params.days, name: params.name,
        order_type: params.orderType, target_config_id: params.targetConfigId, renew_mode: params.renewMode,
    })

export const customBuildCardReceipt = (params: {
    volumeGb: number
    days: number
    name?: string
    orderType: CustomBuildOrderType
    renewMode?: "time" | "volume" | "both"
    targetConfigId?: number
    file: File
    invoiceId?: number
}) => {
    const form = new FormData()
    form.append("volume_gb", String(params.volumeGb))
    form.append("days", String(params.days))
    if (params.name) form.append("name", params.name)
    form.append("order_type", params.orderType)
    if (params.renewMode) form.append("renew_mode", params.renewMode)
    if (params.targetConfigId) form.append("target_config_id", String(params.targetConfigId))
    form.append("receipt", params.file)
    if (params.invoiceId) form.append("invoice_id", String(params.invoiceId))
    return apiPostForm("/api/custom-build/card/receipt", form)
}

export const getReferral = (): Promise<ReferralStats> => apiGet("/api/referral")

export const sendTicket = (text: string) => apiPost("/api/support/ticket", { text })

export const getSupportInfo = (): Promise<{ channel_url: string; guide_url: string; guides?: { id: number; title: string; body: string }[] }> => apiGet("/api/support/info")

export type { Plan }

export interface CryptoCoin { symbol: string; network: string; name: string; emoji: string }
export const getCryptoCoins = (): Promise<{ coins: CryptoCoin[] }> => apiGet("/api/wallet/crypto/coins")
export const createCryptoInvoice = (amount: number, symbol: string): Promise<{ invoice_id: number; expires_at: string; expiry_minutes: number; symbol: string; network: string; wallet: string; amount_asset: string; price: number }> =>
    apiPost("/api/wallet/crypto/create", { amount, symbol })
export const submitCryptoReceipt = (invoiceId: number, file: File | null, hash: string) => {
    const form = new FormData()
    form.append("invoice_id", String(invoiceId))
    if (file) form.append("receipt", file)
    if (hash) form.append("hash", hash)
    return apiPostForm("/api/wallet/crypto/receipt", form)
}
