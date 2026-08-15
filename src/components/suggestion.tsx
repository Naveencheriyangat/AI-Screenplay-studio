"use client";

import { useEffect, useState } from "react";

export function Spinner({ label = "Thinking" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-neutral-400">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      {label}…
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm font-medium text-neutral-300">{title}</p>
      {hint ? <p className="max-w-md text-sm text-neutral-500">{hint}</p> : null}
      {action}
    </div>
  );
}

/** AI suggestion the writer must review: nothing is saved until they accept. */
export function SuggestionCard({
  heading,
  value,
  busy,
  onAccept,
  onRegenerate,
  onDiscard,
}: {
  heading: string;
  value: string;
  busy?: boolean;
  onAccept: (value: string) => void;
  onRegenerate: () => void;
  onDiscard: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  return (
    <div className="panel border-accent/20 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-accent">{heading}</p>
        <span className="chip">AI suggestion — not saved yet</span>
      </div>
      {editing ? (
        <textarea
          className="field min-h-[140px] leading-relaxed"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">{draft}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy} onClick={() => onAccept(draft)}>
          Accept
        </button>
        <button className="btn-ghost" disabled={busy} onClick={() => setEditing((current) => !current)}>
          {editing ? "Preview" : "Edit"}
        </button>
        <button className="btn-ghost" disabled={busy} onClick={onRegenerate}>
          Regenerate
        </button>
        <button className="btn-quiet" disabled={busy} onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
