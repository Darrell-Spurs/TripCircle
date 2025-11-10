"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

import { useUpdateProfile } from "@/hooks/api/useUpdateProfile";
import type { UserProfileResponse } from "@/lib/api/types";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileResponse;
};

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");

  const { mutate: updateProfile, isPending } = useUpdateProfile(profile.handle || "");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setWebsite(profile.website || "");
    }
  }, [isOpen, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile(
      {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl rounded-2xl bg-black shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-8">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-white transition hover:bg-white/10"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-white">Edit profile</h2>
            </div>
            <button
              type="submit"
              form="edit-profile-form"
              disabled={isPending}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Form */}
          <form id="edit-profile-form" onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
            {/* Banner placeholder */}
            <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-900">
              <div className="absolute -bottom-16 left-4">
                <div className="h-32 w-32 rounded-full border-4 border-black bg-slate-700">
                  {profile.avatarUrl && (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName || "Profile"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-6 px-4 pb-6 pt-20">
              {/* Display Name */}
              <div className="space-y-2">
                <label htmlFor="displayName" className="block text-sm font-medium text-zinc-400">
                  Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-3 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Your name"
                />
                <div className="text-right text-xs text-zinc-500">
                  {displayName.length}/50
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-400">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-transparent px-4 py-3 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Tell us about yourself"
                />
                <div className="text-right text-xs text-zinc-500">
                  {bio.length}/160
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-zinc-400">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={30}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-3 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Your location"
                />
                <div className="text-right text-xs text-zinc-500">
                  {location.length}/30
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label htmlFor="website" className="block text-sm font-medium text-zinc-400">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-3 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

