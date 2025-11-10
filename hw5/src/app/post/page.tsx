"use client";

import { signIn, useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import {
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  BookmarkIcon,
  FaceSmileIcon,
  GifIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import {
  useCreateDraft,
  useDeleteDraft,
  useDrafts,
  useUpdateDraft,
} from "@/hooks/api/useDrafts";
import { useCreatePost } from "@/hooks/api/usePostActions";
import type { DraftResponse } from "@/lib/api/types";

const LINK_REGEX = /^https?:\/\/\S+$/i;
const HASHTAG_MENTION_REGEX = /^[#@][A-Za-z0-9_]+$/;

function calculateLength(text: string) {
  const tokens = text.split(/(\s+)/);
  let length = 0;

  tokens.forEach((token) => {
    if (!token.trim()) {
      length += token.length;
      return;
    }

    if (LINK_REGEX.test(token)) {
      length += 23;
      return;
    }

    if (HASHTAG_MENTION_REGEX.test(token)) {
      return;
    }

    length += token.length;
  });

  return length;
}

function buildPreviewNodes(text: string) {
  const lines = text.split("\n");

  return lines.flatMap((line, lineIndex) => {
    const tokens = line.split(/(\s+)/);

    const nodes = tokens.map((token, tokenIndex) => {
      if (!token.trim()) {
        return <span key={`ws-${lineIndex}-${tokenIndex}`}>{token}</span>;
      }

      if (LINK_REGEX.test(token)) {
        return (
          <a
            key={`link-${lineIndex}-${tokenIndex}`}
            href={token}
            className="text-sky-400 hover:underline"
          >
            {token}
          </a>
        );
      }

      if (HASHTAG_MENTION_REGEX.test(token)) {
        return (
          <span key={`tag-${lineIndex}-${tokenIndex}`} className="text-sky-400">
            {token}
          </span>
        );
      }

      return <span key={`text-${lineIndex}-${tokenIndex}`}>{token}</span>;
    });

    if (lineIndex < lines.length - 1) {
      nodes.push(<br key={`br-${lineIndex}`} />);
    }

    return nodes;
  });
}

function sortDrafts(drafts: DraftResponse[] = []) {
  return [...drafts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function PostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.handle);
  const { data: draftsData = [], isLoading: draftsLoading } = useDrafts(isAuthenticated);
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  const createPost = useCreatePost();

  const sortedDrafts = useMemo(() => sortDrafts(draftsData), [draftsData]);

  const [content, setContent] = useState("");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const effectiveLength = useMemo(() => calculateLength(content), [content]);
  const remaining = 280 - effectiveLength;
  const isOverLimit = remaining < 0;

  const previewNodes = useMemo(() => buildPreviewNodes(content), [content]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8 text-sm text-zinc-500">
        Checking your session…
      </div>
    );
  }

  const handleClear = () => {
    setContent("");
    setActiveDraftId(null);
  };

  const handleCancel = () => {
    if (!content.trim()) {
      handleClear();
      return;
    }
    setShowConfirm(true);
  };

  const handleSaveDraft = () => {
    if (!isAuthenticated) {
      signIn();
      return;
    }
    const trimmed = content.trim();
    if (!trimmed.length) {
      setShowConfirm(false);
      return;
    }

    if (activeDraftId) {
      updateDraft.mutate({ id: activeDraftId, content: trimmed }, {
        onSuccess: (draft) => {
          setActiveDraftId(draft.id);
          setShowConfirm(false);
        },
      });
    } else {
      createDraft.mutate(trimmed, {
        onSuccess: (draft) => {
          setActiveDraftId(draft.id);
          setShowConfirm(false);
        },
      });
    }

    handleClear();
  };

  const handleDiscard = () => {
    handleClear();
    setShowConfirm(false);
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      signIn();
      return;
    }
    const trimmed = content.trim();
    if (!trimmed.length || isOverLimit) return;

    createPost.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          if (activeDraftId) {
            deleteDraft.mutate(activeDraftId);
          }
          handleClear();
          router.push("/");
        },
      },
    );
  };

  const handleSelectDraft = (draft: DraftResponse) => {
    setContent(draft.content);
    setActiveDraftId(draft.id);
    setShowDrafts(false);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8 text-white">
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold">Compose Post</h1>
        <button
          onClick={() => setShowDrafts(true)}
          className="ml-auto rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Drafts ({draftsLoading ? "…" : sortedDrafts.length})
        </button>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-black/60 p-6 shadow-lg backdrop-blur">
        <div className="flex gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-sky-500" aria-hidden />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What is happening?!"
              className="h-32 w-full resize-none bg-transparent text-lg text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/40 p-4 text-sm text-zinc-400">
                <p className="font-medium text-white">Preview</p>
                <p className="mt-2 whitespace-pre-wrap text-base text-white">
                  {content ? previewNodes : "Your post preview will show up here."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-brand-primary">
                  {[PhotoIcon, GifIcon, FaceSmileIcon, MapPinIcon, PaperAirplaneIcon].map((Icon, index) => (
                    <span
                      key={index}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span
                    className={clsx(
                      "text-zinc-500",
                      remaining <= 20 && remaining >= 0 && "text-yellow-400",
                      isOverLimit && "text-red-400",
                    )}
                  >
                    {remaining}
                  </span>
                  <button
                    onClick={handlePublish}
                    disabled={!content.trim().length || isOverLimit || createPost.isPending}
                    className="rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {!isAuthenticated
                      ? "Sign in"
                      : createPost.isPending
                        ? "Posting…"
                        : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 flex items-center justify-end gap-3 text-sm">
        <button
          onClick={handleCancel}
          className="rounded-full border border-[var(--border)] px-4 py-1.5 text-white transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-full border border-[var(--border)] px-4 py-1.5 text-white transition hover:bg-white/10"
        >
          Save draft
        </button>
      </section>

      {showDrafts ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-black shadow-xl">
            <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <BookmarkIcon className="h-5 w-5 text-sky-400" aria-hidden />
                Drafts
              </div>
              <button
                onClick={() => setShowDrafts(false)}
                className="rounded-full px-3 py-1 text-sm text-zinc-400 transition hover:bg-white/10"
              >
                Close
              </button>
            </header>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 py-5">
              {!isAuthenticated ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Sign in to manage drafts</p>
                  <p className="mt-2">Save drafts and continue them whenever you like.</p>
                  <button
                    onClick={() => signIn()}
                    className="mt-4 w-full rounded-full bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Sign in
                  </button>
                </div>
              ) : draftsLoading ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-6 text-sm text-zinc-400">
                  Loading drafts…
                </div>
              ) : sortedDrafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-black/30 py-10 text-sm text-zinc-500">
                  <ArrowUturnLeftIcon className="h-6 w-6 text-zinc-600" aria-hidden />
                  <p>No drafts yet. Save one and it will appear here.</p>
                </div>
              ) : (
                sortedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="rounded-xl border border-[var(--border)] bg-black/40 p-4 transition hover:border-sky-500/60"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6 text-white line-clamp-3">
                      {draft.content}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        Updated {new Date(draft.updatedAt).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectDraft(draft)}
                          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Continue
                        </button>
                        <button
                          onClick={() => deleteDraft.mutate(draft.id)}
                          className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-black shadow-2xl">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Discard post?</h2>
              <p className="mt-1 text-sm text-zinc-400">
                You have unsaved changes. Save to draft or discard before leaving.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <button
                onClick={handleSaveDraft}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                <BookmarkIcon className="h-4 w-4" aria-hidden />
                Save to draft
              </button>
              <button
                onClick={handleDiscard}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
                Discard
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

