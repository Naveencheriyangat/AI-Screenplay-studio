export type AITask =
  | "expandIdea"
  | "logline"
  | "premise"
  | "theme"
  | "conflict"
  | "storyQuestions"
  | "storyDirections"
  | "characters"
  | "improveCharacter"
  | "characterBackstory"
  | "characterArc"
  | "characterRelationships"
  | "storyBeats"
  | "scenes"
  | "sceneScreenplay"
  | "rewriteText"
  | "continuity";

export interface ProjectContext {
  project: {
    title: string;
    genre: string;
    language: string;
    format: string;
    duration: number;
    tone: string;
    reference: string;
    originalIdea: string;
    logline: string;
    premise: string;
    theme: string;
    conflict: string;
    storyQuestions: string;
    structure: string;
  };
  characters: Array<{
    name: string;
    role: string;
    age: string;
    goal: string;
    motivation: string;
    fear: string;
    flaw: string;
    strength: string;
    secret: string;
    relationship: string;
    characterArc: string;
    personality: string;
    background: string;
  }>;
  beats: Array<{
    act: string;
    order: number;
    title: string;
    description: string;
    characters: string;
    location: string;
    purpose: string;
  }>;
  scenes: Array<{
    sceneNumber: number;
    heading: string;
    characters: string;
    purpose: string;
    conflict: string;
    summary: string;
    hasScreenplay: boolean;
  }>;
  locations: string[];
  timeline: string[];
  facts: string[];
}

export interface AIRequest {
  task: AITask;
  system: string;
  user: string;
  context: ProjectContext;
  payload: Record<string, unknown>;
}

export interface LLMProvider {
  readonly name: string;
  run(request: AIRequest): Promise<unknown>;
}
