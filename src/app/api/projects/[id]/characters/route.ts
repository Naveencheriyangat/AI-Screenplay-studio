import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { characterSchema } from "@/lib/ai/service";

const createSchema = z.object({ characters: z.array(characterSchema.partial().extend({ name: z.string().min(1) })) });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return handle(() =>
    prisma.character.findMany({ where: { projectId: params.id }, orderBy: { createdAt: "asc" } }),
  );
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { characters } = createSchema.parse(await request.json());
    return prisma.$transaction(
      characters.map((character) => prisma.character.create({ data: { ...character, projectId: params.id } })),
    );
  });
}
