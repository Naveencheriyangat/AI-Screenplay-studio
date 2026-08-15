import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

const createSchema = z.object({ label: z.string().default("Manual save") });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return handle(() =>
    prisma.version.findMany({ where: { sceneId: params.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  );
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { label } = createSchema.parse(await request.json().catch(() => ({})));
    const scene = await prisma.scene.findUniqueOrThrow({ where: { id: params.id } });
    return prisma.version.create({
      data: {
        projectId: scene.projectId,
        sceneId: scene.id,
        kind: "scene",
        label,
        content: scene.screenplayContent,
      },
    });
  });
}
