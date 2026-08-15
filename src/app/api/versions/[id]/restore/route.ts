import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const version = await prisma.version.findUniqueOrThrow({ where: { id: params.id } });
    if (!version.sceneId) throw new Error("This version is not attached to a scene");

    const scene = await prisma.scene.findUniqueOrThrow({ where: { id: version.sceneId } });
    if (scene.screenplayContent.trim() && scene.screenplayContent !== version.content) {
      await prisma.version.create({
        data: {
          projectId: scene.projectId,
          sceneId: scene.id,
          kind: "scene",
          label: `Before restoring "${version.label}"`,
          content: scene.screenplayContent,
        },
      });
    }

    return prisma.scene.update({
      where: { id: scene.id },
      data: { screenplayContent: version.content },
    });
  });
}
