// Ícones e ornamentos em SVG de traço fino, em currentColor.
// Centralizados aqui para que a página de visão geral, a sidebar e
// qualquer outra tela do painel usem exatamente os mesmos desenhos,
// evitando divergência visual entre arquivos.

export function RamoBotanico({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="20"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2 10 H48" stroke="currentColor" strokeWidth="0.75" />
      <path d="M72 10 H118" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="60" cy="10" r="2.5" stroke="currentColor" strokeWidth="0.75" fill="none" />
      <path d="M52 10c2-3 5-4 6-3M52 10c2 3 5 4 6 3M68 10c-2-3-5-4-6-3M68 10c-2 3-5 4-6 3" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M40 10c-2-2.5-2-5 0-6M32 10c-2-2-1.5-4.5 0-6" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M80 10c2-2.5 2-5 0-6M88 10c2-2 1.5-4.5 0-6" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
    </svg>
  );
}

export function LouroLateral({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="26"
      height="46"
      viewBox="0 0 26 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <path d="M24 2C14 10 10 22 12 44" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M12 8c-4 0-7 2-9 5M14 15c-4 0-7 1.5-9.5 4.5M16 22c-4 0-7 1.5-9.5 4.5M17.5 30c-3.5 0-6.5 1.5-9 4.5M18.5 38c-3 0-5.5 1.5-8 4" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconePessoas() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.5 5.3c1.5.3 2.6 1.6 2.6 3.2 0 1.5-1 2.8-2.4 3.2M18 13.8c1.9.6 3.2 2.4 3.2 4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconeCheck() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.3l2.6 2.6L16.2 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeCifrao() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 7.5c0-1.7-1.8-2.8-4-2.8s-4 1.1-4 2.8 1.8 2.5 4 3c2.2.5 4 1.3 4 3s-1.8 2.8-4 2.8-4-1.1-4-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconeTarefas() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 4.5V3.5C9 2.7 9.7 2 10.5 2h3c.8 0 1.5.7 1.5 1.5v1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 11.5l1.8 1.8L14.5 9.5M8.5 16.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconePredio() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="3" width="10" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 21v-6h4v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 7h1M11 7h1M8 11h1M11 11h1M8 15h1M11 15h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}