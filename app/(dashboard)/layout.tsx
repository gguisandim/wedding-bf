import type { ReactNode } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="layout-casamento">
      <Sidebar />

      <main className="conteudo-principal">{children}</main>
    </div>
  );
}