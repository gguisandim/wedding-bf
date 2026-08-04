import type { ReactNode } from "react";

import Sidebar from "@/components/dashboard/sidebar";
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
    <div className="dashboard-shell">
      <Sidebar
        wedding={{
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          weddingDate: wedding.weddingDate,
          role: wedding.role,
          memberType: wedding.memberType,
        }}
      />

      <main className="dashboard-main">
        <div className="dashboard-container">
          {children}
        </div>
      </main>
    </div>
  );
}