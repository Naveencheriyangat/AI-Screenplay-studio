import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.string().optional(),
  role: z.string().optional(),
  occupation: z.string().optional(),
  personality: z.string().optional(),
  appearance: z.string().optional(),
  background: z.string().optional(),
  goal: z.string().optional(),
  motivation: z.string().optional(),
  fear: z.string().optional(),
  flaw: z.string().optional(),
  strength: z.string().optional(),
  secret: z.string().optional(),
  relationship: z.string().optional(),
  characterArc: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const data = updateSchema.parse(await request.json());
    return prisma.character.update({ where: { id: params.id }, data });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.character.delete({ where: { id: params.id } }));
}
