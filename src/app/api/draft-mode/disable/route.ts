import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/** Turns draft preview off and returns to the given page (or home). */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const slug = request.nextUrl.searchParams.get("slug") ?? "/";
  redirect(slug.startsWith("/") ? slug : "/");
}
