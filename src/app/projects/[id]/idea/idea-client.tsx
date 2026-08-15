"use client";

import Link from "next/link";
import { useState } from "react";
import { Workspace } from "@/components/workspace";
import { Spinner, SuggestionCard } from "@/components/suggestion";
import { useToast } from "@/components/toast";
import { aiAction, api } from "@/lib/client";

interface IdeaProject {
  id: string;
  title: string;
  originalIdea: string;
  logline: string;
  premise: string;
  theme: string;
  conflict: string;
  storyQuestions: string;
}

type Field = "originalIdea" | "logline" | "premise" | "theme" | "conflict" | "storyQuestions";

const ACTIONS: Array<{ action: string; label: string; field: Field }> = [
  { action: "expandIdea", label: "Expand Idea", field: "originalIdea" },
  { action: "logline", label: "Improve Logline", field: "logline" },
  { action: "premise", label: "Generate Premise", field: "premise" },
  { action: "theme", label: "Define Theme", field: "theme" },
  { action: "conflict", label: "Generate Conflict", field: "conflict" },
  { action: "storyQuestions", label: "Generate Story Questions", field: "storyQuestions" },
];

const FIELD_LABELS: Record<Field, string> = {
  originalIdea: "Story idea",
  logline: "Logline",
  premise: "Premise",
  theme: "Theme",
  conflict: "Conflict",
  storyQuestions: "Story questions",
};

export function IdeaWorkspace({ project }: { project: IdeaProject }) {
  const toast = useToast();
  const [values, setValues] = useState(project);
  const [busy, setBusy] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ field: Field; action: string; text: string } | null>(null);
  const [directions, setDirections] = useState<Array<{ title: string; description: string }> | null>(null);

  async function save(patch: Partial<Record<Field, string>>) {
    setValues((current) => ({ ...current, ...patch }));
    await api(`/api/projects/${project.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    toast("Saved", "success");
  }

  async function runAction(action: string, field: Field) {
    setBusy(action);
    try {
      const result = await aiAction<string | string[]>(project.id, action);
      const text = Array.isArray(result) ? result.map((item) => `• ${item}`).join("\n") : result;
      setSuggestion({ field, action, text });
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function runDirections() {
    setBusy("storyDirections");
    try {
      setDirections(await aiAction<Array<{ title: string; description: string }>>(project.id, "storyDirections"));
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Workspace
      projectId={project.id}
      projectTitle={project.title}
      title="Idea development"
      subtitle="Shape the idea before the AI writes anything else. Nothing is overwritten without your approval."
      actions={
        <Link href={`/projects/${project.id}/characters`} className="btn-primary">
          Next: Characters
        </Link>
      }
      aside={
        <div className="panel p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">AI actions</p>
          <div className="flex flex-col gap-2">
            {ACTIONS.map((item) => (
              <button
                key={item.action}
                className="btn-ghost justify-start"
                disabled={busy !== null}
                onClick={() => runAction(item.action, item.field)}
              >
                {item.label}
              </button>
            ))}
            <button className="btn-ghost justify-start" disabled={busy !== null} onClick={runDirections}>
              Suggest 3 Story Directions
            </button>
          </div>
          {busy ? (
            <div className="mt-3">
              <Spinner />
            </div>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {suggestion ? (
          <SuggestionCard
            heading={`Suggested ${FIELD_LABELS[suggestion.field]}`}
            value={suggestion.text}
            busy={busy !== null}
            onAccept={async (text) => {
              await save({ [suggestion.field]: text });
              setSuggestion(null);
            }}
            onRegenerate={() => runAction(suggestion.action, suggestion.field)}
            onDiscard={() => setSuggestion(null)}
          />
        ) : null}

        {directions ? (
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-accent">Three story directions</p>
              <button className="btn-quiet" onClick={() => setDirections(null)}>
                Discard
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {directions.map((direction) => (
                <div key={direction.title} className="rounded-lg border border-white/5 bg-ink-850 p-3">
                  <p className="text-sm font-medium text-neutral-100">{direction.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">{direction.description}</p>
                  <button
                    className="btn-ghost mt-3 w-full"
                    onClick={async () => {
                      await save({ originalIdea: `${values.originalIdea}\n\n${direction.description}`.trim() });
                      setDirections(null);
                    }}
                  >
                    Use this direction
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(Object.keys(FIELD_LABELS) as Field[]).map((field) => (
          <div key={field} className="panel p-4">
            <label className="label" htmlFor={field}>
              {FIELD_LABELS[field]}
            </label>
            <textarea
              id={field}
              className="field min-h-[100px] leading-relaxed"
              value={values[field]}
              placeholder={field === "originalIdea" ? "What is the story about?" : "Empty — ask the AI or write it yourself"}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              onBlur={(event) => save({ [field]: event.target.value })}
            />
          </div>
        ))}
      </div>
    </Workspace>
  );
}
