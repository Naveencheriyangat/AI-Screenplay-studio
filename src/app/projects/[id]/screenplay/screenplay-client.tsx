"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Workspace } from "@/components/workspace";
import { EmptyState, Spinner } from "@/components/suggestion";
import { useToast } from "@/components/toast";
import { aiAction, api } from "@/lib/client";
import { classifyLines } from "@/lib/screenplay";

interface EditorScene {
  id: string;
  sceneNumber: number;
  heading: string;
  screenplayContent: string;
}

interface VersionRecord {
  id: string;
  label: string;
  createdAt: string;
  content: string;
}

interface ContinuityIssue {
  severity: string;
  type: string;
  message: string;
  sceneNumber: number | null;
}

const ASSISTANT_ACTIONS = [
  "Rewrite",
  "Make dialogue more natural",
  "Increase tension",
  "Make it funnier",
  "Make it darker",
  "Improve pacing",
  "Add subtext",
  "Make character voice stronger",
  "Fix continuity",
  "Continue scene",
];

export function ScreenplayWorkspace({
  projectId,
  projectTitle,
  initialScenes,
}: {
  projectId: string;
  projectTitle: string;
  initialScenes: EditorScene[];
}) {
  const toast = useToast();
  const [scenes, setScenes] = useState(initialScenes);
  const [activeSceneId, setActiveSceneId] = useState(initialScenes[0]?.id ?? "");
  const [selection, setSelection] = useState<{ sceneId: string; start: number; end: number; text: string } | null>(null);
  const [suggestion, setSuggestion] = useState<{ sceneId: string; content: string; label: string } | null>(null);
  const [issues, setIssues] = useState<ContinuityIssue[] | null>(null);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const textareas = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];

  const saveScene = useCallback(
    async (sceneId: string, content: string) => {
      await api(`/api/scenes/${sceneId}`, {
        method: "PATCH",
        body: JSON.stringify({ screenplayContent: content }),
      });
      setDirty((current) => ({ ...current, [sceneId]: false }));
    },
    [],
  );

  useEffect(() => {
    const pending = Object.entries(dirty).filter(([, isDirty]) => isDirty);
    if (pending.length === 0) return;
    const timer = setTimeout(() => {
      pending.forEach(([sceneId]) => {
        const scene = scenes.find((item) => item.id === sceneId);
        if (scene) void saveScene(sceneId, scene.screenplayContent);
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [dirty, scenes, saveScene]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (activeScene) void saveScene(activeScene.id, activeScene.screenplayContent).then(() => toast("Saved", "success"));
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        void runContinuity();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScene]);

  function updateContent(sceneId: string, content: string) {
    setScenes((current) => current.map((scene) => (scene.id === sceneId ? { ...scene, screenplayContent: content } : scene)));
    setDirty((current) => ({ ...current, [sceneId]: true }));
  }

  function captureSelection(scene: EditorScene) {
    const element = textareas.current[scene.id];
    if (!element) return;
    const { selectionStart, selectionEnd } = element;
    if (selectionStart === selectionEnd) {
      setSelection(null);
      return;
    }
    setSelection({
      sceneId: scene.id,
      start: selectionStart,
      end: selectionEnd,
      text: scene.screenplayContent.slice(selectionStart, selectionEnd),
    });
  }

  async function runAssistant(instruction: string) {
    if (!activeScene) return;
    setBusy(instruction);
    try {
      if (instruction === "Continue scene") {
        const content = await aiAction<string>(projectId, "sceneScreenplay", {
          heading: activeScene.heading,
          summary: activeScene.screenplayContent.slice(-600),
          style: "Continue the scene from where the existing pages end",
        });
        setSuggestion({
          sceneId: activeScene.id,
          content: `${activeScene.screenplayContent.trim()}\n\n${content}`.trim(),
          label: "Continued scene",
        });
        return;
      }

      const target = selection && selection.sceneId === activeScene.id ? selection.text : activeScene.screenplayContent;
      const rewritten = await aiAction<string>(projectId, "rewrite", { text: target, instruction });
      const content =
        selection && selection.sceneId === activeScene.id
          ? `${activeScene.screenplayContent.slice(0, selection.start)}${rewritten}${activeScene.screenplayContent.slice(
              selection.end,
            )}`
          : rewritten;
      setSuggestion({
        sceneId: activeScene.id,
        content,
        label: selection ? `${instruction} (selection)` : instruction,
      });
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function runContinuity() {
    setBusy("continuity");
    try {
      setIssues(await aiAction<ContinuityIssue[]>(projectId, "continuity"));
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function fixIssue(issue: ContinuityIssue) {
    const scene = scenes.find((item) => item.sceneNumber === issue.sceneNumber) ?? activeScene;
    if (!scene) return;
    setActiveSceneId(scene.id);
    setBusy("fix");
    try {
      const content = await aiAction<string>(projectId, "rewrite", {
        text: scene.screenplayContent || scene.heading,
        instruction: `Fix this continuity issue: ${issue.message}`,
      });
      setSuggestion({ sceneId: scene.id, content, label: "Continuity fix" });
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI request failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function loadVersions(sceneId: string) {
    setVersions(await api<VersionRecord[]>(`/api/scenes/${sceneId}/versions`));
  }

  async function restoreVersion(versionId: string) {
    const scene = await api<EditorScene>(`/api/versions/${versionId}/restore`, { method: "POST" });
    setScenes((current) => current.map((item) => (item.id === scene.id ? { ...item, screenplayContent: scene.screenplayContent } : item)));
    toast("Version restored", "success");
    await loadVersions(scene.id);
  }

  async function copyAll() {
    const text = scenes.map((scene) => scene.screenplayContent || scene.heading).join("\n\n");
    await navigator.clipboard.writeText(text);
    toast("Screenplay copied to clipboard", "success");
  }

  if (scenes.length === 0) {
    return (
      <Workspace projectId={projectId} projectTitle={projectTitle} title="Screenplay">
        <EmptyState
          title="No scenes to write yet"
          hint="Create story beats and expand them into scenes first."
          action={
            <Link href={`/projects/${projectId}/beats`} className="btn-primary">
              Go to story beats
            </Link>
          }
        />
      </Workspace>
    );
  }

  return (
    <Workspace
      projectId={projectId}
      projectTitle={projectTitle}
      title="Screenplay editor"
      subtitle="Click into any scene to write. Highlight text and ask the assistant to rewrite only that part."
      actions={
        <>
          <button className="btn-ghost" onClick={copyAll}>
            Copy
          </button>
          <a className="btn-ghost" href={`/api/projects/${projectId}/export?format=txt`}>
            Export TXT
          </a>
          <Link className="btn-primary" href={`/projects/${projectId}/print`} target="_blank">
            Export PDF
          </Link>
        </>
      }
      aside={
        <>
          <div className="panel p-4">
            <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">AI writing assistant</p>
            <p className="mb-3 text-xs text-neutral-500">
              {selection ? `${selection.text.length} characters selected` : "No selection — actions apply to the whole scene"}
            </p>
            <div className="flex flex-col gap-2">
              {ASSISTANT_ACTIONS.map((action) => (
                <button
                  key={action}
                  className="btn-ghost justify-start"
                  disabled={busy !== null}
                  onClick={() => runAssistant(action)}
                >
                  {action}
                </button>
              ))}
            </div>
            {busy ? (
              <div className="mt-3">
                <Spinner />
              </div>
            ) : null}
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-neutral-500">Continuity</p>
              <button className="btn-quiet px-0" disabled={busy !== null} onClick={runContinuity}>
                Check
              </button>
            </div>
            {issues === null ? (
              <p className="text-sm text-neutral-500">Run a check to find character, location and timeline problems.</p>
            ) : issues.length === 0 ? (
              <p className="text-sm text-neutral-400">No continuity issues found.</p>
            ) : (
              <ul className="space-y-3">
                {issues.map((issue, index) => (
                  <li key={`${issue.message}-${index}`} className="rounded-lg border border-white/5 bg-ink-850 p-3">
                    <p className="text-xs uppercase tracking-wider text-accent/80">{issue.type}</p>
                    <p className="mt-1 text-sm text-neutral-300">{issue.message}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="btn-quiet px-0" onClick={() => fixIssue(issue)}>
                        Fix
                      </button>
                      <button
                        className="btn-quiet px-0"
                        onClick={() => setIssues((current) => (current ?? []).filter((item) => item !== issue))}
                      >
                        Ignore
                      </button>
                      {issue.sceneNumber ? (
                        <button
                          className="btn-quiet px-0"
                          onClick={() => {
                            const scene = scenes.find((item) => item.sceneNumber === issue.sceneNumber);
                            if (scene) {
                              setActiveSceneId(scene.id);
                              textareas.current[scene.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                        >
                          View Scene
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-neutral-500">Version history</p>
              <button
                className="btn-quiet px-0"
                onClick={() => activeScene && loadVersions(activeScene.id)}
                disabled={!activeScene}
              >
                Load
              </button>
            </div>
            {versions.length === 0 ? (
              <p className="text-sm text-neutral-500">Versions are saved automatically whenever a scene changes.</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((version) => (
                  <li key={version.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-neutral-400">{version.label}</span>
                    <button className="btn-quiet px-0" onClick={() => restoreVersion(version.id)}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-6">
        {scenes.map((scene) => (
          <section
            key={scene.id}
            className={`panel p-5 transition ${scene.id === activeSceneId ? "border-accent/25" : ""}`}
            onFocus={() => setActiveSceneId(scene.id)}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs text-neutral-600">SCENE {String(scene.sceneNumber).padStart(2, "0")}</p>
              <span className="chip">{dirty[scene.id] ? "Saving…" : "Autosaved"}</span>
            </div>

            <textarea
              ref={(element) => {
                textareas.current[scene.id] = element;
              }}
              className="screenplay w-full resize-y rounded-lg border border-white/5 bg-ink-850 p-4 text-neutral-100 focus:border-accent/40 focus:outline-none"
              rows={Math.max(10, scene.screenplayContent.split("\n").length + 2)}
              value={scene.screenplayContent || `${scene.heading}\n\n`}
              onChange={(event) => updateContent(scene.id, event.target.value)}
              onSelect={() => captureSelection(scene)}
              onClick={() => setActiveSceneId(scene.id)}
            />

            {suggestion && suggestion.sceneId === scene.id ? (
              <div className="mt-4 rounded-lg border border-accent/25 bg-ink-850 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-accent">{suggestion.label} — not saved yet</p>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        updateContent(scene.id, suggestion.content);
                        await saveScene(scene.id, suggestion.content);
                        setSuggestion(null);
                        toast("Applied — previous version kept in history", "success");
                      }}
                    >
                      Accept
                    </button>
                    <button className="btn-quiet" onClick={() => setSuggestion(null)}>
                      Discard
                    </button>
                  </div>
                </div>
                <pre className="screenplay max-h-72 overflow-auto text-neutral-200">{suggestion.content}</pre>
              </div>
            ) : null}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300">
                Formatted preview
              </summary>
              <div className="screenplay mt-3 rounded-lg bg-white/[0.02] p-6">
                {classifyLines(scene.screenplayContent || scene.heading).map((line, index) => (
                  <p key={index} className={`sp-${line.type}`}>
                    {line.text || "\u00a0"}
                  </p>
                ))}
              </div>
            </details>
          </section>
        ))}
      </div>
    </Workspace>
  );
}
