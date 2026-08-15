import Link from "next/link";
import { getCurrentUser, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { characters: true, beats: true, scenes: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← AI Screenplay Studio
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-100">Projects</h1>
        </div>
        <Link href="/projects/new" className="btn-primary">
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="text-sm text-neutral-400">No projects yet.</p>
          <Link href="/projects/new" className="btn-primary mt-4">
            Start Writing
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/projects/${project.id}`} className="panel block px-5 py-4 transition hover:border-accent/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-100">{project.title}</p>
                    <p className="mt-1 truncate text-sm text-neutral-500">
                      {[project.genre, project.format, `${project.duration} min`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <span className="chip">{project._count.characters} characters</span>
                    <span className="chip">{project._count.beats} beats</span>
                    <span className="chip">{project._count.scenes} scenes</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
