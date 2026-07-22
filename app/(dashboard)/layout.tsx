import type { ReactNode } from "react";
import Link from "next/link";

const links = [
  { href: "/painel", label: "Visão geral" },
  { href: "/painel/convidados", label: "Convidados" },
  { href: "/painel/mesas", label: "Mesas" },
  { href: "/painel/tarefas", label: "Tarefas" },
  { href: "/painel/fornecedores", label: "Fornecedores" },
  { href: "/painel/financeiro", label: "Financeiro" },
  { href: "/painel/presentes", label: "Presentes" },
  { href: "/painel/fotos", label: "Fotos" },
  { href: "/painel/configuracoes", label: "Configurações" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 250,
          padding: 24,
          background: "#ffffff",
          borderRight: "1px solid #e4e4e7",
        }}
      >
        <h2>Painel do casamento</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
