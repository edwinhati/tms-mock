import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateVendorInput, Vendor } from "@/types/tms";

const API_BASE = "/api/vendors";

async function fetchVendors(): Promise<Vendor[]> {
  return apiGet<Vendor[]>(API_BASE);
}

async function fetchVendor(id: string): Promise<Vendor> {
  return apiGet<Vendor>(`${API_BASE}/${id}`);
}

async function createVendor(data: CreateVendorInput): Promise<Vendor> {
  return apiPost<Vendor>(API_BASE, data);
}

async function updateVendor(
  id: string,
  data: Partial<CreateVendorInput>,
): Promise<Vendor> {
  return apiPut<Vendor>(`${API_BASE}/${id}`, data);
}

async function deleteVendor(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useVendorsHook() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });
}

export function useVendorHook(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => fetchVendor(id),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateVendorInput>;
    }) => updateVendor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", variables.id] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
