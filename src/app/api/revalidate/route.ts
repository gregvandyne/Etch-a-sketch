import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

/**
 * Sanity → Next.js publish webhook. When Courtney publishes, unpublishes
 * or deletes content, Sanity calls this endpoint (signed with
 * SANITY_REVALIDATE_SECRET) and the affected pages regenerate within
 * seconds — no manual deploys, ever.
 *
 * Configure in sanity.io/manage → API → Webhooks:
 *   URL:        https://<site>/api/revalidate
 *   Dataset:    production
 *   Trigger on: create, update, delete
 *   Projection: { _type, "slug": slug.current }
 *   Secret:     the same value as SANITY_REVALIDATE_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{
      _type?: string;
      slug?: string;
    }>(req, process.env.SANITY_REVALIDATE_SECRET);

    if (!isValidSignature) {
      return new Response("Invalid signature", { status: 401 });
    }
    if (!body?._type) {
      return new Response("Bad request", { status: 400 });
    }

    // Type tag invalidates listings; slug tag invalidates the single page.
    revalidateTag(body._type, "max");
    if (body.slug) {
      revalidateTag(`${body._type}:${body.slug}`, "max");
    }
    // Settings and singleton pages affect the shared layout everywhere.
    if (body._type === "siteSettings") {
      revalidateTag("settings", "max");
    }

    return NextResponse.json({ revalidated: true, type: body._type, slug: body.slug });
  } catch (err) {
    console.error("[revalidate] webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
