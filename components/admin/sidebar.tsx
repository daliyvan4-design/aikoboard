"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  ClipboardList,
  Banknote,
  Users,
  CarFront,
  BarChart3,
  Settings,
  LogOut,
  ClipboardCheck,
  Building,
  CalendarDays,
  LucideIcon,
} from "lucide-react";
import { rolesDePage, TOUS_LES_ROLES } from "@/lib/admin-access";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: Role[];
  badge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Tableau de bord", roles: TOUS_LES_ROLES },
  { href: "/admin/briefing", icon: ClipboardCheck, label: "Briefing", roles: rolesDePage("/admin/briefing")},
  { href: "/admin/commandes", icon: ClipboardList, label: "Commandes", badge: true, roles: rolesDePage("/admin/commandes")},
  { href: "/admin/events", icon: CalendarDays, label: "Événements", roles: rolesDePage("/admin/events")},
  { href: "/admin/residences", icon: Building, label: "Residences", roles: rolesDePage("/admin/residences")},
  { href: "/admin/tarifs", icon: Banknote, label: "Tarifs", roles: rolesDePage("/admin/tarifs") },
  { href: "/admin/voyageurs", icon: Users, label: "Voyageurs", roles: rolesDePage("/admin/voyageurs")},
  { href: "/admin/chauffeurs", icon: CarFront, label: "Chauffeurs", roles: rolesDePage("/admin/chauffeurs")},
  { href: "/admin/rapports", icon: BarChart3, label: "Rapports", roles: rolesDePage("/admin/rapports")},
];

const ROLE_DISPLAY: Record<Role, string> = {
  ADMIN: "Admin",
  SUPERVISEUR: "Superviseur",
  CONCIERGE: "Concierge",
  AGENT_INSTITUTIONNEL: "Institutionnel",
  SCANNER: "Scanner",
};

interface SidebarProps {
  adminName: string;
  adminRole: string;
  userRole: Role;
  pendingCount: number;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ adminName, adminRole, userRole, pendingCount, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const initials = adminName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-ink text-cream flex flex-col transform transition-transform lg:transform-none ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-5 py-5 border-b border-cream/10 flex items-center gap-3">
          <span className="flex flex-col gap-1">
            <span className="dot bg-mining" />
            <span className="dot bg-cream/90" />
            <span className="dot bg-energy" />
          </span>
          <div>
            <p className="font-serif text-gold text-[20px] leading-tight tracking-[0.08em] font-bold">AIKO</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cream/50">
              {ROLE_DISPLAY[userRole] ?? userRole}
            </p>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
                  active
                    ? "bg-gradient-to-b from-gold/[0.18] to-gold/[0.08] text-cream shadow-[inset_0_0_0_1px_rgba(201,168,76,0.25)]"
                    : "text-cream/70 hover:bg-white/5 hover:text-cream"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto text-[10px] mono bg-gold text-ink rounded-full px-2 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="h-px bg-cream/10 my-4" />
          <Link
            href="/admin/parametres"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
              pathname === "/parametres"
                ? "bg-gradient-to-b from-gold/[0.18] to-gold/[0.08] text-cream shadow-[inset_0_0_0_1px_rgba(201,168,76,0.25)]"
                : "text-cream/70 hover:bg-white/5 hover:text-cream"
            }`}
          >
            <Settings size={18} />
            <span>Paramètres</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-cream/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-ink font-serif font-semibold text-[13px]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-cream truncate">{adminName}</p>
              <p className="text-[10px] text-cream/50">{adminRole}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-cream/50 hover:text-cream"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
