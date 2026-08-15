import { z } from "zod";
import { handle } from "@/lib/api";
import { buildProjectContext } from "@/lib/context";
import { providerName } from "@/lib/ai";
import {
  checkContinuity,
  expandIdea,
  generateCharacters,
  generateConflict,
  generateLogline,
  generatePremise,
  generateRelationships,
  generateSceneScreenplay,
  generateScenes,
  generateStoryBeats,
  generateStoryDirections,
  generateStoryQuestions,
  generateTheme,
  improveCharacter,
  rewriteText,
} from "@/lib/ai/service";

const bodySchema = z.object({
  action: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { action, payload } = bodySchema.parse(await request.json());
    const context = await buildProjectContext(params.id);
    const value = await run(action, context, payload);
    return { provider: providerName(), action, result: value };
  });
}

async function run(
  action: string,
  context: Awaited<ReturnType<typeof buildProjectContext>>,
  payload: Record<string, unknown>,
) {
  switch (action) {
    case "expandIdea":
      return expandIdea(context);
    case "logline":
      return generateLogline(context);
    case "premise":
      return generatePremise(context);
    case "theme":
      return generateTheme(context);
    case "conflict":
      return generateConflict(context);
    case "storyQuestions":
      return generateStoryQuestions(context);
    case "storyDirections":
      return generateStoryDirections(context);
    case "characters":
      return generateCharacters(context, Number(payload.count ?? 4));
    case "improveCharacter":
      return improveCharacter(
        context,
        (payload.character ?? {}) as Record<string, string>,
        (payload.mode ?? "improve") as "improve" | "complex" | "backstory" | "arc",
      );
    case "relationships":
      return generateRelationships(context);
    case "storyBeats":
      return generateStoryBeats(context);
    case "scenes":
      return generateScenes(context, String(payload.beatTitle ?? "Beat"), Number(payload.count ?? 3));
    case "sceneScreenplay":
      return generateSceneScreenplay(
        context,
        {
          heading: String(payload.heading ?? ""),
          characters: String(payload.characters ?? ""),
          purpose: String(payload.purpose ?? ""),
          conflict: String(payload.conflict ?? ""),
          summary: String(payload.summary ?? ""),
        },
        payload.style ? String(payload.style) : undefined,
      );
    case "rewrite":
      return rewriteText(context, String(payload.text ?? ""), String(payload.instruction ?? "Rewrite"));
    case "continuity":
      return checkContinuity(context);
    default:
      throw new Error(`Unknown AI action: ${action}`);
  }
}
