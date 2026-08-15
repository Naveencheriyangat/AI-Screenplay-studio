"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/suggestion";

const FORMATS = ["Feature Film", "Short Film", "TV Episode"];

export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    genre: "",
    language: "English",
    format: "Feature Film",
    duration: 120,
    tone: "",
    reference: "",
    originalIdea: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const project = await api<{ id: string }>("/api/projects", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast("Project created", "success");
      router.push(`/projects/${project.id}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not create project", "error");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-neutral-100">New screenplay project</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The AI uses everything here as project memory when it writes with you.
      </p>

      <form onSubmit={submit} className="panel mt-6 space-y-5 p-6">
        <div>
          <label className="label" htmlFor="title">
            Project title
          </label>
          <input
            id="title"
            className="field"
            required
            placeholder="The Last Signal"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="genre">
              Genre
            </label>
            <input
              id="genre"
              className="field"
              placeholder="Sci-Fi Thriller"
              value={form.genre}
              onChange={(event) => update("genre", event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="language">
              Language
            </label>
            <input
              id="language"
              className="field"
              value={form.language}
              onChange={(event) => update("language", event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="format">
              Format
            </label>
            <select
              id="format"
              className="field"
              value={form.format}
              onChange={(event) => update("format", event.target.value)}
            >
              {FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="duration">
              Approximate duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              min={1}
              className="field"
              value={form.duration}
              onChange={(event) => update("duration", Number(event.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="tone">
            Tone
          </label>
          <input
            id="tone"
            className="field"
            placeholder="Dark, mysterious, emotional"
            value={form.tone}
            onChange={(event) => update("tone", event.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="reference">
            Reference / inspiration (optional)
          </label>
          <input
            id="reference"
            className="field"
            placeholder="Contact meets Prisoners"
            value={form.reference}
            onChange={(event) => update("reference", event.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="idea">
            Initial story idea
          </label>
          <textarea
            id="idea"
            className="field min-h-[120px]"
            placeholder="A radio operator receives a distress signal from a spacecraft that disappeared 20 years ago."
            value={form.originalIdea}
            onChange={(event) => update("originalIdea", event.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={saving}>
            Create project
          </button>
          {saving ? <Spinner label="Saving" /> : null}
        </div>
      </form>
    </div>
  );
}
