import { NextResponse } from "next/server";
import { createDemoProject } from "@/lib/demo";
import { fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const project = await createDemoProject();
    return NextResponse.redirect(new URL(`/projects/${project.id}`, request.url));
  } catch (error) {
    return fail(error, 500);
  }
}
