import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CharactersWorkspace } from "./characters-client";

export const dynamic = "force-dynamic";

export default async function CharactersPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { characters: { orderBy: { createdAt: "asc" } } },
  });
  if (!project) notFound();

  return (
    <CharactersWorkspace
      projectId={project.id}
      projectTitle={project.title}
      initialCharacters={project.characters}
    />
  );
}
