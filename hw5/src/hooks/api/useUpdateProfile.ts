import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

type UpdateProfileData = {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

export function useUpdateProfile(handle: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => api.users.updateProfile(handle, data),
    onSuccess: () => {
      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(handle) });
    },
  });
}

