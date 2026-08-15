import { NextResponse } from "next/server";

export function ok<T>(data: T) {
  return NextResponse.json(data);
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

export async function handle<T>(fn: () => Promise<T>) {
  try {
    return ok(await fn());
  } catch (error) {
    return fail(error, 500);
  }
}
