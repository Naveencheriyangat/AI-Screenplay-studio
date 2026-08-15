import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { IdeaWorkspace } from "./idea-client";

export const dynamic = "force-dynamic";

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) notFound();

  return (
    <IdeaWorkspace
      project={{
        id: project.id,
        title: project.title,
        originalIdea: project.originalIdea,
        logline: project.logline,
        premise: project.premise,
        theme: project.theme,
        conflict: project.conflict,
        storyQuestions: project.storyQuestions,
      }}
    />
  );
}
