"use client";

import { useEffect, useState } from "react";
import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";

type LoginPanelProps = {
  callbackUrl?: string;
};

export function LoginPanel({ callbackUrl }: LoginPanelProps) {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);

  useEffect(() => {
    void getProviders().then((result) => {
      setProviders(result);
    });
  }, []);

  const entries = providers ? Object.values(providers) : [];

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--border)] bg-black/80 p-10 shadow-2xl">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-400">
          Continue with one of the providers below. On your first sign-in you&apos;ll create a
          handle and display name.
        </p>
      </header>
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
            No sign-in methods are currently available. Please contact support.
          </div>
        ) : (
          entries.map((provider) => (
            <button
              key={provider.id}
              onClick={() =>
                signIn(provider.id, {
                  callbackUrl: callbackUrl ?? undefined,
                })
              }
              className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
            >
              Continue with {provider.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
