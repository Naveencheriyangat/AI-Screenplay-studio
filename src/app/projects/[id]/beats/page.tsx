import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BeatsWorkspace } from "./beats-client";

export const dynamic = "force-dynamic";

export default async function BeatsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { beats: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  return (
    <BeatsWorkspace
      projectId={project.id}
      projectTitle={project.title}
      structure={project.structure}
      initialBeats={project.beats}
    />
  );
}
