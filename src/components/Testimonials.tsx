import type { Testimonial } from "@/lib/types";
import { Label } from "./ui";

/** Kind words, presented as quiet editorial pull-quotes. Real reviews only. */
export function Testimonials({
  testimonials,
  heading = "Kind words",
}: {
  testimonials: Testimonial[];
  heading?: string;
}) {
  if (testimonials.length === 0) return null;
  const [first, ...rest] = testimonials;

  return (
    <section aria-label="Client testimonials" className="bg-parchment">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <Label className="reveal mb-10">{heading}</Label>
        <figure className="reveal">
          <blockquote className="font-display text-2xl italic leading-snug text-ink sm:text-3xl lg:text-4xl">
            “{first.quote}”
          </blockquote>
          <figcaption className="label mt-7 text-taupe">— {first.clientNames}</figcaption>
        </figure>
        {rest.length > 0 ? (
          <div className="mt-16 grid gap-12 text-left sm:grid-cols-2 sm:gap-10">
            {rest.slice(0, 2).map((t) => (
              <figure key={t._id} className="reveal">
                <blockquote className="text-[0.95rem] leading-relaxed text-charcoal/85">
                  “{t.quote}”
                </blockquote>
                <figcaption className="label mt-4 text-taupe">— {t.clientNames}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
