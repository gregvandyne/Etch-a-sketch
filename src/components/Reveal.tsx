"use client";

import { useEffect } from "react";

/**
 * Progressive scroll-reveal. Elements with the `reveal` class fade up as
 * they enter the viewport. Without JavaScript — or with reduced motion —
 * everything is simply visible (see globals.css).
 */
export function RevealProvider() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.setAttribute("data-reveal-ready", "");
    const observer = new IntersectionObserver(
      (entries) => {
        // Elements entering in the same tick reveal as a group: 90ms apart,
        // capped at five steps so long rows don't trail off.
        const entering = entries.filter((e) => e.isIntersecting);
        entering.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          const delay = Math.min(i, 4) * 90;
          if (delay > 0) {
            el.style.transitionDelay = `${delay}ms`;
            el.addEventListener(
              "transitionend",
              () => {
                el.style.transitionDelay = "";
              },
              { once: true }
            );
          }
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );

    const observeAll = () => {
      document
        .querySelectorAll(".reveal:not(.is-visible), .reveal-image:not(.is-visible)")
        .forEach((el) => observer.observe(el));
    };
    observeAll();

    // Re-scan after client-side navigations.
    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
