"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { formatWeddingDateCompact } from "@/lib/wedding/presentation";

import shellStyles from "./dashboard-shell.module.css";

type WeddingRole =
  Database["public"]["Enums"]["wedding_member_role"];

type WeddingMemberType =
  Database["public"]["Enums"]["wedding_member_type"];

type MenuItem = {
  label: string;
  href: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export type SidebarWedding = {
  brideName: string;
  groomName: string;
  weddingDate: string;
  role: WeddingRole;
  memberType: WeddingMemberType;
};

type SidebarProps = {
  wedding: SidebarWedding;
  onCollapse: () => void;
};

const publicMenuGroups: MenuGroup[] = [
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
      {
        label: "Cerimônia",
        href: "/painel/cerimonia",
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

const privateBrideGroup: MenuGroup = {
  label: "Privado",
  items: [
    {
      label: "Vestido da noiva",
      href: "/painel/fornecedores",
    },
  ],
};

const memberTypeLabels: Record<
  WeddingMemberType,
  string
> = {
  bride: "Noiva",
  groom: "Noivo",
  planner: "Cerimonialista",
  developer: "Desenvolvedor",
  other: "Membro",
};

const roleLabels: Record<
  WeddingRole,
  string
> = {
  owner: "Proprietário",
  admin: "Administrador",
  viewer: "Visualização",
};

function canAccessBridePrivateArea(
  memberType: WeddingMemberType,
): boolean {
  return (
    memberType === "bride" ||
    memberType === "developer"
  );
}

function getMemberName(
  wedding: SidebarWedding,
): string {
  if (wedding.memberType === "bride") {
    return wedding.brideName;
  }

  if (wedding.memberType === "groom") {
    return wedding.groomName;
  }

  return memberTypeLabels[
    wedding.memberType
  ];
}

function getMemberInitial(
  wedding: SidebarWedding,
): string {
  return getMemberName(wedding)
    .charAt(0)
    .toUpperCase();
}

export default function Sidebar({
  wedding,
  onCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const memberName =
    getMemberName(wedding);

  const memberInitial =
    getMemberInitial(wedding);

  const menuGroups =
    canAccessBridePrivateArea(
      wedding.memberType,
    )
      ? [
          ...publicMenuGroups,
          privateBrideGroup,
        ]
      : publicMenuGroups;

  function isActive(href: string) {
    if (href === "/painel") {
      return pathname === "/painel";
    }

    return pathname.startsWith(href);
  }

  return (
    <aside className="dashboard-sidebar">
      <button
        type="button"
        className={
          shellStyles.collapseButton
        }
        aria-label="Recolher menu lateral"
        title="Recolher menu lateral"
        onClick={onCollapse}
      >
        <span aria-hidden="true">
          ‹
        </span>
      </button>

      <div className="sidebar-header">
        <span className="sidebar-eyebrow">
          Grande Dia
        </span>

        <Link
          href="/painel"
          className="sidebar-couple"
        >
          {wedding.brideName}
          {" & "}
          {wedding.groomName}
        </Link>

        <span className="sidebar-wedding-date">
          {formatWeddingDateCompact(
            wedding.weddingDate,
          )}
        </span>
      </div>

      <nav
        className="sidebar-navigation"
        aria-label="Navegação do casamento"
      >
        {menuGroups.map((group) => (
          <div
            className="sidebar-group"
            key={group.label}
          >
            <span className="sidebar-group-title">
              {group.label}
            </span>

            <div className="sidebar-group-items">
              {group.items.map((item) => {
                const active =
                  isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${
                      active
                        ? "sidebar-link-active"
                        : ""
                    }`}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                  >
                    <span className="sidebar-link-indicator" />

                    <span>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span
          className="sidebar-monogram"
          aria-hidden="true"
        >
          {memberInitial}
        </span>

        <div>
          <strong>{memberName}</strong>

          <span>
            {
              memberTypeLabels[
                wedding.memberType
              ]
            }
            {" · "}
            {
              roleLabels[
                wedding.role
              ]
            }
          </span>
        </div>
      </div>
    </aside>
  );
}
