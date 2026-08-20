import { PortableText, type PortableTextComponents } from "next-sanity";

import type { PhotoSource, PortableBlock } from "@/lib/types";
import { Photo } from "./Photo";
import { Button } from "./ui";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="my-5 leading-relaxed text-charcoal/90">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="font-display mb-4 mt-10 text-3xl text-ink">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display mb-3 mt-8 text-2xl text-ink">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="font-display my-8 border-l-2 border-sand pl-6 text-2xl italic leading-snug text-umber">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="border-b border-taupe text-charcoal transition-colors hover:border-charcoal"
        {...(value?.href?.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    ),
  },
  types: {
    photograph: ({ value }: { value: PhotoSource }) => (
      <figure className="my-10 -mx-2 sm:-mx-6 lg:-mx-16">
        <Photo photo={value} sizes="(min-width: 1024px) 880px, 100vw" />
        {value.caption ? (
          <figcaption className="label mt-3 px-2 text-center text-taupe sm:px-6 lg:px-16">
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
    imagePair: ({ value }: { value: { left?: PhotoSource; right?: PhotoSource } }) => (
      <div className="my-10 -mx-2 grid grid-cols-2 gap-4 sm:-mx-6 sm:gap-6 lg:-mx-16">
        <Photo photo={value.left} sizes="(min-width: 1024px) 430px, 50vw" />
        <Photo photo={value.right} sizes="(min-width: 1024px) 430px, 50vw" />
      </div>
    ),
    imageGallery: ({ value }: { value: { photographs?: PhotoSource[] } }) => (
      <div className="my-10 -mx-2 grid grid-cols-2 gap-4 sm:-mx-6 sm:gap-6 lg:-mx-16">
        {(value.photographs ?? []).map((p, i) => (
          <Photo key={i} photo={p} sizes="(min-width: 1024px) 430px, 50vw" aspect="4/5" />
        ))}
      </div>
    ),
    callToAction: ({ value }: { value: { label?: string; href?: string } }) => (
      <div className="my-10 text-center">
        <Button href={value.href ?? "/contact"} trackInquiry="prose-cta">
          {value.label ?? "Inquire"}
        </Button>
      </div>
    ),
  },
};

/** Renders CMS rich text with the site's editorial styles. */
export function Prose({ value, className = "" }: { value?: PortableBlock[]; className?: string }) {
  if (!value || value.length === 0) return null;
  return (
    <div className={`text-[1.0625rem] ${className}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}
