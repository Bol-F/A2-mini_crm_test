import type { ReactNode } from "react";

interface AppLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppLayout({ header, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
