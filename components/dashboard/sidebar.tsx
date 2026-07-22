"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Planejamento",
    items: [
      {
        label: "Visão geral",
        href: "/painel",
      },
      {
        label: "Checklist",
        href: "/painel/checklist",
      },
      {
        label: "Cronograma",
        href: "/painel/cronograma",
      },
    ],
  },
  {
    label: "Convidados",
    items: [
      {
        label: "Lista de convidados",
        href: "/painel/convidados",
      },
      {
        label: "RSVP",
        href: "/painel/rsvp",
      },
      {
        label: "Mesas",
        href: "/painel/mesas",
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        label: "Orçamento",
        href: "/painel/financeiro",
      },
      {
        label: "Presentes",
        href: "/painel/presentes",
      },
    ],
  },
  {
    label: "Serviços",
    items: [
      {
        label: "Fornecedores",
        href: "/painel/fornecedores",
      },
    ],
  },
  {
    label: "Evento",
    items: [
      {
        label: "Fotos",
        href: "/painel/fotos",
      },
      {
        label: "Configurações",
        href: "/painel/configuracoes",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/painel") {
      return pathname === "/painel";
    }

    return pathname.startsWith(href);
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-eyebrow">Grande Dia</span>

        <Link href="/painel" className="sidebar-couple">
          Babis &amp; Lipe
        </Link>

        <span className="sidebar-wedding-date">
          18 · 07 · 2027
        </span>
      </div>

      <nav
        className="sidebar-navigation"
        aria-label="Navegação do casamento"
      >
        {menuGroups.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <span className="sidebar-group-title">
              {group.label}
            </span>

            <div className="sidebar-group-items">
              {group.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${
                      active ? "sidebar-link-active" : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="sidebar-link-indicator" />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-monogram">B</span>

        <div>
          <strong>Usuário</strong>
          <span>Administradora</span>
        </div>
      </div>
    </aside>
  );
}