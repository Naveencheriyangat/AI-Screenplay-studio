export type ElementType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "shot";

export interface ScreenplayLine {
  type: ElementType;
  text: string;
}

const SCENE_HEADING = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i;
const TRANSITION = /^(FADE (IN|OUT)|CUT TO|SMASH CUT TO|DISSOLVE TO|MATCH CUT TO|FADE TO BLACK)[:.]?$/i;
const SHOT = /^(ANGLE ON|CLOSE ON|POV|INSERT|WIDE ON|TRACKING SHOT|AERIAL SHOT)\b/i;
const PARENTHETICAL = /^\(.*\)$/;
const CHARACTER_CUE = /^[A-Z0-9 .'`\-]+(\([A-Z. ]+\))?$/;

export function classifyLines(content: string): ScreenplayLine[] {
  const rawLines = content.replace(/\r\n/g, "\n").split("\n");
  const lines: ScreenplayLine[] = [];
  let previous: ElementType | null = null;

  for (const raw of rawLines) {
    const text = raw.trim();
    if (!text) {
      previous = null;
      lines.push({ type: "action", text: "" });
      continue;
    }

    let type: ElementType;
    if (SCENE_HEADING.test(text)) type = "scene-heading";
    else if (TRANSITION.test(text)) type = "transition";
    else if (SHOT.test(text)) type = "shot";
    else if (PARENTHETICAL.test(text)) type = "parenthetical";
    else if (previous === "character" || previous === "parenthetical" || previous === "dialogue") type = "dialogue";
    else if (text === text.toUpperCase() && text.length <= 45 && CHARACTER_CUE.test(text)) type = "character";
    else type = "action";

    lines.push({ type, text });
    previous = type;
  }

  return lines;
}

export function buildSceneHeading(intExt: string, location: string, timeOfDay: string): string {
  return `${intExt.trim().toUpperCase()} ${location.trim().toUpperCase()} - ${timeOfDay.trim().toUpperCase()}`.replace(
    /\s+/g,
    " ",
  );
}

export interface ExportScene {
  sceneNumber: number;
  heading: string;
  screenplayContent: string;
  summary: string;
}

export function buildScreenplayText(
  project: { title: string; genre: string; format: string },
  scenes: ExportScene[],
): string {
  const header = [project.title.toUpperCase(), "", `A ${project.genre || "screenplay"} — ${project.format}`, "", ""];
  const body = scenes.flatMap((scene) => {
    const content = scene.screenplayContent.trim();
    if (content) return [content, "", ""];
    return [scene.heading.toUpperCase(), "", scene.summary || "(scene not yet written)", "", ""];
  });
  return [...header, ...body].join("\n").replace(/\n{4,}/g, "\n\n\n");
}

/** Fountain export is not enabled in the MVP, but the screenplay model is already Fountain-shaped. */
export function buildFountainText(
  project: { title: string; genre: string; format: string },
  scenes: ExportScene[],
): string {
  const titlePage = [`Title: ${project.title}`, `Credit: written by`, `Draft date: ${new Date().toISOString().slice(0, 10)}`, "", ""];
  return [...titlePage, buildScreenplayText(project, scenes)].join("\n");
}
