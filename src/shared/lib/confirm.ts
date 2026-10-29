import WebApp from "@twa-dev/sdk"
/** Native Telegram confirm (falls back to window.confirm). */
export const ask = (msg: string): Promise<boolean> =>
  new Promise((res) => {
    try { WebApp.showConfirm(msg, (ok: boolean) => res(!!ok)) } catch { res(window.confirm(msg)) }
  })
