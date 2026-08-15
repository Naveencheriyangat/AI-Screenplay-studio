import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScreenplayWorkspace } from "./screenplay-client";

export const dynamic = "force-dynamic";

export default async function ScreenplayPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { scenes: { orderBy: { sceneNumber: "asc" } } },
  });
  if (!project) notFound();

  return (
    <ScreenplayWorkspace
      projectId={project.id}
      projectTitle={project.title}
      initialScenes={project.scenes.map((scene) => ({
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        heading: scene.heading,
        screenplayContent: scene.screenplayContent,
      }))}
    />
  );
}
