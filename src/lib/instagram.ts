/**
 * Instagram feed integration (Instagram Graph API).
 *
 * When INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN are configured, the
 * homepage shows Courtney's latest Instagram photographs, refreshed
 * automatically about once an hour. When they are not configured, or the
 * API errors, the section simply does not render. Nothing is ever faked.
 *
 * Setup and token-refresh notes: docs/TECHNICAL.md ("Instagram feed").
 */

export interface InstagramPost {
  id: string;
  permalink: string;
  imageUrl: string;
  caption?: string;
}

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
}

export async function getInstagramPosts(limit = 8): Promise<InstagramPost[]> {
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!userId || !token) return [];

  try {
    const url = new URL(`https://graph.instagram.com/${userId}/media`);
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,thumbnail_url,permalink"
    );
    url.searchParams.set("limit", String(limit * 2));
    url.searchParams.set("access_token", token);

    const res = await fetch(url, {
      // Refresh roughly hourly; a failed refresh keeps serving the cached feed.
      next: { revalidate: 3600, tags: ["instagram"] },
    });
    if (!res.ok) {
      console.error("[instagram] feed request failed:", res.status, await res.text());
      return [];
    }

    const body = (await res.json()) as { data?: InstagramMediaItem[] };
    const posts: InstagramPost[] = [];
    for (const item of body.data ?? []) {
      // Videos expose a thumbnail; images and carousels a media_url.
      const imageUrl = item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url;
      if (!imageUrl) continue;
      posts.push({ id: item.id, permalink: item.permalink, imageUrl, caption: item.caption });
      if (posts.length >= limit) break;
    }
    return posts;
  } catch (err) {
    console.error("[instagram] feed unavailable:", err);
    return [];
  }
}
