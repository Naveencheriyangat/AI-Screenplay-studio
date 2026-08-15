import { prisma } from "./db";
import type { ProjectContext } from "./ai/types";

export async function buildProjectContext(projectId: string): Promise<ProjectContext> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      characters: { orderBy: { createdAt: "asc" } },
      beats: { orderBy: { order: "asc" } },
      scenes: { orderBy: { sceneNumber: "asc" } },
    },
  });

  if (!project) throw new Error("Project not found");

  const locations = Array.from(
    new Set([...project.beats.map((b) => b.location), ...project.scenes.map((s) => s.location)].filter(Boolean)),
  );

  return {
    project: {
      title: project.title,
      genre: project.genre,
      language: project.language,
      format: project.format,
      duration: project.duration,
      tone: project.tone,
      reference: project.reference,
      originalIdea: project.originalIdea,
      logline: project.logline,
      premise: project.premise,
      theme: project.theme,
      conflict: project.conflict,
      storyQuestions: project.storyQuestions,
      structure: project.structure,
    },
    characters: project.characters.map((c) => ({
      name: c.name,
      role: c.role,
      age: c.age,
      goal: c.goal,
      motivation: c.motivation,
      fear: c.fear,
      flaw: c.flaw,
      strength: c.strength,
      secret: c.secret,
      relationship: c.relationship,
      characterArc: c.characterArc,
      personality: c.personality,
      background: c.background,
    })),
    beats: project.beats.map((b) => ({
      act: b.act,
      order: b.order,
      title: b.title,
      description: b.description,
      characters: b.characters,
      location: b.location,
      purpose: b.purpose,
    })),
    scenes: project.scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      characters: s.characters,
      purpose: s.purpose,
      conflict: s.conflict,
      summary: s.summary,
      hasScreenplay: Boolean(s.screenplayContent.trim()),
    })),
    locations,
    timeline: project.scenes.map((s) => `${s.sceneNumber}. ${s.heading}`),
    facts: [
      project.logline && `Logline: ${project.logline}`,
      project.theme && `Theme: ${project.theme}`,
      project.premise && `Premise: ${project.premise}`,
    ].filter(Boolean) as string[],
  };
}
