import { Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
import MainLayout from "@layouts/MainLayout"
import { AdminLayout, ResellerLayout, Need } from "@layouts/AdminLayout"
import { PageSkeleton } from "@/shared/ui/kit"
import HomePage from "@pages/Home/HomePage"

const L = (f: () => Promise<{ default: React.ComponentType<any> }>) => lazy(f)
// user
const WalletPage = L(() => import("@pages/Wallet/WalletPage"))
const ServicesPage = L(() => import("@pages/Services/ServicesPage"))
const ServiceDetailPage = L(() => import("@pages/Services/ServiceDetailPage"))
const SubscriptionPage = L(() => import("@pages/Subscription/SubscriptionPage"))
const ReferralPage = L(() => import("@pages/Referral/ReferralPage"))
const SupportPage = L(() => import("@pages/Support/SupportPage"))
const ProfilePage = L(() => import("@pages/Profile/ProfilePage"))
const SettingsPage = L(() => import("@pages/Settings/SettingsPage"))
const DiscountPage = L(() => import("@pages/Discount/DiscountPage"))
const FreeTrialPage = L(() => import("@pages/FreeTrial/FreeTrialPage"))
const CustomBuildPage = L(() => import("@pages/CustomBuild/CustomBuildPage"))
const PaygPage = L(() => import("@pages/Payg/PaygPage"))
// admin
const AdminHome = L(() => import("@pages/Admin/AdminHome"))
const AdminUsers = L(() => import("@pages/Admin/AdminUsers"))
const AdminUserDetail = L(() => import("@pages/Admin/AdminUserDetail"))
const AdminOrders = L(() => import("@pages/Admin/AdminOrders"))
const AdminReceipts = L(() => import("@pages/Admin/AdminReceipts"))
const AdminTickets = L(() => import("@pages/Admin/AdminTickets"))
const AdminReports = L(() => import("@pages/Admin/AdminReports"))
const AdminCatalog = L(() => import("@pages/Admin/AdminCatalog"))
const AdminDiscounts = L(() => import("@pages/Admin/AdminDiscounts"))
const AdminPanels = L(() => import("@pages/Admin/AdminPanels"))
const AdminPayments = L(() => import("@pages/Admin/AdminPayments"))
const AdminGateways = L(() => import("@pages/Admin/AdminGateways"))
const AdminGrowth = L(() => import("@pages/Admin/AdminGrowth"))
const AdminBackup = L(() => import("@pages/Admin/AdminBackup"))
const AdminFup = L(() => import("@pages/Admin/AdminFup"))
const AdminQueue = L(() => import("@pages/Admin/AdminQueue"))
const AdminManualService = L(() => import("@pages/Admin/AdminManualService"))
const AdminNotifs = L(() => import("@pages/Admin/AdminNotifs"))
const AdminAdvReports = L(() => import("@pages/Admin/AdminAdvReports"))
const AdminGuides = L(() => import("@pages/Admin/AdminGuides"))
const AdminBroadcast = L(() => import("@pages/Admin/AdminBroadcast"))
const AdminAgents = L(() => import("@pages/Admin/AdminAgents"))
const AdminLogs = L(() => import("@pages/Admin/AdminLogs"))
const AdminServices = L(() => import("@pages/Admin/AdminServices"))
const AdminBot = L(() => import("@pages/Admin/AdminBot"))
const AdminMore = L(() => import("@pages/Admin/AdminMore"))
// reseller
const ResellerHome = L(() => import("@pages/Reseller/ResellerHome"))
const ResellerSales = L(() => import("@pages/Reseller/ResellerSales"))
const ResellerPlans = L(() => import("@pages/Reseller/ResellerPlans"))
const ResellerWallet = L(() => import("@pages/Reseller/ResellerWallet"))
const ResellerServices = L(() => import("@pages/Reseller/ResellerServices"))

export default function App() {
  return (
    <Suspense fallback={<main className="x-shell"><PageSkeleton /></main>}>
      <Routes>
        <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Need section="stats"><AdminHome /></Need>} />
          <Route path="users" element={<Need section="users"><AdminUsers /></Need>} />
          <Route path="users/:tid" element={<Need section="users"><AdminUserDetail /></Need>} />
          <Route path="orders" element={<Need section="requests"><AdminOrders /></Need>} />
          <Route path="receipts" element={<Need section="receipts"><AdminReceipts /></Need>} />
          <Route path="tickets" element={<Need section="tickets"><AdminTickets /></Need>} />
          <Route path="reports" element={<Need section="stats"><AdminReports /></Need>} />
          <Route path="catalog" element={<Need section="plans"><AdminCatalog /></Need>} />
          <Route path="discounts" element={<Need section="discounts"><AdminDiscounts /></Need>} />
          <Route path="panels" element={<Need section="vpn_panel"><AdminPanels /></Need>} />
          <Route path="payments" element={<Need section="botinfo"><AdminPayments /></Need>} />
          <Route path="gateways" element={<Need section="botinfo"><AdminGateways /></Need>} />
          <Route path="growth" element={<Need section="referrals"><AdminGrowth /></Need>} />
          <Route path="backup" element={<Need section="botinfo"><AdminBackup /></Need>} />
          <Route path="fup" element={<Need section="vpn_panel"><AdminFup /></Need>} />
          <Route path="queue" element={<Need section="requests"><AdminQueue /></Need>} />
          <Route path="manual-service" element={<Need section="vpn_panel"><AdminManualService /></Need>} />
          <Route path="notifs" element={<Need section="botinfo"><AdminNotifs /></Need>} />
          <Route path="adv-reports" element={<Need section="botinfo"><AdminAdvReports /></Need>} />
          <Route path="guides" element={<Need section="guides"><AdminGuides /></Need>} />
          <Route path="broadcast" element={<Need section="broadcast"><AdminBroadcast /></Need>} />
          <Route path="agents" element={<Need section="agency"><AdminAgents /></Need>} />
          <Route path="logs" element={<Need section="logs"><AdminLogs /></Need>} />
          <Route path="services" element={<Need section="plans"><AdminServices /></Need>} />
          <Route path="bot" element={<Need section="botinfo"><AdminBot /></Need>} />
          <Route path="more" element={<AdminMore />} />
        </Route>

        <Route path="/reseller" element={<ResellerLayout />}>
          <Route index element={<ResellerHome />} />
          <Route path="sales" element={<ResellerSales />} />
          <Route path="plans" element={<ResellerPlans />} />
          <Route path="wallet" element={<ResellerWallet />} />
          <Route path="services" element={<ResellerServices />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/discount" element={<DiscountPage />} />
          <Route path="/free-trial" element={<FreeTrialPage />} />
          <Route path="/custom-build" element={<CustomBuildPage />} />
          <Route path="/payg" element={<PaygPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
