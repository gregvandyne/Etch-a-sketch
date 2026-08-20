"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PhotoSource } from "@/lib/types";
import { Photo } from "./Photo";

/* Lightbox interaction constants */
const SWIPE_THRESHOLD = 40; // horizontal px that completes a swipe
const AXIS_LOCK = 10; // px of travel before the drag commits to an axis
const CROSSFADE_TOTAL = 620; // ms until the outgoing layer can be dropped
const PRELOAD_RADIUS = 2; // neighbors preloaded on each side
const HINT_DURATION = 2500; // ms the first-open hint stays up
const CLOSE_DURATION = 400; // matches --dur-short

// The hint shows once per session — held in memory on purpose.
let hintShown = false;

/**
 * The photograph sequence on a gallery page: an editorial single-column /
 * paired flow (portrait pairs, full-bleed landscapes) with an accessible
 * fullscreen lightbox — keyboard, swipe and reduced-motion friendly.
 */
export function GalleryViewer({ photographs }: { photographs: PhotoSource[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  useLightboxDeepLink(photographs.length, setLightbox);

  // Build editorial rows: consecutive portraits pair up, landscapes run full width.
  const rows: { photos: { photo: PhotoSource; index: number }[] }[] = [];
  let i = 0;
  while (i < photographs.length) {
    const current = photographs[i];
    const next = photographs[i + 1];
    const isPortrait = (p?: PhotoSource) => (p?.aspectRatio ?? 1.5) < 1.05;
    if (isPortrait(current) && next && isPortrait(next)) {
      rows.push({
        photos: [
          { photo: current, index: i },
          { photo: next, index: i + 1 },
        ],
      });
      i += 2;
    } else {
      rows.push({ photos: [{ photo: current, index: i }] });
      i += 1;
    }
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {rows.map((row, r) => (
          <div
            key={r}
            className={`reveal-image grid gap-4 sm:gap-6 ${
              row.photos.length === 2 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {row.photos.map(({ photo, index }) => (
              <button
                key={index}
                type="button"
                className="block w-full cursor-zoom-in overflow-hidden"
                onClick={() => setLightbox(index)}
                aria-label={`View photograph ${index + 1} of ${photographs.length} fullscreen${photo.alt ? `: ${photo.alt}` : ""}`}
              >
                <Photo
                  photo={photo}
                  sizes={
                    row.photos.length === 2
                      ? "(min-width: 1024px) 480px, 50vw"
                      : "(min-width: 1024px) 980px, 100vw"
                  }
                  className="hover-zoom"
                />
              </button>
            ))}
          </div>
        ))}
      </div>

      {lightbox !== null ? (
        <Lightbox
          photographs={photographs}
          index={lightbox}
          onNavigate={setLightbox}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </>
  );
}

/**
 * Open the lightbox from a `?photo=N` deep link on mount, so linked
 * photographs restore and the back button behaves.
 */
export function useLightboxDeepLink(count: number, open: (i: number) => void) {
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("photo"));
    if (Number.isInteger(n) && n >= 1 && n <= count) open(n - 1);
    // Evaluated once per mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Lightbox({
  photographs,
  index,
  onNavigate,
  onClose,
}: {
  photographs: PhotoSource[];
  index: number;
  onNavigate: (i: number) => void;
  onClose: () => void;
}) {
  const total = photographs.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const [hint, setHint] = useState<"idle" | "shown" | "leaving">("idle");
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<{ x: number; y: number; axis: null | "h" | "v" } | null>(null);
  const reduceMotion = useRef(false);
  const pushedHistory = useRef(false);
  const finalizing = useRef(false);

  /* ——— Entrance, reduced motion, one-time hint ——— */
  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => {
      setEntered(true);
      if (!hintShown) {
        hintShown = true;
        setHint("shown");
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (hint !== "shown") return;
    const t1 = setTimeout(() => setHint("leaving"), HINT_DURATION);
    const t2 = setTimeout(() => setHint("idle"), HINT_DURATION + 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hint]);

  /* ——— Navigation: crossfade, wrap-around, rapid-input guard ——— */
  const navigate = useCallback(
    (to: number) => {
      const target = ((to % total) + total) % total;
      if (target === index) return;
      if (crossfadeTimer.current) {
        // Rapid input: cancel the in-flight crossfade and jump to the target.
        clearTimeout(crossfadeTimer.current);
        crossfadeTimer.current = null;
        setOutgoing(null);
      } else if (!reduceMotion.current) {
        setOutgoing(index);
        crossfadeTimer.current = setTimeout(() => {
          setOutgoing(null);
          crossfadeTimer.current = null;
        }, CROSSFADE_TOTAL);
      }
      onNavigate(target);
      history.replaceState({ csLightbox: true }, "", `?photo=${target + 1}`);
    },
    [index, total, onNavigate]
  );

  /* ——— Closing: reverse of open, restore URL, scroll and focus ——— */
  const requestClose = useCallback(
    (fromPop = false) => {
      if (finalizing.current) return;
      finalizing.current = true;
      const finish = () => {
        if (!fromPop) {
          if (pushedHistory.current) {
            pushedHistory.current = false;
            history.back();
          } else {
            // Deep-linked open: clear the query without adding an entry.
            history.replaceState({}, "", window.location.pathname);
          }
        }
        onClose();
      };
      if (reduceMotion.current) {
        finish();
      } else {
        setClosing(true);
        setTimeout(finish, CLOSE_DURATION);
      }
    },
    [onClose]
  );

  /* ——— URL & history: push on open, replace while cycling, pop closes ——— */
  useEffect(() => {
    const existing = new URLSearchParams(window.location.search).get("photo");
    if (existing === String(index + 1)) {
      history.replaceState({ csLightbox: true }, "", `?photo=${index + 1}`);
    } else {
      history.pushState({ csLightbox: true }, "", `?photo=${index + 1}`);
      pushedHistory.current = true;
    }
    const onPop = () => requestClose(true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // Mount-only: cycling updates the URL via replaceState in navigate().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ——— Scroll lock (layout-shift free) + focus trap ——— */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
        "button, [tabindex='-1']"
      );
      if (!focusables || focusables.length === 0) return;
      const list = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el === containerRef.current
      );
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === containerRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!containerRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    containerRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
      opener?.focus();
    };
  }, []);

  /* ——— Keyboard: arrows, Home/End, Escape ——— */
  useEffect(() => {
    const onNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(index - 1);
      if (e.key === "ArrowRight") navigate(index + 1);
      if (e.key === "Home") navigate(0);
      if (e.key === "End") navigate(total - 1);
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onNav);
    return () => document.removeEventListener("keydown", onNav);
  }, [navigate, requestClose, index, total]);

  /* ——— Touch: the image tracks the finger; axis-locked; snap or complete ——— */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      dragState.current = { x: t.clientX, y: t.clientY, axis: null };
    };
    const onMove = (e: TouchEvent) => {
      const d = dragState.current;
      if (!d) return;
      const t = e.touches[0];
      const dx = t.clientX - d.x;
      const dy = t.clientY - d.y;
      if (!d.axis) {
        if (Math.abs(dx) > AXIS_LOCK) d.axis = "h";
        else if (Math.abs(dy) > AXIS_LOCK) d.axis = "v";
      }
      if (d.axis === "h") {
        e.preventDefault();
        setDragX(dx);
      }
    };
    const onEnd = () => {
      const d = dragState.current;
      dragState.current = null;
      if (d?.axis !== "h") return;
      setDragX((x) => {
        if (x !== null && Math.abs(x) > SWIPE_THRESHOLD) {
          navigate(x < 0 ? index + 1 : index - 1);
        }
        return null; // otherwise the transition snaps it back
      });
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [navigate, index]);

  /* ——— Neighbor preload: ±PRELOAD_RADIUS at display size ——— */
  const preload: number[] = [];
  for (let off = -PRELOAD_RADIUS; off <= PRELOAD_RADIUS; off++) {
    if (off === 0) continue;
    const n = (((index + off) % total) + total) % total;
    if (n !== index && n !== outgoing && !preload.includes(n)) preload.push(n);
  }

  const visible = entered && !closing;
  const pad = String(total).length;
  const counter = `${String(index + 1).padStart(pad, "0")} / ${total}`;
  const coarsePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${total}`}
      tabIndex={-1}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-overlay/[0.94] transition-opacity duration-[var(--dur-short)] ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => requestClose()}
    >
      {/* Stage: enters at scale(0.98), tracks the finger while swiping */}
      <div
        className={`relative flex max-h-[88svh] max-w-[92vw] items-center justify-center transition-[opacity,transform] duration-[var(--dur-short)] ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
        style={
          dragX !== null
            ? { transform: `translateX(${dragX}px)`, transition: "none" }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {outgoing !== null ? (
          <div
            key={`out-${outgoing}`}
            aria-hidden="true"
            className="lb-fade-out absolute inset-0 flex items-center justify-center"
          >
            <Photo
              photo={photographs[outgoing]}
              sizes="92vw"
              quality={85}
              className="!h-auto !w-auto max-h-[88svh] max-w-[92vw] object-contain"
            />
          </div>
        ) : null}
        <div key={`in-${index}`} className={outgoing !== null ? "lb-fade-in" : undefined}>
          <Photo
            photo={photographs[index]}
            sizes="92vw"
            quality={85}
            className="!h-auto !w-auto max-h-[88svh] max-w-[92vw] object-contain"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          requestClose();
        }}
        className="label absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-2xl font-light text-ivory/90 transition-opacity hover:text-ivory"
        aria-label="Close fullscreen view"
      >
        ×
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate(index - 1);
        }}
        className="absolute left-1 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center text-4xl font-light text-sand opacity-60 transition-opacity hover:opacity-100 sm:flex"
        aria-label="Previous photograph"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate(index + 1);
        }}
        className="absolute right-1 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center text-4xl font-light text-sand opacity-60 transition-opacity hover:opacity-100 sm:flex"
        aria-label="Next photograph"
      >
        ›
      </button>
      <p className="label absolute bottom-4 left-1/2 -translate-x-1/2 text-sand/80">
        {counter}
      </p>

      {hint !== "idle" ? (
        <p
          aria-hidden="true"
          className={`label pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-sand transition-opacity duration-[var(--dur-short)] ${
            hint === "leaving" ? "opacity-0" : "opacity-90"
          }`}
        >
          {coarsePointer ? "Swipe to browse" : "Use arrow keys"}
        </p>
      ) : null}

      {/* Preload neighbors at display size so advancing feels instant */}
      <div aria-hidden="true" className="sr-only">
        {preload.map((n) => (
          <Photo key={n} photo={photographs[n]} sizes="92vw" quality={85} />
        ))}
      </div>
    </div>
  );
}
