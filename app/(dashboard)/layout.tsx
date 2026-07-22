import type { ReactNode } from "react";

import Sidebar from "@/components/dashboard/sidebar";

import "./dashboard.css";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-shell">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-container">{children}</div>
      </main>
    </div>
  );
}