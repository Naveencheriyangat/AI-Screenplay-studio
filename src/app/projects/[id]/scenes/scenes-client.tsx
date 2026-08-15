"use client";

import Link from "next/link";
import { useState } from "react";
import { Workspace } from "@/components/workspace";
import { EmptyState, Spinner } from "@/components/suggestion";
import { useToast } from "@/components/toast";
import { aiAction, api } from "@/lib/client";

export interface SceneRecord {
  id: string;
  beatId: string | null;
  sceneNumber: number;
  intExt: string;
  heading: string;
  location: string;
  timeOfDay: string;
  characters: string;
  purpose: string;
  conflict: string;
  emotionalObjective: string;
  summary: string;
  screenplayContent: string;
}

interface BeatOption {
  id: string;
  title: string;
  act: string;
}

const STYLES = [
  { label: "Make More Tense", instruction: "Increase tension and shorten the beats between lines" },
  { label: "Make More Emotional", instruction: "Deepen the emotional subtext without adding melodrama" },
  { label: "Improve Dialogue", instruction: "Make the dialogue sharper, more specific and less on-the-nose" },
  { label: "Shorten", instruction: "Tighten the scene to its essentials" },
  { label: "Expand", instruction: "Expand the scene with more behaviour and physical detail" },
  { label: "Rewrite", instruction: "Rewrite the scene keeping the same story function" },
];

