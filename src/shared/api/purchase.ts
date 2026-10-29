import { applyCardFlags } from "./cardFlags"
import { apiGet, apiPost, apiPostForm } from "./client"
import type { CustomBuildOrderType, FreeTrialPlan, MapOption, Plan } from "./types"

/* Purchase helpers that add the optional multi-option params (option_num / plan_num)
   on top of the existing services.ts exports. */

export type RenewMode = "time" | "volume" | "both"

/** GET /api/custom-build/options — never throws; 404 / empty / error => [] */
export async function fetchCustomBuildOptions(): Promise<MapOption[]> {
    try {
        const r = (await apiGet("/api/custom-build/options")) as { options?: MapOption[] } | null
        return Array.isArray(r?.options) ? r!.options! : []
    } catch {
        return []
    }
}

export const cbQuote = (volumeGb: number, days: number, orderType: CustomBuildOrderType, renewMode?: RenewMode, optionNum?: number | null, targetConfigId?: number): Promise<{ price: number }> =>
    apiPost("/api/custom-build/quote", { volume_gb: volumeGb, days, order_type: orderType, renew_mode: renewMode, ...(optionNum != null ? { option_num: optionNum } : {}), ...(targetConfigId ? { target_config_id: targetConfigId } : {}) })

interface CbBase {
    volumeGb: number
    days: number
    name?: string
    orderType: CustomBuildOrderType
    renewMode?: RenewMode
    targetConfigId?: number
    optionNum?: number | null
}

export const cbWallet = (p: CbBase) =>
    apiPost("/api/custom-build/wallet", {
        volume_gb: p.volumeGb, days: p.days, name: p.name, order_type: p.orderType,
        target_config_id: p.targetConfigId, renew_mode: p.renewMode,
        ...(p.optionNum != null ? { option_num: p.optionNum } : {}),
    })

export const cbOnlineCreate = (p: CbBase & { gateway?: string | null }): Promise<import("./services").OnlineCreateResult> =>
    apiPost("/api/custom-build/online/create", {
        volume_gb: p.volumeGb, days: p.days, name: p.name, order_type: p.orderType,
        target_config_id: p.targetConfigId, renew_mode: p.renewMode,
        ...(p.optionNum != null ? { option_num: p.optionNum } : {}),
        ...(p.gateway ? { gateway: p.gateway } : {}),
    })

export const cbCardInfo = (p: CbBase): Promise<{ card_number: string; card_holder: string; price: number; invoice_id: number; expires_at: string }> =>
    apiPost("/api/custom-build/card/info", {
        volume_gb: p.volumeGb, days: p.days, name: p.name, order_type: p.orderType,
        target_config_id: p.targetConfigId, renew_mode: p.renewMode,
        ...(p.optionNum != null ? { option_num: p.optionNum } : {}),
    }).then(applyCardFlags)

export const cbCardReceipt = (p: CbBase & { file: File; invoiceId?: number }) => {
    const form = new FormData()
    form.append("volume_gb", String(p.volumeGb))
    form.append("days", String(p.days))
    if (p.name) form.append("name", p.name)
    form.append("order_type", p.orderType)
    if (p.renewMode) form.append("renew_mode", p.renewMode)
    if (p.targetConfigId) form.append("target_config_id", String(p.targetConfigId))
    if (p.optionNum != null) form.append("option_num", String(p.optionNum))
    form.append("receipt", p.file)
    if (p.invoiceId) form.append("invoice_id", String(p.invoiceId))
    return apiPostForm("/api/custom-build/card/receipt", form)
}

/* ---------- free trial ---------- */
export interface FreeTrialData {
    plan: Plan
    plans?: FreeTrialPlan[]
    wallet: number
    orders_enabled: boolean
}
export const getFreeTrialData = (): Promise<FreeTrialData> => apiGet("/api/free-trial")

export const ftWallet = (planKey: string, discountCode?: string, planNum?: number | null) =>
    apiPost("/api/orders/wallet", { plan_key: planKey, discount_code: discountCode || "", ...(planNum != null ? { plan_num: planNum } : {}) })

export const ftCardInfo = (planKey: string, discountCode?: string, planNum?: number | null): Promise<{ card_number: string; card_holder: string; price: number; invoice_id: number; expires_at: string }> =>
    apiPost("/api/orders/card/info", { plan_key: planKey, discount_code: discountCode || "", ...(planNum != null ? { plan_num: planNum } : {}) }).then(applyCardFlags)

export const ftReceipt = (planKey: string, discountCode: string, file: File, planNum?: number | null) => {
    const form = new FormData()
    form.append("plan_key", planKey)
    form.append("discount_code", discountCode || "")
    form.append("receipt", file)
    if (planNum != null) form.append("plan_num", String(planNum))
    return apiPostForm("/api/orders/card/receipt", form)
}

/* ---------- PAYG (پرداخت به‌ازای مصرف) ---------- */
export interface PaygOption { num: number; name: string; price_per_gb: number }
export interface PaygInfo { enabled: boolean; orders_enabled: boolean; min_balance: number; wallet: number; empty_action: string; options: PaygOption[] }
export const getPaygInfo = (): Promise<PaygInfo> => apiGet("/api/payg")
export const createPayg = (name: string, optionNum?: number | null): Promise<{ success: boolean; config_id?: number | null; price_per_gb?: number }> =>
    apiPost("/api/payg/create", { name, ...(optionNum != null ? { option_num: optionNum } : {}) })
