import { NextRequest, NextResponse } from "next/server";

import { isSanityConfigured } from "@/sanity/env";

export const runtime = "nodejs";

/**
 * Inquiry submissions. Validates server-side, filters obvious spam
 * (honeypot + minimum fill time + per-IP rate limit) and delivers the
 * inquiry by email through Resend.
 *
 * Delivery is honest: if the email service isn't configured in a real
 * deployment, the API says so instead of pretending the note was sent.
 * (In the pre-credential preview build the inquiry is logged server-side
 * and the response says it was received by the preview environment.)
 */

const MAX_LEN = 4000;

// Simple per-IP limiter. Note: in-memory state is per server instance —
// good enough to blunt bursts; use an edge rate limiter for stronger needs.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    // Prevent unbounded growth.
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

const TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  elopement: "Elopement / intimate wedding",
  engagement: "Engagement or proposal",
  family: "Family session",
  other: "Other",
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_LEN) : "";
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many inquiries from this connection. Please try again in a little while." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot filled or the form was submitted inhumanly fast → likely a bot.
  // Respond 200 so bots don't learn; nothing is delivered.
  const elapsed = typeof body.elapsedMs === "number" ? body.elapsedMs : 0;
  if (clean(body.website) !== "" || (elapsed > 0 && elapsed < 2500)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name);
  const email = clean(body.email);
  const message = clean(body.message);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide your name, a valid email, and a message." },
      { status: 400 }
    );
  }

  const details: [string, string][] = [
    ["Photography type", TYPE_LABELS[clean(body.type)] ?? (clean(body.type) || "Not specified")],
    ["Name", name],
    ["Partner's name", clean(body.partnerName)],
    ["Email", email],
    ["Phone", clean(body.phone)],
    ["Date", clean(body.date)],
    ["Venue", clean(body.venue)],
    ["Location", clean(body.location)],
    ["How they heard about you", clean(body.referral)],
    ["Page viewed before inquiring", clean(body.viewedContent)],
  ];
  const filled = details.filter(([, v]) => v !== "");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  const from = process.env.INQUIRY_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    if (!isSanityConfigured) {
      // Preview build without credentials: record server-side, be explicit.
      console.info("[inquiry:preview] Inquiry received (email delivery not configured):", {
        ...Object.fromEntries(filled),
        message,
      });
      return NextResponse.json({ ok: true, preview: true });
    }
    console.error("[inquiry] RESEND_API_KEY / INQUIRY_TO_EMAIL / INQUIRY_FROM_EMAIL are not configured.");
    return NextResponse.json(
      { error: "The inquiry form isn't connected yet. Please email Courtney directly." },
      { status: 503 }
    );
  }

  const text = [
    "New inquiry from courtneystockton.com",
    "",
    ...filled.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `New ${TYPE_LABELS[clean(body.type)]?.toLowerCase() ?? "photography"} inquiry from ${name}`,
      text,
    }),
  });

  if (!res.ok) {
    console.error("[inquiry] Email delivery failed:", res.status, await res.text());
    return NextResponse.json(
      { error: "Your note couldn't be sent just now. Please try again, or email Courtney directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
