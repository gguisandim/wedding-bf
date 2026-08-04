import type { ReactNode } from "react";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";

import "./dashboard.css";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const wedding =
    await requireCurrentWedding();

  return (
    <DashboardShell
      wedding={{
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        weddingDate: wedding.weddingDate,
        role: wedding.role,
        memberType: wedding.memberType,
      }}
    >
      {children}
    </DashboardShell>
  );
}