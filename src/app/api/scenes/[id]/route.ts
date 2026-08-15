import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { buildSceneHeading } from "@/lib/screenplay";

const updateSchema = z.object({
  intExt: z.string().optional(),
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  characters: z.string().optional(),
  purpose: z.string().optional(),
  conflict: z.string().optional(),
  emotionalObjective: z.string().optional(),
  summary: z.string().optional(),
  screenplayContent: z.string().optional(),
  sceneNumber: z.number().int().positive().optional(),
  versionLabel: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { versionLabel, ...data } = updateSchema.parse(await request.json());
    const scene = await prisma.scene.findUniqueOrThrow({ where: { id: params.id } });

    const contentChanged =
      data.screenplayContent !== undefined && data.screenplayContent !== scene.screenplayContent;

    if (contentChanged && scene.screenplayContent.trim()) {
      await prisma.version.create({
        data: {
          projectId: scene.projectId,
          sceneId: scene.id,
          kind: "scene",
          label: versionLabel ?? `Scene ${scene.sceneNumber} snapshot`,
          content: scene.screenplayContent,
        },
      });
    }

    const heading =
      data.intExt || data.location || data.timeOfDay
        ? buildSceneHeading(
            data.intExt ?? scene.intExt,
            data.location ?? scene.location,
            data.timeOfDay ?? scene.timeOfDay,
          )
        : undefined;

    return prisma.scene.update({
      where: { id: params.id },
      data: { ...data, ...(heading ? { heading } : {}) },
    });
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.scene.delete({ where: { id: params.id } }));
}
