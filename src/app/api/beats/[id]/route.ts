import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

const updateSchema = z.object({
  act: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  characters: z.string().optional(),
  location: z.string().optional(),
  purpose: z.string().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const data = updateSchema.parse(await request.json());
    return prisma.storyBeat.update({ where: { id: params.id }, data });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.storyBeat.delete({ where: { id: params.id } }));
}
