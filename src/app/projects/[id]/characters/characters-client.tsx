"use client";

import Link from "next/link";
import { useState } from "react";
import { Workspace } from "@/components/workspace";
import { EmptyState, Spinner } from "@/components/suggestion";
import { useToast } from "@/components/toast";
import { aiAction, api } from "@/lib/client";

export interface CharacterRecord {
  id: string;
  name: string;
  age: string;
  role: string;
  occupation: string;
  personality: string;
  appearance: string;
  background: string;
  goal: string;
  motivation: string;
  fear: string;
  flaw: string;
  strength: string;
  secret: string;
  relationship: string;
  characterArc: string;
}

type CharacterDraft = Omit<CharacterRecord, "id">;

const FIELDS: Array<{ key: keyof CharacterDraft; label: string; long?: boolean }> = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "role", label: "Role" },
  { key: "occupation", label: "Occupation" },
  { key: "personality", label: "Personality", long: true },
  { key: "appearance", label: "Appearance", long: true },
  { key: "background", label: "Background", long: true },
  { key: "goal", label: "Goal", long: true },
  { key: "motivation", label: "Motivation", long: true },
  { key: "fear", label: "Fear", long: true },
  { key: "flaw", label: "Flaw", long: true },
  { key: "strength", label: "Strength", long: true },
  { key: "secret", label: "Secret", long: true },
  { key: "relationship", label: "Relationship to protagonist", long: true },
  { key: "characterArc", label: "Character arc", long: true },
];

const EMPTY: CharacterDraft = FIELDS.reduce(
  (accumulator, field) => ({ ...accumulator, [field.key]: "" }),
  {} as CharacterDraft,
);

