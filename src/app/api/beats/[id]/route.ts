import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { beatSchema } from "@/lib/ai/service";

const updateSchema = beatSchema.partial();

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const data = updateSchema.parse(await request.json());
    return prisma.storyBeat.update({ where: { id: params.id }, data });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.storyBeat.delete({ where: { id: params.id } }));
}
