import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { beatSchema } from "@/lib/ai/service";

const createSchema = z.object({
  beats: z.array(beatSchema.partial().extend({ title: z.string().min(1) })),
  replace: z.boolean().default(false),
});

const reorderSchema = z.object({ order: z.array(z.string()) });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.storyBeat.findMany({ where: { projectId: params.id }, orderBy: { order: "asc" } }));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { beats, replace } = createSchema.parse(await request.json());
    if (replace) await prisma.storyBeat.deleteMany({ where: { projectId: params.id } });
    const existing = replace ? 0 : await prisma.storyBeat.count({ where: { projectId: params.id } });
    return prisma.$transaction(
      beats.map((beat, index) =>
        prisma.storyBeat.create({ data: { ...beat, order: existing + index, projectId: params.id } }),
      ),
    );
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { order } = reorderSchema.parse(await request.json());
    await prisma.$transaction(
      order.map((beatId, index) => prisma.storyBeat.update({ where: { id: beatId }, data: { order: index } })),
    );
    return prisma.storyBeat.findMany({ where: { projectId: params.id }, orderBy: { order: "asc" } });
  });
}
