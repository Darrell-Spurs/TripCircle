"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const HANDLE_REGEX = /^[A-Za-z0-9]{1,16}$/;
const MAX_DISPLAY_NAME = 40;

export function HandleForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [handleValue, setHandleValue] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedHandle = handleValue.trim();
    const trimmedDisplayName = displayName.trim();

    if (!HANDLE_REGEX.test(trimmedHandle)) {
      setError("Handle must be 1-16 letters or numbers.");
      return;
    }

    if (!trimmedDisplayName.length) {
      setError("Display name is required.");
      return;
    }

    if (trimmedDisplayName.length > MAX_DISPLAY_NAME) {
      setError(`Display name must be ${MAX_DISPLAY_NAME} characters or fewer.`);
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
        body: JSON.stringify({
          handle: trimmedHandle,
          displayName: trimmedDisplayName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError((data?.message as string) ?? "Unable to save profile details.");
        setIsSubmitting(false);
        return;
      }

      await update({
        user: {
          id: session?.user?.id || "",
          handle: trimmedHandle,
          name: trimmedDisplayName,
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
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Set up your profile</h1>
        <p className="text-sm text-zinc-400">
          Pick a display name and handle so people can find you. You can update these later in
          settings.
        </p>
      </header>
      <div className="space-y-4">
        <div className="space-y-2 text-left">
          <label className="block text-sm font-semibold text-white" htmlFor="displayName">
            Display name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={MAX_DISPLAY_NAME}
            className="h-12 w-full rounded-full border border-white/20 bg-transparent px-5 text-base focus:border-white focus:outline-none"
            placeholder="Choose a display name"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2 text-left">
          <label className="block text-sm font-semibold text-white" htmlFor="handle">
            Handle
          </label>
          <div className="flex items-center overflow-hidden rounded-full border border-white/20 focus-within:border-white">
            <span className="px-4 text-base text-zinc-500">@</span>
            <input
              id="handle"
              value={handleValue}
              onChange={(event) => setHandleValue(event.target.value)}
              maxLength={16}
              className="h-12 flex-1 bg-transparent pr-5 text-base text-white focus:outline-none"
              placeholder="chooseahandle"
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-zinc-500">Letters and numbers only, up to 16 characters.</p>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
      <button
        type="submit"
        disabled={
          !displayName.trim().length || !handleValue.trim().length || isSubmitting
        }
        className="flex w-full items-center justify-center rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Create account"}
      </button>
    </form>
  );
}
