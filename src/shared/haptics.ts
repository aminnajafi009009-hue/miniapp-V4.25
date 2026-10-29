import WebApp from "@twa-dev/sdk";
import { useUiStore } from "@/shared/store/uiStore";

const on = () => useUiStore.getState().haptics;

export function hapticImpact(style: "light" | "medium" | "heavy" = "light") {
  if (!on()) return;
  try { WebApp.HapticFeedback.impactOccurred(style); } catch { /* outside telegram */ }
}
export function hapticNotification(type: "success" | "error" | "warning" = "success") {
  if (!on()) return;
  try { WebApp.HapticFeedback.notificationOccurred(type); } catch { /* outside telegram */ }
}
export function hapticSelect() {
  if (!on()) return;
  try { WebApp.HapticFeedback.selectionChanged(); } catch { /* outside telegram */ }
}
