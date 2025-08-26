// React Query hook for license data fetching
// Importance: Provides cached, optimized data fetching with loading states and error handling

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LicenseWithActivationData } from "@/app/dashboard/licenses/page";

// Query keys for React Query cache management
export const licenseKeys = {
  all: ["licenses"] as const,
  lists: () => [...licenseKeys.all, "list"] as const,
  list: (filters: string) => [...licenseKeys.lists(), { filters }] as const,
  details: () => [...licenseKeys.all, "detail"] as const,
  detail: (id: string) => [...licenseKeys.details(), id] as const,
};

// Fetch licenses from the API
async function fetchLicenses(): Promise<LicenseWithActivationData[]> {
  const response = await fetch("/api/licenses", {
    credentials: "include", // Include cookies for authentication
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    throw new Error(`Failed to fetch licenses: ${response.status}`);
  }
  const result = await response.json();
  console.log("API Response:", result);
  // Handle the API response format: { success: true, data: [...] }
  return result.data || result;
}

// React Query hook for fetching licenses
export function useLicenses() {
  return useQuery({
    queryKey: licenseKeys.lists(),
    queryFn: fetchLicenses,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Keep data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
}

// Mutation for creating a test license
export function useCreateTestLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/licenses/test", {
        method: "POST",
        credentials: "include", // Include cookies for authentication
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to create test license: ${response.status}`);
      }
      const result = await response.json();
      return result.data || result;
    },
    // Invalidate and refetch licenses after successful creation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
    },
  });
}

// Mutation for revoking a license
export function useRevokeLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      const response = await fetch(`/api/licenses/${licenseId}/revoke`, {
        method: "POST",
        credentials: "include", // Include cookies for authentication
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to revoke license: ${response.status}`);
      }
      const result = await response.json();
      return result.data || result;
    },
    // Invalidate and refetch licenses after successful revocation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
    },
  });
}

// Mutation for unbinding a device
export function useUnbindDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      const response = await fetch(`/api/licenses/${licenseId}/unbind`, {
        method: "POST",
        credentials: "include", // Include cookies for authentication
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to unbind device: ${response.status}`);
      }
      const result = await response.json();
      return result.data || result;
    },
    // Invalidate and refetch licenses after successful unbinding
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
    },
  });
}

// Mutation for deleting a license (dev only)
export function useDeleteLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      const response = await fetch(`/api/licenses/${licenseId}/delete`, {
        method: "DELETE",
        credentials: "include", // Include cookies for authentication
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to delete license: ${response.status}`);
      }
      const result = await response.json();
      return result.data || result;
    },
    // Invalidate and refetch licenses after successful deletion
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
    },
  });
}
