"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import Sidebar, {
  type SidebarWedding,
} from "@/components/dashboard/sidebar";

import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  children: ReactNode;
  wedding: SidebarWedding;
};

export default function DashboardShell({
  children,
  wedding,
}: DashboardShellProps) {
  const [
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  ] = useState(false);

  useEffect(() => {
    const mobileQuery =
      window.matchMedia(
        "(max-width: 900px)",
      );

    function collapseOnMobile() {
      if (mobileQuery.matches) {
        setIsSidebarCollapsed(true);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsSidebarCollapsed(true);
      }
    }

    function handleCollapseRequest() {
      setIsSidebarCollapsed(true);
    }

    collapseOnMobile();

    mobileQuery.addEventListener(
      "change",
      collapseOnMobile,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    window.addEventListener(
      "dashboard:collapse-sidebar",
      handleCollapseRequest,
    );

    return () => {
      mobileQuery.removeEventListener(
        "change",
        collapseOnMobile,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      window.removeEventListener(
        "dashboard:collapse-sidebar",
        handleCollapseRequest,
      );
    };
  }, []);

  const shellStyle: CSSProperties = {
    gridTemplateColumns:
      isSidebarCollapsed
        ? "minmax(0, 1fr)"
        : "var(--dashboard-sidebar-width, 220px) minmax(0, 1fr)",
  };

  return (
    <div
      className="dashboard-shell"
      style={shellStyle}
    >
      {!isSidebarCollapsed && (
        <>
          <button
            type="button"
            className={styles.mobileBackdrop}
            aria-label="Fechar menu lateral"
            onClick={() =>
              setIsSidebarCollapsed(true)
            }
          />

          <Sidebar
            wedding={wedding}
            onCollapse={() =>
              setIsSidebarCollapsed(true)
            }
          />
        </>
      )}

      {isSidebarCollapsed && (
        <button
          type="button"
          className={styles.openButton}
          aria-label="Abrir menu lateral"
          title="Abrir menu lateral"
          onClick={() =>
            setIsSidebarCollapsed(false)
          }
        >
          <span aria-hidden="true">
            ☰
          </span>

          <span
            className={styles.openButtonLabel}
          >
            Menu
          </span>
        </button>
      )}

      <main className="dashboard-main">
        <div className="dashboard-container">
          {children}
        </div>
      </main>
    </div>
  );
}
