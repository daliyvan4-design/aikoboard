"use client";

import { createContext, useContext, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "./toast";
import { Role } from "@prisma/client";

const SidebarContext = createContext<{ toggleSidebar: () => void }>({ toggleSidebar: () => {} });
export const useSidebar = () => useContext(SidebarContext);

interface AdminShellProps {
  adminName: string;
  adminRole: string;
  userRole: Role;
  pendingCount: number;
  children: React.ReactNode;
}

export function AdminShell({ adminName, adminRole, userRole, pendingCount, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <ToastProvider>
        <SidebarContext.Provider value={{ toggleSidebar: () => setSidebarOpen((o) => !o) }}>
          <div className="min-h-screen flex">
            <Sidebar
              adminName={adminName}
              adminRole={adminRole}
              userRole={userRole}
              pendingCount={pendingCount}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            {/* min-w-0 : sans lui, cet element flex ne peut pas retrecir
                sous la largeur de son contenu. Un tableau large poussait
                toute la page a 711 px sur un ecran de 375 px, forcant un
                scroll horizontal sur tout le back-office. */}
            <main className="flex-1 min-w-0 bg-cream min-h-screen lg:ml-0">
              {children}
            </main>
          </div>
        </SidebarContext.Provider>
      </ToastProvider>
    </SessionProvider>
  );
}
