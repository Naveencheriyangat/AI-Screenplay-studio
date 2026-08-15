import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";
import { buildFountainText, buildScreenplayText } from "@/lib/screenplay";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const format = new URL(request.url).searchParams.get("format") ?? "txt";
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: params.id },
      include: { scenes: { orderBy: { sceneNumber: "asc" } } },
    });

    const text =
      format === "fountain"
        ? buildFountainText(project, project.scenes)
        : buildScreenplayText(project, project.scenes);

    const extension = format === "fountain" ? "fountain" : "txt";
    const filename = `${project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "screenplay"}.${extension}`;

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return fail(error, 500);
  }
}
