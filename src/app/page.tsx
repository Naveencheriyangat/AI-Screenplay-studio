import Link from "next/link";

const STAGES = ["Idea", "Characters", "Story Beats", "Scenes", "Screenplay"];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="text-sm font-semibold tracking-tight text-neutral-100">AI Screenplay Studio</span>
        <Link href="/projects" className="btn-quiet">
          My projects
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16">
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-accent/80">Screenwriting collaborator</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Turn your idea into a screenplay.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
          Develop characters, structure your story, write scenes, and generate a properly formatted screenplay with AI.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/projects/new" className="btn-primary px-5 py-3 text-base">
            Start Writing
          </Link>
          <Link href="/demo" className="btn-ghost px-5 py-3 text-base">
            View Demo
          </Link>
        </div>

        <div className="mt-20 flex flex-wrap items-center gap-3">
          {STAGES.map((stage, index) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="panel px-4 py-3">
                <span className="mr-2 font-mono text-[10px] text-neutral-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-neutral-300">{stage}</span>
              </div>
              {index < STAGES.length - 1 ? <span className="text-neutral-700">→</span> : null}
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 py-6 text-sm text-neutral-600">
        AI suggests → you review → you edit or accept. Your pages stay yours.
      </footer>
    </div>
  );
}
