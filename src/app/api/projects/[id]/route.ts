import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  format: z.string().optional(),
  duration: z.coerce.number().int().positive().optional(),
  tone: z.string().optional(),
  reference: z.string().optional(),
  originalIdea: z.string().optional(),
  logline: z.string().optional(),
  premise: z.string().optional(),
  theme: z.string().optional(),
  conflict: z.string().optional(),
  storyQuestions: z.string().optional(),
  structure: z.string().optional(),
  ideaApproved: z.boolean().optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return handle(() =>
    prisma.project.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        characters: { orderBy: { createdAt: "asc" } },
        beats: { orderBy: { order: "asc" } },
        scenes: { orderBy: { sceneNumber: "asc" } },
      },
    }),
  );
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const data = updateSchema.parse(await request.json());
    return prisma.project.update({ where: { id: params.id }, data });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.project.delete({ where: { id: params.id } }));
}
