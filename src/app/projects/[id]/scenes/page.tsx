import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScenesWorkspace } from "./scenes-client";

export const dynamic = "force-dynamic";

export default async function ScenesPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      scenes: { orderBy: { sceneNumber: "asc" } },
      beats: { orderBy: { order: "asc" } },
    },
  });
  if (!project) notFound();

  return (
    <ScenesWorkspace
      projectId={project.id}
      projectTitle={project.title}
      beats={project.beats.map((beat) => ({ id: beat.id, title: beat.title, act: beat.act }))}
      initialScenes={project.scenes}
    />
  );
}
