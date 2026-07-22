"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="barra-lateral">
      <div className="marca-barra">
        <span className="marca-eyebrow">Casamento</span>
        <h2>Painel do casamento</h2>
      </div>

      <nav className="navegacao">
        {links.map((link) => {
          const ativo =
            link.href === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`link-nav${ativo ? " ativo" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}