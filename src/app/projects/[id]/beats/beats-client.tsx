"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Workspace } from "@/components/workspace";
import { EmptyState, Spinner } from "@/components/suggestion";
import { useToast } from "@/components/toast";
import { aiAction, api } from "@/lib/client";

export interface BeatRecord {
  id: string;
  act: string;
  order: number;
  title: string;
  description: string;
  characters: string;
  location: string;
  purpose: string;
}

type BeatDraft = Omit<BeatRecord, "id" | "order">;

const STRUCTURES = [
  { value: "3-act", label: "3 Act Structure" },
  { value: "5-act", label: "5 Act Structure" },
  { value: "save-the-cat", label: "Save the Cat" },
];

export function BeatsWorkspace({
  projectId,
  projectTitle,
  structure,
  initialBeats,
}: {
  projectId: string;
  projectTitle: string;
  structure: string;
  initialBeats: BeatRecord[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [beats, setBeats] = useState<BeatRecord[]>(initialBeats);
  const [pending, setPending] = useState<BeatDraft[] | null>(null);
  const [selectedStructure, setSelectedStructure] = useState(structure || "3-act");
  const [busy, setBusy] = useState<string | null>(null);

  async function generate() {
    setBusy("generate");
    try {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ structure: selectedStructure }),
      });
      setPending(await aiAction<BeatDraft[]>(projectId, "storyBeats"));
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function acceptPending(replace: boolean) {
    if (!pending) return;
    setBusy("accept");
    try {
      const created = await api<BeatRecord[]>(`/api/projects/${projectId}/beats`, {
        method: "POST",
        body: JSON.stringify({ beats: pending, replace }),
      });
      setBeats(replace ? created : [...beats, ...created]);
      setPending(null);
      toast("Story beats saved", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save beats", "error");
    } finally {
      setBusy(null);
    }
  }

  async function updateBeat(id: string, patch: Partial<BeatDraft>) {
    setBeats((current) => current.map((beat) => (beat.id === id ? { ...beat, ...patch } : beat)));
    await api(`/api/beats/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async function addBeat() {
    const created = await api<BeatRecord[]>(`/api/projects/${projectId}/beats`, {
      method: "POST",
      body: JSON.stringify({ beats: [{ title: "New beat", act: "ACT I" }] }),
    });
    setBeats((current) => [...current, ...created]);
  }

  async function removeBeat(id: string) {
    setBeats((current) => current.filter((beat) => beat.id !== id));
    await api(`/api/beats/${id}`, { method: "DELETE" });
    toast("Beat deleted");
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= beats.length) return;
    const reordered = [...beats];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBeats(reordered);
    await api(`/api/projects/${projectId}/beats`, {
      method: "PUT",
      body: JSON.stringify({ order: reordered.map((beat) => beat.id) }),
    });
  }

  async function expandToScenes(beat: BeatRecord) {
    setBusy(`${beat.id}:scenes`);
    try {
      const scenes = await aiAction<Array<Record<string, string>>>(projectId, "scenes", {
        beatTitle: beat.title,
        count: 3,
      });
      await api(`/api/projects/${projectId}/scenes`, {
        method: "POST",
        body: JSON.stringify({ beatId: beat.id, scenes }),
      });
      toast(`${scenes.length} scenes created from "${beat.title}"`, "success");
      router.push(`/projects/${projectId}/scenes`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  const acts = Array.from(new Set(beats.map((beat) => beat.act)));

  return (
    <Workspace
      projectId={projectId}
      projectTitle={projectTitle}
      title="Story beats"
      subtitle="The outline the AI will use for every scene. Reorder, rewrite or delete anything."
      actions={
        <>
          <button className="btn-ghost" onClick={addBeat}>
            Add beat
          </button>
          <Link href={`/projects/${projectId}/scenes`} className="btn-primary">
            Next: Scenes
          </Link>
        </>
      }
      aside={
        <div className="panel p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">Structure</p>
          <select
            className="field mb-3"
            value={selectedStructure}
            onChange={(event) => setSelectedStructure(event.target.value)}
          >
            {STRUCTURES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button className="btn-ghost w-full justify-start" disabled={busy !== null} onClick={generate}>
            Generate Story Beats
          </button>
          {busy ? (
            <div className="mt-3">
              <Spinner />
            </div>
          ) : null}
        </div>
      }
    >
      {pending ? (
        <div className="panel mb-5 border-accent/20 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-widest text-accent">
              {pending.length} suggested beats — not saved yet
            </p>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={busy !== null} onClick={() => acceptPending(beats.length > 0)}>
                {beats.length > 0 ? "Accept & replace outline" : "Accept"}
              </button>
              <button className="btn-ghost" disabled={busy !== null} onClick={generate}>
                Regenerate
              </button>
              <button className="btn-quiet" onClick={() => setPending(null)}>
                Discard
              </button>
            </div>
          </div>
          <ol className="space-y-2">
            {pending.map((beat, index) => (
              <li key={`${beat.title}-${index}`} className="rounded-lg border border-white/5 bg-ink-850 p-3">
                <p className="text-xs uppercase tracking-wider text-accent/80">{beat.act}</p>
                <p className="text-sm font-medium text-neutral-100">
                  {index + 1}. {beat.title}
                </p>
                <p className="mt-1 text-sm text-neutral-400">{beat.description}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {beats.length === 0 && !pending ? (
        <EmptyState
          title="No outline yet"
          hint="Generate a 3-act outline from your idea and characters, then edit every beat."
          action={
            <button className="btn-primary" disabled={busy !== null} onClick={generate}>
              Generate Story Beats
            </button>
          }
        />
      ) : null}

      <div className="space-y-6">
        {acts.map((act) => (
          <section key={act}>
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">{act}</h2>
            <div className="space-y-3">
              {beats
                .filter((beat) => beat.act === act)
                .map((beat) => {
                  const index = beats.indexOf(beat);
                  return (
                    <div key={beat.id} className="panel p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-neutral-600">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <input
                          className="field flex-1"
                          value={beat.title}
                          onChange={(event) =>
                            setBeats((current) =>
                              current.map((item) =>
                                item.id === beat.id ? { ...item, title: event.target.value } : item,
                              ),
                            )
                          }
                          onBlur={(event) => updateBeat(beat.id, { title: event.target.value })}
                        />
                        <button className="btn-quiet" onClick={() => move(index, -1)}>
                          ↑
                        </button>
                        <button className="btn-quiet" onClick={() => move(index, 1)}>
                          ↓
                        </button>
                        <button className="btn-quiet" onClick={() => removeBeat(beat.id)}>
                          Delete
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="label">Description</label>
                          <textarea
                            className="field min-h-[80px]"
                            value={beat.description}
                            onChange={(event) =>
                              setBeats((current) =>
                                current.map((item) =>
                                  item.id === beat.id ? { ...item, description: event.target.value } : item,
                                ),
                              )
                            }
                            onBlur={(event) => updateBeat(beat.id, { description: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Characters involved</label>
                          <input
                            className="field"
                            value={beat.characters}
                            onChange={(event) =>
                              setBeats((current) =>
                                current.map((item) =>
                                  item.id === beat.id ? { ...item, characters: event.target.value } : item,
                                ),
                              )
                            }
                            onBlur={(event) => updateBeat(beat.id, { characters: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Location</label>
                          <input
                            className="field"
                            value={beat.location}
                            onChange={(event) =>
                              setBeats((current) =>
                                current.map((item) =>
                                  item.id === beat.id ? { ...item, location: event.target.value } : item,
                                ),
                              )
                            }
                            onBlur={(event) => updateBeat(beat.id, { location: event.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Story purpose</label>
                          <input
                            className="field"
                            value={beat.purpose}
                            onChange={(event) =>
                              setBeats((current) =>
                                current.map((item) =>
                                  item.id === beat.id ? { ...item, purpose: event.target.value } : item,
                                ),
                              )
                            }
                            onBlur={(event) => updateBeat(beat.id, { purpose: event.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="btn-ghost"
                          disabled={busy !== null}
                          onClick={() => expandToScenes(beat)}
                        >
                          Expand into scenes
                        </button>
                        <span className="chip">{beat.act}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </Workspace>
  );
}
