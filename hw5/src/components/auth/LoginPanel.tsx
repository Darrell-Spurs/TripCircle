"use client";

import { signIn } from "next-auth/react";

type LoginPanelProps = {
  callbackUrl?: string;
};

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
  { id: "facebook", label: "Continue with Facebook" },
] as const;

export function LoginPanel({ callbackUrl }: LoginPanelProps) {
  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--border)] bg-black/80 p-10 shadow-2xl">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-400">
          Choose one of the providers below. On first sign in you&apos;ll pick a handle.
        </p>
      </header>
      <div className="space-y-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() =>
              signIn(provider.id, {
                callbackUrl: callbackUrl ?? undefined,
              })
            }
            className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            {provider.label}
          </button>
        ))}
      </div>
    </div>
  );
}
