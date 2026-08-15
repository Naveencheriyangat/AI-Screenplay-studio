import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildScreenplayText, classifyLines } from "@/lib/screenplay";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { scenes: { orderBy: { sceneNumber: "asc" } } },
  });
  if (!project) notFound();

  const text = buildScreenplayText(project, project.scenes);
  const lines = classifyLines(text);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between no-print">
        <div>
          <h1 className="text-lg font-semibold text-neutral-100">{project.title}</h1>
          <p className="text-sm text-neutral-500">Print or save as PDF to keep screenplay formatting.</p>
        </div>
        <PrintButton />
      </div>

      <div className="screenplay rounded-lg bg-white p-10 text-black print:rounded-none print:p-0">
        {lines.map((line, index) => (
          <p key={index} className={`sp-${line.type}`}>
            {line.text || "\u00a0"}
          </p>
        ))}
      </div>
    </div>
  );
}
