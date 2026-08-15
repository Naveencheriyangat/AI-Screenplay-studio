import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { characterSchema } from "@/lib/ai/service";

const updateSchema = characterSchema.partial();

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const data = updateSchema.parse(await request.json());
    return prisma.character.update({ where: { id: params.id }, data });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.character.delete({ where: { id: params.id } }));
}