export function ScenesWorkspace({
  projectId,
  projectTitle,
  beats,
  initialScenes,
}: {
  projectId: string;
  projectTitle: string;
  beats: BeatOption[];
  initialScenes: SceneRecord[];
}) {
  const toast = useToast();
  const [scenes, setScenes] = useState<SceneRecord[]>(initialScenes);
  const [selectedBeat, setSelectedBeat] = useState(beats[0]?.id ?? "");
  const [sceneCount, setSceneCount] = useState(3);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ sceneId: string; content: string; label: string } | null>(null);

  async function generateFromBeat() {
    const beat = beats.find((item) => item.id === selectedBeat);
    if (!beat) {
      toast("Create story beats first", "error");
      return;
    }
    setBusy("scenes");
    try {
      const generated = await aiAction<Array<Record<string, string>>>(projectId, "scenes", {
        beatTitle: beat.title,
        count: sceneCount,
      });
      const created = await api<SceneRecord[]>(`/api/projects/${projectId}/scenes`, {
        method: "POST",
        body: JSON.stringify({ beatId: beat.id, scenes: generated }),
      });
      setScenes((current) => [...current, ...created]);
      toast(`${created.length} scenes added`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function updateScene(id: string, patch: Partial<SceneRecord>) {
    const updated = await api<SceneRecord>(`/api/scenes/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setScenes((current) => current.map((scene) => (scene.id === id ? { ...scene, ...updated } : scene)));
  }

  async function removeScene(id: string) {
    setScenes((current) => current.filter((scene) => scene.id !== id));
    await api(`/api/scenes/${id}`, { method: "DELETE" });
    toast("Scene deleted");
  }

  async function generateScreenplay(scene: SceneRecord, style?: string, label = "Generated scene") {
    setBusy(`${scene.id}:generate`);
    try {
      const content = await aiAction<string>(projectId, "sceneScreenplay", {
        heading: scene.heading,
        characters: scene.characters,
        purpose: scene.purpose,
        conflict: scene.conflict,
        summary: scene.summary,
        style,
      });
      setDraft({ sceneId: scene.id, content, label });
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function transform(scene: SceneRecord, instruction: string, label: string) {
    if (!scene.screenplayContent.trim()) {
      toast("Generate the scene first", "error");
      return;
    }
    setBusy(`${scene.id}:transform`);
    try {
      const content = await aiAction<string>(projectId, "rewrite", {
        text: scene.screenplayContent,
        instruction,
      });
      setDraft({ sceneId: scene.id, content, label });
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function continueScene(scene: SceneRecord) {
    setBusy(`${scene.id}:continue`);
    try {
      const content = await aiAction<string>(projectId, "sceneScreenplay", {
        heading: scene.heading,
        characters: scene.characters,
        purpose: scene.purpose,
        conflict: scene.conflict,
        summary: scene.summary,
        style: "Continue the scene from where the existing pages end",
      });
      setDraft({
        sceneId: scene.id,
        content: `${scene.screenplayContent.trim()}\n\n${content}`.trim(),
        label: "Continued scene",
      });
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
      title="Scenes"
      subtitle="Turn beats into scenes, then write each one as formatted screenplay pages."
      actions={
        <Link href={`/projects/${projectId}/screenplay`} className="btn-primary">
          Next: Screenplay
        </Link>
      }
      aside={
        <div className="panel p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">Generate scenes from a beat</p>
          <select className="field mb-2" value={selectedBeat} onChange={(event) => setSelectedBeat(event.target.value)}>
            {beats.length === 0 ? <option value="">No beats yet</option> : null}
            {beats.map((beat) => (
              <option key={beat.id} value={beat.id}>
                {beat.act} — {beat.title}
              </option>
            ))}
          </select>
          <label className="label">Scenes to generate</label>
          <input
            type="number"
            min={1}
            max={6}
            className="field mb-3"
            value={sceneCount}
            onChange={(event) => setSceneCount(Number(event.target.value))}
          />
          <button className="btn-ghost w-full" disabled={busy !== null || beats.length === 0} onClick={generateFromBeat}>
            Generate Scenes
          </button>
          {busy ? (
            <div className="mt-3">
              <Spinner />
            </div>
          ) : null}
        </div>
      }
    >
      {scenes.length === 0 ? (
        <EmptyState
          title="No scenes yet"
          hint="Pick a story beat in the right panel and let the AI break it into scenes."
        />
      ) : null}

      <div className="space-y-4">
        {scenes.map((scene) => (
          <div key={scene.id} className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-neutral-600">
                  SCENE {String(scene.sceneNumber).padStart(2, "0")}
                </span>
                <p className="screenplay text-sm font-bold text-neutral-100">{scene.heading}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip">{scene.screenplayContent.trim() ? "Written" : "Outline only"}</span>
                <button className="btn-quiet" onClick={() => removeScene(scene.id)}>
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <label className="label">INT./EXT.</label>
                <select
                  className="field"
                  value={scene.intExt}
                  onChange={(event) => updateScene(scene.id, { intExt: event.target.value })}
                >
                  {["INT.", "EXT.", "INT./EXT."].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="field"
                  defaultValue={scene.location}
                  onBlur={(event) => updateScene(scene.id, { location: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Time of day</label>
                <input
                  className="field"
                  defaultValue={scene.timeOfDay}
                  onBlur={(event) => updateScene(scene.id, { timeOfDay: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Characters</label>
                <input
                  className="field"
                  defaultValue={scene.characters}
                  onBlur={(event) => updateScene(scene.id, { characters: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Purpose</label>
                <input
                  className="field"
                  defaultValue={scene.purpose}
                  onBlur={(event) => updateScene(scene.id, { purpose: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Emotional objective</label>
                <input
                  className="field"
                  defaultValue={scene.emotionalObjective}
                  onBlur={(event) => updateScene(scene.id, { emotionalObjective: event.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="label">Conflict</label>
                <input
                  className="field"
                  defaultValue={scene.conflict}
                  onBlur={(event) => updateScene(scene.id, { conflict: event.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="label">Summary</label>
                <textarea
                  className="field min-h-[70px]"
                  defaultValue={scene.summary}
                  onBlur={(event) => updateScene(scene.id, { summary: event.target.value })}
                />
              </div>
            </div>

            {scene.screenplayContent.trim() ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300">
                  Screenplay pages
                </summary>
                <pre className="screenplay mt-2 max-h-72 overflow-auto rounded-lg border border-white/5 bg-ink-850 p-4 text-neutral-200">
                  {scene.screenplayContent}
                </pre>
              </details>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn-primary"
                disabled={busy !== null}
                onClick={() => generateScreenplay(scene, undefined, "Generated scene")}
              >
                {scene.screenplayContent.trim() ? "Regenerate" : "Generate Scene"}
              </button>
              {STYLES.map((style) => (
                <button
                  key={style.label}
                  className="btn-ghost"
                  disabled={busy !== null}
                  onClick={() => transform(scene, style.instruction, style.label)}
                >
                  {style.label}
                </button>
              ))}
              <button className="btn-ghost" disabled={busy !== null} onClick={() => continueScene(scene)}>
                Continue Scene
              </button>
            </div>

            {draft && draft.sceneId === scene.id ? (
              <div className="mt-4 rounded-lg border border-accent/25 bg-ink-850 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-accent">{draft.label} — not saved yet</p>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        await updateScene(scene.id, { screenplayContent: draft.content });
                        setDraft(null);
                        toast("Scene saved — previous version kept in history", "success");
                      }}
                    >
                      Accept
                    </button>
                    <button className="btn-quiet" onClick={() => setDraft(null)}>
                      Discard
                    </button>
                  </div>
                </div>
                <textarea
                  className="field screenplay min-h-[240px]"
                  value={draft.content}
                  onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Workspace>
  );
}
