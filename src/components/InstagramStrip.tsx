import { getInstagramPosts } from "@/lib/instagram";
import { getSettings } from "@/lib/content";
import { TrackedLink } from "./TrackedLink";
import { Label } from "./ui";

/**
 * Latest photographs from Instagram, linking to the posts. Renders nothing
 * until the Instagram credentials are configured, so the page never shows
 * an empty or placeholder feed.
 */
export async function InstagramStrip() {
  const [posts, settings] = await Promise.all([getInstagramPosts(8), getSettings()]);
  if (posts.length === 0) return null;

  const handle =
    settings.instagram?.match(/instagram\.com\/([^/?]+)/)?.[1] ?? "Instagram";

  return (
    <section aria-label="Latest from Instagram" className="border-t border-linen bg-parchment">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="reveal mb-10 text-center">
          <Label className="mb-3">Follow along</Label>
          {settings.instagram ? (
            <TrackedLink
              href={settings.instagram}
              event="Social Link Clicked"
              eventProps={{ network: "Instagram", location: "instagram-strip" }}
              className="font-display text-2xl italic text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current sm:text-3xl"
              external
            >
              @{handle}
            </TrackedLink>
          ) : null}
        </div>
        <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
          {posts.map((post, i) => (
            <li key={post.id} className={i >= 4 ? "hidden lg:block" : ""}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden bg-linen"
                aria-label={
                  post.caption
                    ? `Instagram post: ${post.caption.slice(0, 80)}`
                    : "View on Instagram"
                }
              >
                {/* Instagram media URLs are short-lived CDN links; served as-is. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt=""
                  width={400}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="hover-zoom aspect-square w-full object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
