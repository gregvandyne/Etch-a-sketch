import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * Enables draft preview. Requires the shared preview secret so drafts
 * can't be viewed by guessing the URL:
 *   /api/draft-mode/enable?secret=<SANITY_PREVIEW_SECRET>&slug=/some-page
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const slug = request.nextUrl.searchParams.get("slug") ?? "/";

  if (!process.env.SANITY_PREVIEW_SECRET || secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(slug.startsWith("/") ? slug : `/${slug}`);
}
