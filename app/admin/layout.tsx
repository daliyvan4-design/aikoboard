import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ROLE_LABELS } from "@/lib/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const pendingCount = await prisma.commande.count({
    where: { statut: "EN_ATTENTE" },
  });

  return (
    <AdminShell
      adminName={session.user.name}
      adminRole={ROLE_LABELS[session.user.role]}
      userRole={session.user.role}
      pendingCount={pendingCount}
    >
      {children}
    </AdminShell>
  );
}
