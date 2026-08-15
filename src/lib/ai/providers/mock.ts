import type { AIRequest, LLMProvider, ProjectContext } from "../types";

function seedFrom(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  return hash;
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function protagonist(context: ProjectContext): string {
  const lead = context.characters.find((c) => /protagonist|lead/i.test(c.role)) ?? context.characters[0];
  return lead?.name ?? "THE PROTAGONIST";
}

function subject(context: ProjectContext): string {
  const idea = context.project.originalIdea.trim();
  if (!idea) return "an unfinished story";
  return idea.replace(/\s+/g, " ").replace(/\.$/, "");
}

const CHARACTER_TEMPLATES = [
  {
    role: "Protagonist",
    occupation: "Investigator",
    personality: "Driven, guarded, relentlessly curious.",
    appearance: "Weathered coat, tired eyes, always carrying a notebook.",
    goal: "Uncover the truth behind the central mystery.",
    motivation: "A past failure that still keeps them awake.",
    fear: "Discovering they are responsible for what happened.",
    flaw: "Obsessive and distrustful of everyone.",
    strength: "Reads people better than they read themselves.",
    secret: "Kept evidence hidden from the people who trusted them.",
    relationship: "The story is told through their choices.",
    characterArc: "Learns that controlling every outcome is impossible.",
  },
  {
    role: "Antagonist",
    occupation: "Institutional insider",
    personality: "Composed, persuasive, quietly ruthless.",
    appearance: "Immaculate, unhurried, never raises their voice.",
    goal: "Keep the truth buried at any cost.",
    motivation: "Believes the truth would destroy more than the lie.",
    fear: "Losing the control that defines them.",
    flaw: "Certainty that they alone know what is best.",
    strength: "Ten steps ahead of everyone in the room.",
    secret: "Was once on the protagonist's side.",
    relationship: "Mirror image of the protagonist's ambition.",
    characterArc: "Refuses to change, and loses everything because of it.",
  },
  {
    role: "Ally",
    occupation: "Technician",
    personality: "Warm, sardonic, dependable under pressure.",
    appearance: "Practical clothes, hands always busy.",
    goal: "Protect the protagonist from themselves.",
    motivation: "Owes the protagonist a debt they can never repay.",
    fear: "Being left behind again.",
    flaw: "Avoids conflict until it is too late.",
    strength: "Improvises a solution out of nothing.",
    secret: "Has been reporting to the antagonist under duress.",
    relationship: "Oldest friend of the protagonist.",
    characterArc: "Finds the courage to say no.",
  },
  {
    role: "Catalyst",
    occupation: "Witness",
    personality: "Nervous, perceptive, unexpectedly brave.",
    appearance: "Looks younger than they are, always watching the exits.",
    goal: "Be believed.",
    motivation: "Saw something no one else survived.",
    fear: "Being silenced before the story is told.",
    flaw: "Lies reflexively to stay safe.",
    strength: "Remembers every detail.",
    secret: "Withheld the one fact that changes everything.",
    relationship: "Brings the protagonist the inciting evidence.",
    characterArc: "Chooses the truth over safety.",
  },
];

const NAMES = ["MAYA REED", "DANIEL VOSS", "ELENA MARCH", "ARI OKONKWO", "JONAS PIKE", "NORA SAITO"];

const BEAT_PLAN = [
  { act: "ACT I", title: "Opening Image", purpose: "Establish the world and its emotional temperature." },
  { act: "ACT I", title: "Introduction", purpose: "Show the protagonist's ordinary life and central lack." },
  { act: "ACT I", title: "Inciting Incident", purpose: "Disrupt the ordinary world irreversibly." },
  { act: "ACT I", title: "First Major Decision", purpose: "Commit the protagonist to the journey." },
  { act: "ACT II", title: "Rising Conflict", purpose: "Escalate the opposition and raise the stakes." },
  { act: "ACT II", title: "Midpoint", purpose: "Reframe the story with a false victory or defeat." },
  { act: "ACT II", title: "Major Complication", purpose: "Turn an ally or a plan against the protagonist." },
  { act: "ACT II", title: "Lowest Point", purpose: "Strip the protagonist of hope and leverage." },
  { act: "ACT III", title: "Final Confrontation", purpose: "Force the protagonist to face the antagonist directly." },
  { act: "ACT III", title: "Resolution", purpose: "Pay off the theme through a changed choice." },
  { act: "ACT III", title: "Final Image", purpose: "Mirror the opening image, transformed." },
];

const LOCATIONS = [
  "ABANDONED RADIO STATION",
  "RAIN-SLICK PARKING GARAGE",
  "GOVERNMENT ARCHIVE",
  "APARTMENT KITCHEN",
  "HIGHWAY OVERPASS",
  "HOSPITAL CORRIDOR",
];

function screenplayDraft(context: ProjectContext, payload: Record<string, unknown>, seed: number): string {
  const heading = String(payload.heading ?? "INT. LOCATION - NIGHT").toUpperCase();
  const lead = protagonist(context);
  const others = context.characters.filter((c) => c.name !== lead).map((c) => c.name);
  const second = others[0] ?? "THE OTHER";
  const conflict = String(payload.conflict ?? "Neither of them will say what they want.");
  const purpose = String(payload.purpose ?? "The truth moves one step closer to the surface.");

  return [
    heading,
    "",
    `Dust hangs in the beam of a flashlight. ${purpose}`,
    "",
    `${lead} steps into the room, listening to a silence that does not feel empty.`,
    "",
    lead,
    "Who's there?",
    "",
    "Silence. Then --",
    "",
    `${second} (O.S.)`,
    "You shouldn't have come here.",
    "",
    `${lead} freezes. ${conflict}`,
    "",
    second,
    pick(
      [
        "You always did want the version of the truth that let you sleep.",
        "Whatever you think you found, put it back.",
        "There is no version of this where you walk out clean.",
      ],
      seed,
    ),
    "",
    lead,
    "(quietly)",
    "Then help me understand it.",
    "",
    `${second} does not move. Somewhere below them, a machine clicks on by itself.`,
    "",
  ].join("\n");
}

export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async run(request: AIRequest): Promise<unknown> {
    const { context, payload, task } = request;
    const seed = seedFrom(`${task}:${context.project.title}:${JSON.stringify(payload)}`);
    const idea = subject(context);
    const tone = context.project.tone || "grounded and tense";
    const genre = context.project.genre || "drama";

    switch (task) {
      case "expandIdea":
        return {
          text: `${idea}.\n\nThe world of this ${genre} is ${tone}. What begins as a private problem becomes a public one when ${protagonist(
            context,
          ).toLowerCase()} realises the answer implicates the very people offering help. Every step toward the truth costs something that cannot be returned, and by the end the only honest choice is also the most expensive one.`,
        };
      case "logline":
        return {
          logline: `When ${idea}, a ${
            context.characters[0]?.role.toLowerCase() ?? "reluctant protagonist"
          } must confront the one person who knows the truth before the cost of silence becomes permanent.`,
        };
      case "premise":
        return {
          premise: `A ${genre} in which ${idea}. Told over ${context.project.duration} minutes, the story follows the collision between what one person is willing to know and what everyone else has agreed to forget.`,
        };
      case "theme":
        return {
          theme: pick(
            [
              "The truth is only useful to those prepared to pay for it.",
              "Control is the most convincing form of fear.",
              "We protect the people we love by lying to them, and lose them anyway.",
            ],
            seed,
          ),
        };
      case "conflict":
        return {
          conflict: `External: ${protagonist(context)} is opposed by an institution that benefits from the mystery staying unsolved. Internal: they cannot tell whether they want justice or absolution.`,
        };
      case "storyQuestions":
        return {
          questions: [
            "Who benefits if the truth never surfaces?",
            "What did the protagonist do that they have never admitted?",
            "What is the deadline that makes waiting impossible?",
            "Who will the protagonist have to betray to succeed?",
            "What does victory cost that cannot be recovered?",
          ],
        };
      case "storyDirections":
        return {
          directions: [
            {
              title: "The Investigation",
              description: `Play it as a procedural: ${idea}, uncovered clue by clue, with the protagonist's certainty eroding as the evidence grows.`,
            },
            {
              title: "The Intimate Version",
              description: `Keep the scope small. Two people, one apartment, one secret. ${tone} throughout, with the larger world only implied.`,
            },
            {
              title: "The Escalation",
              description: `Open at the point of no return and let the ${genre} widen outward until the personal stakes become public catastrophe.`,
            },
          ],
        };
      case "characters": {
        const count = Number(payload.count ?? 4);
        return {
          characters: Array.from({ length: count }, (_, index) => {
            const template = CHARACTER_TEMPLATES[index % CHARACTER_TEMPLATES.length];
            return {
              name: pick(NAMES, seed, index),
              age: String(28 + ((seed + index * 7) % 25)),
              background: `Shaped by the events that led to "${idea}". Carries the consequences into every scene.`,
              ...template,
            };
          }),
        };
      }
      case "improveCharacter":
      case "characterBackstory":
      case "characterArc": {
        const name = String(payload.name ?? protagonist(context));
        const base: Record<string, string> = {
          personality: `${name} is contained in public and volatile in private; their calm is a performance they can no longer stop giving.`,
          background: `${name} grew up inside the system this story indicts, and learned early that the rules protect the people who write them.`,
          characterArc: `${name} begins by trying to control the outcome and ends by accepting a truth they cannot manage.`,
          secret: `${name} has already broken the promise the story will ask them to keep.`,
          flaw: `${name} mistakes vigilance for love.`,
          motivation: `${name} needs to prove that what happened was not their fault.`,
        };
        if (task === "characterBackstory") return { character: { background: base.background } };
        if (task === "characterArc") return { character: { characterArc: base.characterArc } };
        return { character: base };
      }
      case "characterRelationships":
        return {
          relationships: context.characters.map((character, index) => ({
            character: character.name,
            relationship:
              index === 0
                ? "The protagonist; every other relationship is measured against them."
                : pick(
                    [
                      `Owes ${protagonist(context)} a debt neither of them names.`,
                      `Once trusted ${protagonist(context)} completely, and no longer does.`,
                      `Wants what ${protagonist(context)} wants, for the opposite reason.`,
                    ],
                    seed,
                    index,
                  ),
          })),
        };
      case "storyBeats":
        return {
          beats: BEAT_PLAN.map((beat, index) => ({
            act: beat.act,
            title: beat.title,
            purpose: beat.purpose,
            location: pick(LOCATIONS, seed, index),
            characters: context.characters
              .slice(0, 2)
              .map((c) => c.name)
              .join(", "),
            description: `${beat.title}: ${protagonist(context)} ${pick(
              [
                "is forced to act before they are ready",
                "loses the advantage they were counting on",
                "learns something that reframes the previous scene",
                "makes a choice that cannot be taken back",
              ],
              seed,
              index,
            )}. The ${genre} tone stays ${tone}.`,
          })),
        };
      case "scenes": {
        const beatTitle = String(payload.beatTitle ?? "Beat");
        const count = Number(payload.count ?? 3);
        return {
          scenes: Array.from({ length: count }, (_, index) => ({
            intExt: index % 2 === 0 ? "INT." : "EXT.",
            location: pick(LOCATIONS, seed, index),
            timeOfDay: pick(["NIGHT", "DAY", "DAWN", "DUSK"], seed, index),
            characters: context.characters
              .slice(0, 2)
              .map((c) => c.name)
              .join(", "),
            purpose: `Advance "${beatTitle}" by revealing what the previous scene withheld.`,
            conflict: `${protagonist(context)} wants the truth; the room is arranged to prevent it.`,
            emotionalObjective: pick(
              ["Dread tightening into resolve", "Grief disguised as competence", "Suspicion curdling into certainty"],
              seed,
              index,
            ),
            summary: `${protagonist(context)} pushes for an answer and gets a partial one, at a price.`,
          })),
        };
      }
      case "sceneScreenplay":
        return { screenplay: screenplayDraft(context, payload, seed) };
      case "rewriteText": {
        const text = String(payload.text ?? "");
        const instruction = String(payload.instruction ?? "rewrite");
        const lines = text.split("\n").filter(Boolean);
        const rewritten = lines
          .map((line) =>
            line.trim().toUpperCase() === line.trim() && line.trim().length < 40
              ? line
              : `${line.replace(/\.$/, "")} -- ${pick(
                  [
                    "and neither of them looks away",
                    "the sentence lands harder than intended",
                    "the silence afterwards does the rest",
                  ],
                  seed,
                )}.`,
          )
          .join("\n");
        return {
          text: rewritten || `(${instruction}) ${text}`,
        };
      }
      case "continuity": {
        const issues: Array<{ severity: string; type: string; message: string; sceneNumber: number | null }> = [];
        const introduced = new Set<string>();
        context.scenes.forEach((scene) => {
          scene.characters
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
            .forEach((name) => {
              const known = context.characters.some((c) => c.name.toLowerCase() === name.toLowerCase());
              if (!known && !introduced.has(name)) {
                issues.push({
                  severity: "warning",
                  type: "Character appearing before introduction",
                  message: `"${name}" appears in scene ${scene.sceneNumber} but is not part of the approved character list.`,
                  sceneNumber: scene.sceneNumber,
                });
              }
              introduced.add(name);
            });
          if (!scene.hasScreenplay) {
            issues.push({
              severity: "info",
              type: "Missing story thread",
              message: `Scene ${scene.sceneNumber} (${scene.heading}) has no screenplay pages written yet.`,
              sceneNumber: scene.sceneNumber,
            });
          }
        });
        context.characters.forEach((character) => {
          if (!character.characterArc.trim()) {
            issues.push({
              severity: "warning",
              type: "Unresolved character arc",
              message: `${character.name} has no defined character arc, so their ending is unmotivated.`,
              sceneNumber: null,
            });
          }
        });
        const headings = context.scenes.map((s) => s.heading);
        headings.forEach((heading, index) => {
          if (heading && headings.indexOf(heading) !== index) {
            issues.push({
              severity: "info",
              type: "Repeated scenes",
              message: `Scene heading "${heading}" is used more than once; consider varying the location or time.`,
              sceneNumber: context.scenes[index]?.sceneNumber ?? null,
            });
          }
        });
        return { issues };
      }
      default:
        return { text: "" };
    }
  }
}
