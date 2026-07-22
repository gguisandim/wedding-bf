"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RamoBotanico } from "@/components/ornamentos";

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
  const pathname = usePathname();

  return (
    <div className="layout-casamento">
      <aside className="barra-lateral">
        <div className="marca-barra">
          <span className="marca-eyebrow">Casamento</span>
          <h2>Painel do casamento</h2>
          <RamoBotanico className="marca-ramo" />
        </div>

        <nav className="navegacao">
          {links.map((link) => {
            const ativo =
              link.href === "/painel"
                ? pathname === "/painel"
                : pathname?.startsWith(link.href);

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

      <main className="conteudo-principal">{children}</main>

      <style>{`
        .layout-casamento {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: var(--font-body), 'Jost', sans-serif;
        }

        .barra-lateral {
          display: flex;
          flex-direction: column;
          gap: 34px;
          width: 260px;
          flex-shrink: 0;
          padding: 34px 22px;
          background: var(--surface);
          border-right: 1px solid var(--line);
        }

        .marca-barra h2 {
          margin: 6px 0 0;
          font-family: var(--font-display), 'Cormorant Garamond', serif;
          font-weight: 600;
          font-style: italic;
          font-size: 23px;
          line-height: 1.25;
          color: var(--ink);
        }

        .marca-eyebrow {
          display: block;
          color: var(--blue-deep);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .marca-ramo {
          width: 100%;
          max-width: 170px;
          height: auto;
          margin-top: 16px;
          color: var(--sage);
        }

        .navegacao {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .link-nav {
          padding: 10px 12px;
          border-left: 2px solid transparent;
          border-radius: 4px;
          color: var(--ink-soft);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .link-nav:hover {
          background: var(--surface-soft);
          color: var(--ink);
        }

        .link-nav.ativo {
          background: var(--blue-pale);
          border-left-color: var(--blue-deep);
          color: var(--blue-deep);
          font-weight: 600;
        }

        .conteudo-principal {
          flex: 1;
          min-width: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .link-nav {
            transition: none;
          }
        }

        @media (max-width: 900px) {
          .layout-casamento {
            flex-direction: column;
          }

          .barra-lateral {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 18px 20px;
            border-right: none;
            border-bottom: 1px solid var(--line);
          }

          .marca-ramo {
            display: none;
          }

          .navegacao {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 4px 6px;
          }

          .link-nav {
            padding: 6px 10px;
            border-left: none;
            border-bottom: 2px solid transparent;
          }

          .link-nav.ativo {
            border-left-color: transparent;
            border-bottom-color: var(--blue-deep);
          }
        }
      `}</style>
    </div>
  );
}