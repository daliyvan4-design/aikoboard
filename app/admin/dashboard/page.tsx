import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardUltra } from "@/components/admin/dashboard-ultra";
import { DashboardSuper } from "@/components/admin/dashboard-super";
import { DashboardConcierge } from "@/components/admin/dashboard-concierge";
import { DashboardInstitutionnel } from "@/components/admin/dashboard-institutionnel";
import { DashboardScanner } from "@/components/admin/dashboard-scanner";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "SCANNER") return <DashboardScanner />;
  if (role === "AGENT_INSTITUTIONNEL") return <DashboardInstitutionnel />;
  if (role === "CONCIERGE") return <DashboardConcierge />;
  if (role === "SUPERVISEUR") return <DashboardSuper />;
  return <DashboardUltra />;
}
