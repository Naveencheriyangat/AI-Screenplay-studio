import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Workspace } from "@/components/workspace";

export const dynamic = "force-dynamic";

function formatTime(date: Date | null) {
  if (!date) return "Not started";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function ProjectDashboard({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      characters: { orderBy: { updatedAt: "desc" } },
      beats: { orderBy: { updatedAt: "desc" } },
      scenes: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!project) notFound();

  const writtenScenes = project.scenes.filter((scene) => scene.screenplayContent.trim()).length;

  const stages = [
    {
      index: "01",
      label: "Idea",
      href: `/projects/${project.id}/idea`,
      done: Boolean(project.logline.trim()),
      count: [project.logline, project.premise, project.theme, project.conflict].filter((value) => value.trim()).length,
      unit: "developed fields",
      updatedAt: project.updatedAt,
    },
    {
      index: "02",
      label: "Characters",
      href: `/projects/${project.id}/characters`,
      done: project.characters.length > 0,
      count: project.characters.length,
      unit: "characters",
      updatedAt: project.characters[0]?.updatedAt ?? null,
    },
    {
      index: "03",
      label: "Story Beats",
      href: `/projects/${project.id}/beats`,
      done: project.beats.length > 0,
      count: project.beats.length,
      unit: "beats",
      updatedAt: project.beats[0]?.updatedAt ?? null,
    },
    {
      index: "04",
      label: "Scenes",
      href: `/projects/${project.id}/scenes`,
      done: project.scenes.length > 0,
      count: project.scenes.length,
      unit: "scenes",
      updatedAt: project.scenes[0]?.updatedAt ?? null,
    },
    {
      index: "05",
      label: "Screenplay",
      href: `/projects/${project.id}/screenplay`,
      done: writtenScenes > 0 && writtenScenes === project.scenes.length,
      count: writtenScenes,
      unit: "written scenes",
      updatedAt: project.scenes[0]?.updatedAt ?? null,
    },
  ];

  return (
    <Workspace
      projectId={project.id}
      projectTitle={project.title}
      title={project.title}
      subtitle={[project.genre, project.format, `${project.duration} min`, project.tone]
        .filter(Boolean)
        .join(" · ")}
      actions={
        <Link href={`/projects/${project.id}/idea`} className="btn-primary">
          Continue writing
        </Link>
      }
      aside={
        <div className="panel p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-neutral-500">Project memory</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-neutral-500">Original idea</dt>
              <dd className="text-neutral-300">{project.originalIdea || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Logline</dt>
              <dd className="text-neutral-300">{project.logline || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Theme</dt>
              <dd className="text-neutral-300">{project.theme || "—"}</dd>
            </div>
          </dl>
        </div>
      }
    >
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.index} className="panel flex flex-wrap items-center gap-4 px-5 py-4">
            <span className="font-mono text-xs text-neutral-600">{stage.index}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-100">{stage.label}</p>
              <p className="mt-0.5 text-sm text-neutral-500">
                {stage.count} {stage.unit} · Updated {formatTime(stage.updatedAt)}
              </p>
            </div>
            <span
              className={`chip ${stage.done ? "border-accent/30 text-accent-soft" : ""}`}
            >
              {stage.done ? "Complete" : stage.count > 0 ? "In progress" : "Not started"}
            </span>
            <Link href={stage.href} className="btn-ghost">
              Continue
            </Link>
          </div>
        ))}
      </div>
    </Workspace>
  );
}
