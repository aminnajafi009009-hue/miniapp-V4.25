export interface Me {
    name: string
    telegram_id: string
    wallet: number
    locked_wallet: number
    total_purchase: number
    joined: string
    invited_count: number
    successful_invites: number
    services_count: number
    orders_enabled: boolean
    agent_discount_percent?: number
    is_agent?: boolean
    referral_enabled?: boolean
    is_admin?: boolean
    is_reseller?: boolean
    commission_percent?: number
}

export interface Plan {
    key: string
    name: string
    price: number
    days: number
    volume_gb?: number
    duration_unit?: "days" | "hours"
    duration_value?: number
    type: "vip"
}

export interface VipCategory {
    key: string
    name: string
    plans: Plan[]
}

export interface PlansResponse {
    vip_categories: VipCategory[]
    orders_enabled: boolean
    intro_text?: string
    agent_discount_percent?: number
    is_agent?: boolean
    referral_enabled?: boolean
    is_admin?: boolean
    is_reseller?: boolean
    commission_percent?: number
    online_payment_enabled?: boolean
    online_gateways?: OnlineGateway[]
    config_name_mode?: "default" | "user"
    topup_methods?: string[]
}

export interface OnlineGateway { key: string; title: string; min_amount: number }

export interface FreeTrialResponse {
    plan: Plan
    wallet: number
    orders_enabled: boolean
}
export interface DiscountValidateResult {
    valid: boolean
    percent?: number
    discount_type?: "percent" | "amount"
    amount?: number
    min_order_amount?: number
    expires_at?: string | null
    reason?: "wrong_plan" | "user_limit_reached" | "not_allowed" | "min_order_amount"
}

export interface Transaction {
    type: string
    amount: number
    direction?: "in" | "out" | "pending"
    description: string
    created_at: string
}

export interface Wallet {
    wallet: number
    locked_wallet: number
    card_number: string
    card_holder: string
    min_purchase_gb: number
    online_payment_enabled?: boolean
    online_gateways?: OnlineGateway[]
    topup_methods?: string[]
    online_payment_min_amount?: number
    gift_percent?: number
    low_balance?: number
    referral_rule?: "any" | "paid" | "min_volume"
    referral_enabled?: boolean
    transactions: Transaction[]
}

export type ServiceStatus = "active" | "disabled" | "limited" | "expired" | "on_hold" | null

export interface VipService {
    id: number
    plan: string
    /** display title: "اسم سرویس در پنل | اسم بسته" */
    title?: string
    service_name?: string | null
    package_name?: string | null
    status?: ServiceStatus
    online_at?: number | null
    last_app?: string | null
    link_disabled?: boolean
    usage?: { total: number | null; used: number | null; remaining: number | null; percent: number | null }
    created_at: string
    expiry: string | null
    sub_link: string | null
    has_qr: boolean
    panel_type?: "shahrah" | "marzban" | "pasargad" | null
    panel_name?: string | null
    remaining_days?: number | null
    unlimited_time?: boolean
    unlimited_volume?: boolean
}

export interface UsageInfo {
    total: number | null
    used: number
    remaining: number | null
    percent: number | null
    expire: number | null
}

export interface ServiceUsageResponse {
    usage: UsageInfo | null
    remaining_days?: number | null
}

export interface ServicesResponse {
    vip: VipService[]
}

export type CustomBuildOrderType = "new" | "renew"

export interface CustomBuildLimits {
    min_gb: number
    max_gb: number
    min_days: number
    max_days: number
    price_per_gb: number
    price_per_30_days: number
}

export interface ReferralStats {
    invite_link: string
    invite_code: string
    invited_count: number
    successful_invites: number
    released_amount: number
    locked_wallet: number
    reward_amount: number
    min_purchase_gb: number
    rule?: "any" | "paid" | "min_volume"
    channel_leave_lock?: boolean
    penalty_enabled?: boolean
    penalty_wallet_amount?: number
    penalty_service_gb?: number
    pending_count?: number
}


/* ---------- service detail (dedicated sub page) ---------- */
export interface ServiceConnectionApp { name: string; version?: string | null; platform?: string | null; device?: string | null }
export interface ServiceDevice { name: string; platform?: string | null; last_seen?: number | null; ip?: string | null }
export interface ServiceDetail {
    id: number
    title: string
    service_name: string | null
    package_name: string | null
    status: ServiceStatus
    created_at: string
    expiry: string | null
    expire_ts: number | null
    remaining_days: number | null
    unlimited_time?: boolean
    unlimited_volume?: boolean
    usage: { total: number | null; used: number | null; remaining: number | null; percent: number | null; upload?: number | null; download?: number | null }
    sub_link: string | null
    has_qr: boolean
    panel_type: string | null
    panel_name: string | null
    connection: {
        online_at: number | null
        is_online: boolean
        last_sub_fetch_at: number | null
        user_agent: string | null
        app: ServiceConnectionApp | null
        ip: string | null
        devices: ServiceDevice[]
        devices_limit: number | null
    }
    can: { renew: boolean; revoke: boolean; delete: boolean; configs: boolean; toggle?: boolean }
    link_disabled?: boolean
    live?: boolean
}
export interface UsageHistory {
    days: number
    points: { date: string; used: number }[]
    total_period: number
    avg_per_day: number
    peak?: { date: string; used: number } | null
    has_data: boolean
    source: "snapshots" | "panel"
}

/* ---------- home / profile / settings ---------- */
export interface HomeData {
    name: string
    wallet: number
    orders_enabled: boolean
    free_trial_available: boolean
    custom_build_enabled: boolean
    renewal_enabled?: boolean
    services: { total: number; active: number; total_used: number; total_quota: number }
    attention: { id: number; title: string; kind: "expiring" | "low_traffic" | "expired"; remaining_days?: number | null; percent?: number | null }[]
    payg_enabled?: boolean
    activity: { type: string; title: string; amount?: number | null; direction?: "in" | "out" | "pending"; at: string }[]
    announcement?: string | null
}
export interface ProfileData {
    name: string
    username: string | null
    photo_url?: string | null
    telegram_id: string
    joined: string
    wallet: number
    locked_wallet: number
    total_purchase: number
    orders_count: number
    services_count: number
    invited_count: number
    successful_invites: number
    rank: { name: string; level: number; progress: number; next_at: number | null } | null
    agent_percent: number
}
export interface UserSettings {
    notifications: { usage_alerts: boolean; expiry_alerts: boolean; wallet_alerts: boolean; promo: boolean }
    default_app: string | null
}

/* ---------- multi-option custom build / free test ---------- */
export interface MapOption {
    num: number; name: string
    price_per_gb?: number; price_per_30_days?: number
    min_gb?: number; max_gb?: number; min_days?: number; max_days?: number
}
export interface FreeTrialPlan { num: number; name: string; volume_gb?: number; days?: number; plan_key?: string; price?: number; used?: boolean }