export function CharactersWorkspace({
  projectId,
  projectTitle,
  initialCharacters,
}: {
  projectId: string;
  projectTitle: string;
  initialCharacters: CharacterRecord[];
}) {
  const toast = useToast();
  const [characters, setCharacters] = useState<CharacterRecord[]>(initialCharacters);
  const [pending, setPending] = useState<CharacterDraft[] | null>(null);
  const [relationships, setRelationships] = useState<Array<{ character: string; relationship: string }> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function generate() {
    setBusy("generate");
    try {
      setPending(await aiAction<CharacterDraft[]>(projectId, "characters", { count: 4 }));
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function acceptPending() {
    if (!pending) return;
    setBusy("accept");
    try {
      const created = await api<CharacterRecord[]>(`/api/projects/${projectId}/characters`, {
        method: "POST",
        body: JSON.stringify({ characters: pending }),
      });
      setCharacters((current) => [...current, ...created]);
      setPending(null);
      toast(`${created.length} characters added`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save characters", "error");
    } finally {
      setBusy(null);
    }
  }

  async function addManual() {
    const created = await api<CharacterRecord[]>(`/api/projects/${projectId}/characters`, {
      method: "POST",
      body: JSON.stringify({ characters: [{ ...EMPTY, name: "NEW CHARACTER" }] }),
    });
    setCharacters((current) => [...current, ...created]);
  }

  async function updateCharacter(id: string, patch: Partial<CharacterDraft>) {
    setCharacters((current) => current.map((character) => (character.id === id ? { ...character, ...patch } : character)));
    await api(`/api/characters/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async function removeCharacter(id: string) {
    setCharacters((current) => current.filter((character) => character.id !== id));
    await api(`/api/characters/${id}`, { method: "DELETE" });
    toast("Character deleted");
  }

  async function improve(character: CharacterRecord, mode: "improve" | "complex" | "backstory" | "arc") {
    setBusy(`${character.id}:${mode}`);
    try {
      const patch = await aiAction<Partial<CharacterDraft>>(projectId, "improveCharacter", {
        character,
        mode,
      });
      await updateCharacter(character.id, patch);
      toast("Character updated — edit anything you disagree with", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function generateRelationships() {
    setBusy("relationships");
    try {
      setRelationships(await aiAction(projectId, "relationships"));
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Workspace
      projectId={projectId}
      projectTitle={projectTitle}
      title="Characters"
      subtitle="Editable character cards. The AI reuses these whenever it writes beats, scenes and dialogue."
      actions={
        <>
          <button className="btn-ghost" onClick={addManual}>
            Add character
          </button>
          <Link href={`/projects/${projectId}/beats`} className="btn-primary">
            Next: Story Beats
          </Link>
        </>
      }
      aside={
        <div className="panel p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">AI actions</p>
          <div className="flex flex-col gap-2">
            <button className="btn-ghost justify-start" disabled={busy !== null} onClick={generate}>
              Generate Characters
            </button>
            <button
              className="btn-ghost justify-start"
              disabled={busy !== null || characters.length === 0}
              onClick={generateRelationships}
            >
              Generate Relationships
            </button>
          </div>
          {busy ? (
            <div className="mt-3">
              <Spinner />
            </div>
          ) : null}
          {relationships ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-widest text-accent">Relationships</p>
              {relationships.map((item) => (
                <p key={item.character} className="text-neutral-400">
                  <span className="text-neutral-200">{item.character}:</span> {item.relationship}
                </p>
              ))}
              <button className="btn-quiet px-0" onClick={() => setRelationships(null)}>
                Dismiss
              </button>
            </div>
          ) : null}
        </div>
      }
    >
      {pending ? (
        <div className="panel mb-5 border-accent/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-accent">
              {pending.length} suggested characters — not saved yet
            </p>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={busy !== null} onClick={acceptPending}>
                Accept all
              </button>
              <button className="btn-ghost" disabled={busy !== null} onClick={generate}>
                Regenerate
              </button>
              <button className="btn-quiet" onClick={() => setPending(null)}>
                Discard
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((character, index) => (
              <div key={`${character.name}-${index}`} className="rounded-lg border border-white/5 bg-ink-850 p-3">
                <p className="text-sm font-semibold text-neutral-100">{character.name}</p>
                <p className="text-xs uppercase tracking-wider text-accent/80">{character.role}</p>
                <p className="mt-2 text-sm text-neutral-400">Goal: {character.goal}</p>
                <p className="text-sm text-neutral-400">Flaw: {character.flaw}</p>
                <p className="text-sm text-neutral-400">Arc: {character.characterArc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {characters.length === 0 && !pending ? (
        <EmptyState
          title="No characters yet"
          hint="Generate a cast from your approved idea, or create one manually and fill it in yourself."
          action={
            <button className="btn-primary" onClick={generate} disabled={busy !== null}>
              Generate Characters
            </button>
          }
        />
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-2">
        {characters.map((character) => (
          <div key={character.id} className="panel p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <input
                className="field max-w-xs text-base font-semibold uppercase tracking-wide"
                value={character.name}
                onChange={(event) =>
                  setCharacters((current) =>
                    current.map((item) => (item.id === character.id ? { ...item, name: event.target.value } : item)),
                  )
                }
                onBlur={(event) => updateCharacter(character.id, { name: event.target.value })}
              />
              <button className="btn-quiet" onClick={() => removeCharacter(character.id)}>
                Delete
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.filter((field) => field.key !== "name").map((field) => (
                <div key={field.key} className={field.long ? "sm:col-span-2" : ""}>
                  <label className="label">{field.label}</label>
                  {field.long ? (
                    <textarea
                      className="field min-h-[64px]"
                      value={character[field.key]}
                      onChange={(event) =>
                        setCharacters((current) =>
                          current.map((item) =>
                            item.id === character.id ? { ...item, [field.key]: event.target.value } : item,
                          ),
                        )
                      }
                      onBlur={(event) => updateCharacter(character.id, { [field.key]: event.target.value })}
                    />
                  ) : (
                    <input
                      className="field"
                      value={character[field.key]}
                      onChange={(event) =>
                        setCharacters((current) =>
                          current.map((item) =>
                            item.id === character.id ? { ...item, [field.key]: event.target.value } : item,
                          ),
                        )
                      }
                      onBlur={(event) => updateCharacter(character.id, { [field.key]: event.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-ghost" disabled={busy !== null} onClick={() => improve(character, "improve")}>
                Improve Character
              </button>
              <button className="btn-ghost" disabled={busy !== null} onClick={() => improve(character, "complex")}>
                Make More Complex
              </button>
              <button className="btn-ghost" disabled={busy !== null} onClick={() => improve(character, "backstory")}>
                Generate Backstory
              </button>
              <button className="btn-ghost" disabled={busy !== null} onClick={() => improve(character, "arc")}>
                Generate Character Arc
              </button>
            </div>
          </div>
        ))}
      </div>
    </Workspace>
  );
}
