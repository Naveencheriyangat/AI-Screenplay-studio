import { z } from "zod";
import { getCurrentUser, prisma } from "@/lib/db";
import { handle } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  genre: z.string().default(""),
  language: z.string().default("English"),
  format: z.string().default("Feature Film"),
  duration: z.coerce.number().int().positive().default(90),
  tone: z.string().default(""),
  reference: z.string().default(""),
  originalIdea: z.string().default(""),
});

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    return prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { characters: true, beats: true, scenes: true } } },
    });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const body = createSchema.parse(await request.json());
    const user = await getCurrentUser();
    return prisma.project.create({ data: { ...body, userId: user.id } });
  });
}
