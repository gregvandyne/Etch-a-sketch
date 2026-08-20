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
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    const observeAll = () => {
      document
        .querySelectorAll(".reveal:not(.is-visible)")
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
