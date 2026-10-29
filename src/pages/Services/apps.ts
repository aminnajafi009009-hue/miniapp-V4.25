import WebApp from "@twa-dev/sdk"
import { BASE_URL } from "@/shared/api/client"

export type Platform = "android" | "ios" | "windows" | "macos"

export interface VpnApp {
  id: string
  name: string
  platforms: Platform[]
  /** featured apps are shown larger / first */
  featured?: boolean
  tone: "blue" | "violet" | "cyan" | "pink" | "gold" | "green" | "info"
  build: (url: string, name: string) => string
  store: Partial<Record<Platform, string>>
}

const e = encodeURIComponent
const GH = (repo: string) => `https://github.com/${repo}/releases/latest`
const PLAY = (id: string) => `https://play.google.com/store/apps/details?id=${id}`
const APPLE = (slug: string, id: string) => `https://apps.apple.com/app/${slug}/id${id}`

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "android", label: "اندروید" },
  { value: "ios", label: "iOS" },
  { value: "windows", label: "ویندوز" },
  { value: "macos", label: "مک" },
]

export const APPS: VpnApp[] = [
  {
    id: "happ", name: "Happ", featured: true, tone: "blue", platforms: ["android", "ios", "windows", "macos"],
    build: (u) => `happ://add/${u}`,
    store: { android: PLAY("com.happproxy"), ios: APPLE("happ-proxy-utility", "6504287215"), windows: GH("Happ-proxy/happ-desktop"), macos: GH("Happ-proxy/happ-desktop") },
  },
  {
    id: "v2box", name: "V2Box", featured: true, tone: "violet", platforms: ["android", "ios", "macos"],
    build: (u, n) => `v2box://install-sub?url=${e(u)}&name=${e(n)}`,
    store: { android: PLAY("dev.hexasoftware.v2box"), ios: APPLE("v2box-v2ray-client", "6446814690"), macos: APPLE("v2box-v2ray-client", "6446814690") },
  },
  {
    id: "v2rayng", name: "v2rayNG", featured: true, tone: "green", platforms: ["android"],
    build: (u, n) => `v2rayng://install-sub?url=${e(u)}&name=${e(n)}`,
    store: { android: PLAY("com.v2ray.ang") },
  },
  {
    id: "hiddify", name: "Hiddify", tone: "cyan", platforms: ["android", "ios", "windows", "macos"],
    build: (u, n) => `hiddify://import/${u}#${e(n)}`,
    store: { android: PLAY("app.hiddify.com"), ios: APPLE("hiddify-proxy-vpn", "6596777532"), windows: GH("hiddify/hiddify-app"), macos: GH("hiddify/hiddify-app") },
  },
  {
    id: "karing", name: "Karing", tone: "pink", platforms: ["android", "ios", "windows", "macos"],
    build: (u, n) => `karing://install-config?url=${e(u)}&name=${e(n)}`,
    store: { android: GH("KaringX/karing"), ios: APPLE("karing", "6472431552"), windows: GH("KaringX/karing"), macos: GH("KaringX/karing") },
  },
  {
    id: "singbox", name: "sing-box", tone: "gold", platforms: ["android", "ios", "macos"],
    build: (u, n) => `sing-box://import-remote-profile?url=${e(u)}#${e(n)}`,
    store: { android: PLAY("io.nekohasekai.sfa"), ios: APPLE("sing-box-vt", "6673731168"), macos: APPLE("sing-box-vt", "6673731168") },
  },
  {
    id: "streisand", name: "Streisand", tone: "info", platforms: ["ios", "macos"],
    build: (u) => `streisand://import/${u}`,
    store: { ios: APPLE("streisand", "6450534064"), macos: APPLE("streisand", "6450534064") },
  },
  {
    id: "shadowrocket", name: "Shadowrocket", tone: "violet", platforms: ["ios"],
    build: (u, n) => `shadowrocket://add/sub://${btoa(u)}?remark=${e(n)}`,
    store: { ios: APPLE("shadowrocket", "932747118") },
  },
  {
    id: "v2rayn", name: "v2rayN", tone: "blue", platforms: ["windows"],
    build: (u) => `v2rayn://install-sub?url=${e(u)}`,
    store: { windows: GH("2dust/v2rayN") },
  },
  {
    id: "clash", name: "FlClash / Clash", tone: "green", platforms: ["android", "windows", "macos"],
    build: (u) => `clash://install-config?url=${e(u)}`,
    store: { android: GH("chen08209/FlClash"), windows: GH("chen08209/FlClash"), macos: GH("chen08209/FlClash") },
  },
]

export const appById = (id?: string | null) => APPS.find((a) => a.id === id)

export function appsFor(platform: Platform, defaultId?: string | null): VpnApp[] {
  const list = APPS.filter((a) => a.platforms.includes(platform))
  const rank = (a: VpnApp) => (a.id === defaultId ? -2 : a.featured ? -1 : 0)
  return [...list].sort((a, b) => rank(a) - rank(b))
}

export function detectPlatform(): Platform {
  try {
    const saved = localStorage.getItem("open_platform") as Platform | null
    if (saved && PLATFORMS.some((p) => p.value === saved)) return saved
  } catch { /* ignore */ }
  const ua = navigator.userAgent || ""
  if (/android/i.test(ua)) return "android"
  if (/iphone|ipad|ipod/i.test(ua)) return "ios"
  if (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) return "ios"
  if (/windows/i.test(ua)) return "windows"
  if (/mac/i.test(ua)) return "macos"
  return "android"
}
export function rememberPlatform(p: Platform) { try { localStorage.setItem("open_platform", p) } catch { /* ignore */ } }

/** Telegram's webview blocks custom schemes -> go through the backend relay page. */
export function launchLink(deeplink: string) {
  const relay = `${BASE_URL}/open-app?to=${encodeURIComponent(deeplink)}`
  try {
    if (WebApp.initData) { WebApp.openLink(relay); return }
  } catch { /* outside telegram */ }
  window.open(relay, "_blank")
}
export function openExternal(url: string) {
  try {
    if (WebApp.initData) { WebApp.openLink(url); return }
  } catch { /* ignore */ }
  window.open(url, "_blank")
}
