import type { ReactNode } from "react";

interface AppLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppLayout({ header, children }: AppLayoutProps) {
  return (
    <>
      {header}
      <main className="page-shell page-content">{children}</main>
    </>
  );
}
