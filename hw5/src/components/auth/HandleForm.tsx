"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const HANDLE_REGEX = /^[A-Za-z0-9]{1,16}$/;

export function HandleForm() {
  const router = useRouter();
  const { update } = useSession();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!HANDLE_REGEX.test(trimmed)) {
      setError("Handle must be 1-16 letters or numbers.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/handle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ handle: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError((data?.message as string) ?? "Unable to save handle.");
        setIsSubmitting(false);
        return;
      }

      await update({
        user: {
          handle: trimmed,
        },
      });
      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--border)] bg-black/80 p-10 shadow-2xl"
    >
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Choose your handle</h1>
        <p className="text-sm text-zinc-400">
          This will be visible to everyone. You can change it later in settings.
        </p>
      </header>
      <div className="space-y-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={16}
          className="h-12 w-full rounded-full border border-white/20 bg-transparent px-5 text-base focus:border-white focus:outline-none"
          placeholder="Your handle"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
