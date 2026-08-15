import { z } from "zod";
import { getProvider } from ".";
import type { AITask, ProjectContext } from "./types";

const SYSTEM = `You are an experienced screenwriting collaborator working inside a screenplay development app.
You never replace the writer's work silently: you propose material the writer will review, edit, accept or discard.
You must respect the supplied project memory (project info, characters, beats, scenes) and stay consistent with it.
Always answer with a single JSON object matching exactly the shape requested. No markdown, no commentary.`;

async function call<T extends z.ZodTypeAny>(
  task: AITask,
  user: string,
  context: ProjectContext,
  payload: Record<string, unknown>,
  schema: T,
): Promise<z.infer<T>> {
  const raw = await getProvider().run({ task, system: SYSTEM, user, context, payload });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`AI response failed validation: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  }
  return parsed.data;
}

const textSchema = z.object({ text: z.string().min(1) });

export const characterSchema = z.object({
  name: z.string().min(1),
  age: z.string().default(""),
  role: z.string().default(""),
  occupation: z.string().default(""),
  personality: z.string().default(""),
  appearance: z.string().default(""),
  background: z.string().default(""),
  goal: z.string().default(""),
  motivation: z.string().default(""),
  fear: z.string().default(""),
  flaw: z.string().default(""),
  strength: z.string().default(""),
  secret: z.string().default(""),
  relationship: z.string().default(""),
  characterArc: z.string().default(""),
});

export const beatSchema = z.object({
  act: z.string().default("ACT I"),
  title: z.string().min(1),
  description: z.string().default(""),
  characters: z.string().default(""),
  location: z.string().default(""),
  purpose: z.string().default(""),
});

export const sceneSchema = z.object({
  intExt: z.string().default("INT."),
  location: z.string().default(""),
  timeOfDay: z.string().default("DAY"),
  characters: z.string().default(""),
  purpose: z.string().default(""),
  conflict: z.string().default(""),
  emotionalObjective: z.string().default(""),
  summary: z.string().default(""),
});

export const continuityIssueSchema = z.object({
  severity: z.string().default("info"),
  type: z.string().default("Continuity"),
  message: z.string().min(1),
  sceneNumber: z.number().nullable().default(null),
});

export type GeneratedCharacter = z.infer<typeof characterSchema>;
export type GeneratedBeat = z.infer<typeof beatSchema>;
export type GeneratedScene = z.infer<typeof sceneSchema>;
export type ContinuityIssue = z.infer<typeof continuityIssueSchema>;

export function expandIdea(context: ProjectContext) {
  return call(
    "expandIdea",
    'Expand the writer\'s story idea into a richer paragraph. Return {"text": string}.',
    context,
    {},
    textSchema,
  ).then((r) => r.text);
}

export function generateLogline(context: ProjectContext) {
  return call(
    "logline",
    'Write one industry-standard logline (max 55 words) for this project. Return {"logline": string}.',
    context,
    {},
    z.object({ logline: z.string().min(1) }),
  ).then((r) => r.logline);
}

export function generatePremise(context: ProjectContext) {
  return call(
    "premise",
    'Write a one-paragraph premise. Return {"premise": string}.',
    context,
    {},
    z.object({ premise: z.string().min(1) }),
  ).then((r) => r.premise);
}

export function generateTheme(context: ProjectContext) {
  return call(
    "theme",
    'State the thematic argument of the story in one or two sentences. Return {"theme": string}.',
    context,
    {},
    z.object({ theme: z.string().min(1) }),
  ).then((r) => r.theme);
}

export function generateConflict(context: ProjectContext) {
  return call(
    "conflict",
    'Describe the external and internal conflict. Return {"conflict": string}.',
    context,
    {},
    z.object({ conflict: z.string().min(1) }),
  ).then((r) => r.conflict);
}

export function generateStoryQuestions(context: ProjectContext) {
  return call(
    "storyQuestions",
    'List 5 dramatic story questions the screenplay must answer. Return {"questions": string[]}.',
    context,
    {},
    z.object({ questions: z.array(z.string().min(1)).min(1) }),
  ).then((r) => r.questions);
}

export function generateStoryDirections(context: ProjectContext) {
  return call(
    "storyDirections",
    'Propose 3 distinct directions this story could take. Return {"directions": [{"title": string, "description": string}]}.',
    context,
    {},
    z.object({ directions: z.array(z.object({ title: z.string(), description: z.string() })).min(1) }),
  ).then((r) => r.directions);
}

export function generateCharacters(context: ProjectContext, count = 4) {
  return call(
    "characters",
    `Create ${count} distinct characters grounded in the approved idea, with every field filled. Return {"characters": Character[]}.`,
    context,
    { count },
    z.object({ characters: z.array(characterSchema).min(1) }),
  ).then((r) => r.characters);
}

export function improveCharacter(
  context: ProjectContext,
  character: Partial<GeneratedCharacter>,
  mode: "improve" | "complex" | "backstory" | "arc",
) {
  const task: AITask =
    mode === "backstory" ? "characterBackstory" : mode === "arc" ? "characterArc" : "improveCharacter";
  const instruction =
    mode === "backstory"
      ? "Write a richer background for this character."
      : mode === "arc"
        ? "Write a clear character arc for this character."
        : mode === "complex"
          ? "Make this character more complex: contradictions, subtext, competing desires."
          : "Improve and sharpen this character.";
  return call(
    task,
    `${instruction} Only return the fields you changed. Return {"character": Partial<Character>}.`,
    context,
    { ...character, mode },
    z.object({ character: characterSchema.partial() }),
  ).then((r) => r.character);
}

export function generateRelationships(context: ProjectContext) {
  return call(
    "characterRelationships",
    'Describe each character\'s relationship to the protagonist. Return {"relationships": [{"character": string, "relationship": string}]}.',
    context,
    {},
    z.object({ relationships: z.array(z.object({ character: z.string(), relationship: z.string() })) }),
  ).then((r) => r.relationships);
}

export function generateStoryBeats(context: ProjectContext) {
  return call(
    "storyBeats",
    `Generate a ${context.project.structure} beat outline using the approved idea and characters. Return {"beats": Beat[]} in story order.`,
    context,
    { structure: context.project.structure },
    z.object({ beats: z.array(beatSchema).min(1) }),
  ).then((r) => r.beats);
}

export function generateScenes(context: ProjectContext, beatTitle: string, count = 3) {
  return call(
    "scenes",
    `Break the story beat "${beatTitle}" into ${count} scenes. Return {"scenes": Scene[]}.`,
    context,
    { beatTitle, count },
    z.object({ scenes: z.array(sceneSchema).min(1) }),
  ).then((r) => r.scenes);
}

export function generateSceneScreenplay(
  context: ProjectContext,
  scene: { heading: string; characters: string; purpose: string; conflict: string; summary: string },
  style?: string,
) {
  const styleNote = style ? ` Apply this direction: ${style}.` : "";
  return call(
    "sceneScreenplay",
    `Write this scene as properly formatted screenplay text (scene heading, action, character cues, dialogue, parentheticals only when needed).${styleNote} Return {"screenplay": string}.`,
    context,
    { ...scene, style },
    z.object({ screenplay: z.string().min(1) }),
  ).then((r) => r.screenplay);
}

export function rewriteText(context: ProjectContext, text: string, instruction: string) {
  return call(
    "rewriteText",
    `Rewrite ONLY the supplied excerpt according to the instruction "${instruction}". Keep screenplay formatting. Return {"text": string}.`,
    context,
    { text, instruction },
    textSchema,
  ).then((r) => r.text);
}

export function checkContinuity(context: ProjectContext) {
  return call(
    "continuity",
    'Analyse the screenplay for continuity problems (characters, locations, timeline, unresolved arcs, repetition, contradictions). Return {"issues": Issue[]}.',
    context,
    {},
    z.object({ issues: z.array(continuityIssueSchema) }),
  ).then((r) => r.issues);
}
