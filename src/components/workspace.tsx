"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STAGES = [
  { slug: "", label: "Project", index: "00" },
  { slug: "idea", label: "Idea", index: "01" },
  { slug: "characters", label: "Characters", index: "02" },
  { slug: "beats", label: "Story Beats", index: "03" },
  { slug: "scenes", label: "Scenes", index: "04" },
  { slug: "screenplay", label: "Screenplay", index: "05" },
];

export function Workspace({
  projectId,
  projectTitle,
  title,
  subtitle,
  actions,
  aside,
  children,
}: {
  projectId: string;
  projectTitle: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <nav className="hidden w-56 shrink-0 flex-col border-r border-white/5 bg-ink-900/60 p-4 lg:flex no-print">
        <Link href="/" className="mb-6 block">
          <span className="text-sm font-semibold tracking-tight text-neutral-100">AI Screenplay Studio</span>
        </Link>
        <p className="mb-4 truncate text-xs uppercase tracking-widest text-neutral-600">{projectTitle}</p>
        <ul className="flex flex-col gap-1">
          {STAGES.map((stage) => {
            const href = `/projects/${projectId}${stage.slug ? `/${stage.slug}` : ""}`;
            const active = pathname === href;
            return (
              <li key={stage.slug}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-accent/10 text-accent-soft"
                      : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
                  }`}
                >
                  <span className="font-mono text-[10px] text-neutral-600">{stage.index}</span>
                  {stage.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto pt-6">
          <Link href="/projects" className="btn-quiet w-full justify-start px-3">
            All projects
          </Link>
        </div>
      </nav>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/80 px-6 py-4 backdrop-blur no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">{title}</h1>
              {subtitle ? <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>

      {aside ? (
        <aside className="hidden w-80 shrink-0 border-l border-white/5 bg-ink-900/50 p-4 xl:block no-print">
          <div className="sticky top-4 space-y-4">{aside}</div>
        </aside>
      ) : null}
    </div>
  );
}
