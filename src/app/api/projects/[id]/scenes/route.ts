import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { sceneSchema } from "@/lib/ai/service";
import { buildSceneHeading } from "@/lib/screenplay";

const createSchema = z.object({
  beatId: z.string().nullable().default(null),
  scenes: z.array(sceneSchema.partial()),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return handle(() => prisma.scene.findMany({ where: { projectId: params.id }, orderBy: { sceneNumber: "asc" } }));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { beatId, scenes } = createSchema.parse(await request.json());
    const last = await prisma.scene.aggregate({ where: { projectId: params.id }, _max: { sceneNumber: true } });
    const start = (last._max.sceneNumber ?? 0) + 1;
    return prisma.$transaction(
      scenes.map((scene, index) =>
        prisma.scene.create({
          data: {
            projectId: params.id,
            beatId,
            sceneNumber: start + index,
            intExt: scene.intExt ?? "INT.",
            location: scene.location ?? "",
            timeOfDay: scene.timeOfDay ?? "DAY",
            heading: buildSceneHeading(scene.intExt ?? "INT.", scene.location ?? "LOCATION", scene.timeOfDay ?? "DAY"),
            characters: scene.characters ?? "",
            purpose: scene.purpose ?? "",
            conflict: scene.conflict ?? "",
            emotionalObjective: scene.emotionalObjective ?? "",
            summary: scene.summary ?? "",
          },
        }),
      ),
    );
  });
}
