"use client";

import { useRef, useState } from "react";

import { lastContentViewed, track } from "@/lib/analytics";

const PHOTOGRAPHY_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "elopement", label: "Elopement / intimate wedding" },
  { value: "engagement", label: "Engagement or proposal" },
  { value: "family", label: "Family session" },
  { value: "other", label: "Something else" },
] as const;

type PhotographyType = (typeof PHOTOGRAPHY_TYPES)[number]["value"];

const WEDDING_TYPES: PhotographyType[] = ["wedding", "elopement"];
const COUPLE_TYPES: PhotographyType[] = ["wedding", "elopement", "engagement"];

interface FieldErrors {
  [key: string]: string | undefined;
}

const inputClass =
  "w-full border border-sand bg-ivory px-4 py-3.5 text-charcoal placeholder:text-taupe/70 focus:border-charcoal focus:outline-none aria-[invalid=true]:border-wine";
const labelClass = "label mb-2 block text-umber";

function Field({
  label,
  htmlFor,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
        {optional ? <span className="normal-case tracking-normal text-taupe"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-wine">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function InquiryForm({ successMessage }: { successMessage?: string }) {
  const [type, setType] = useState<PhotographyType>("wedding");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const started = useRef(false);
  const startedAt = useRef<number | null>(null);

  const isWedding = WEDDING_TYPES.includes(type);
  const isCouple = COUPLE_TYPES.includes(type);

  const onFirstInteraction = () => {
    if (!started.current) {
      started.current = true;
      startedAt.current = Date.now();
      track("Inquiry Form Started", { type });
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const nextErrors: FieldErrors = {};
    if (!data.name?.trim()) nextErrors.name = "Please share your name.";
    if (!data.email?.trim()) nextErrors.email = "Please share your email so Courtney can reply.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      nextErrors.email = "That email address doesn't look quite right.";
    if (!data.message?.trim())
      nextErrors.message = "Tell Courtney a little about what you're planning.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = form.querySelector<HTMLElement>("[aria-invalid='true'], :invalid");
      firstInvalid?.focus();
      return;
    }

    setStatus("submitting");
    setServerError(null);
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type,
          // Content attribution — which page led to this inquiry (no personal data).
          viewedContent: lastContentViewed(),
          // Spam signal: humans take more than a couple of seconds.
          elapsedMs: startedAt.current ? Date.now() - startedAt.current : 0,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong sending your note.");
      }
      setStatus("success");
      track("Inquiry Form Submitted", { type, viewedContent: lastContentViewed() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error
          ? err.message
          : "Something went wrong sending your note. Please try again."
      );
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="border border-linen bg-parchment px-8 py-14 text-center">
        <p className="font-display text-3xl text-ink">Thank you</p>
        <p className="mx-auto mt-4 max-w-md text-umber">
          {successMessage ??
            "Your note is on its way. Courtney will be in touch soon, usually within two business days."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onInput={onFirstInteraction} noValidate className="space-y-7">
      {/* Honeypot — invisible to people, tempting to bots. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="inquiry-website">Leave this field empty</label>
        <input id="inquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className={labelClass}>What kind of photography?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PHOTOGRAPHY_TYPES.map((t) => (
            <label
              key={t.value}
              className={`flex cursor-pointer items-center gap-3 border px-4 py-3.5 transition-colors ${
                type === t.value
                  ? "border-charcoal bg-parchment"
                  : "border-sand hover:border-taupe"
              }`}
            >
              <input
                type="radio"
                name="typeRadio"
                value={t.value}
                checked={type === t.value}
                onChange={() => {
                  onFirstInteraction();
                  setType(t.value);
                }}
                className="h-4 w-4 accent-charcoal"
              />
              <span className="text-[0.95rem]">{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Your name" htmlFor="inquiry-name" error={errors.name}>
          <input
            id="inquiry-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "inquiry-name-error" : undefined}
            className={inputClass}
          />
        </Field>
        {isCouple ? (
          <Field label="Your partner's name" htmlFor="inquiry-partner" optional>
            <input
              id="inquiry-partner"
              name="partnerName"
              type="text"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
        ) : null}
        <Field label="Email" htmlFor="inquiry-email" error={errors.email}>
          <input
            id="inquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "inquiry-email-error" : undefined}
            className={inputClass}
          />
        </Field>
        <Field label="Phone" htmlFor="inquiry-phone" optional>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </Field>
        <Field
          label={isWedding ? "Wedding date" : "Preferred date"}
          htmlFor="inquiry-date"
          optional
        >
          <input id="inquiry-date" name="date" type="date" className={inputClass} />
        </Field>
        {isWedding ? (
          <Field label="Venue" htmlFor="inquiry-venue" optional>
            <input
              id="inquiry-venue"
              name="venue"
              type="text"
              placeholder="Booked or dreaming, either is lovely"
              className={inputClass}
            />
          </Field>
        ) : (
          <Field label="Location" htmlFor="inquiry-location" optional>
            <input
              id="inquiry-location"
              name="location"
              type="text"
              placeholder="Where you'd love to be photographed"
              className={inputClass}
            />
          </Field>
        )}
      </div>

      <Field label="How did you hear about Courtney?" htmlFor="inquiry-referral" optional>
        <input
          id="inquiry-referral"
          name="referral"
          type="text"
          placeholder="A friend, Instagram, your venue, Google…"
          className={inputClass}
        />
      </Field>

      <Field
        label={isWedding ? "Tell Courtney about your day" : "Tell Courtney about your plans"}
        htmlFor="inquiry-message"
        error={errors.message}
      >
        <textarea
          id="inquiry-message"
          name="message"
          rows={6}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "inquiry-message-error" : undefined}
          placeholder={
            isWedding
              ? "Your story, your people, what matters most about how the day is remembered…"
              : "Who would be photographed, and what you're imagining…"
          }
          className={inputClass}
        />
      </Field>

      {serverError ? (
        <p role="alert" className="border border-wine/40 bg-wine/5 px-4 py-3 text-sm text-wine">
          {serverError} If it keeps happening, email Courtney directly instead; the address is
          in the footer below.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="label w-full bg-charcoal px-8 py-4.5 text-ivory transition-colors hover:bg-ink disabled:opacity-60 sm:w-auto sm:px-14"
      >
        {status === "submitting" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
