"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";
import type { DraftResponse } from "@/lib/api/types";

import { queryKeys } from "./query-keys";

export function useDrafts(enabled = true) {
  return useQuery<DraftResponse[]>({
    queryKey: queryKeys.drafts,
    queryFn: api.drafts.list,
    enabled,
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.drafts.create(content),
    onSuccess: (draft) => {
      queryClient.setQueryData<DraftResponse[] | undefined>(
        queryKeys.drafts,
        (current) => (current ? [draft, ...current] : [draft]),
      );
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; content: string }) =>
      api.drafts.update(input.id, input.content),
    onSuccess: (draft) => {
      queryClient.setQueryData<DraftResponse[] | undefined>(
        queryKeys.drafts,
        (current) =>
          current?.map((existing) =>
            existing.id === draft.id ? draft : existing,
          ),
      );
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.drafts.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<DraftResponse[] | undefined>(
        queryKeys.drafts,
        (current) => current?.filter((draft) => draft.id !== id),
      );
    },
  });
}

