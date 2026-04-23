import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Port } from "@/types/tms";
import type { PortFormValues } from "@/lib/schemas";

const API_BASE = "/api/ports";

async function fetchPorts(): Promise<Port[]> {
  return apiGet<Port[]>(API_BASE);
}

async function fetchPort(id: string): Promise<Port> {
  return apiGet<Port>(`${API_BASE}/${id}`);
}

async function createPort(data: PortFormValues): Promise<Port> {
  return apiPost<Port>(API_BASE, data);
}

async function updatePort(
  id: string,
  data: Partial<PortFormValues>,
): Promise<Port> {
  return apiPut<Port>(`${API_BASE}/${id}`, data);
}

async function deletePort(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function usePorts() {
  return useQuery({
    queryKey: ["ports"],
    queryFn: fetchPorts,
  });
}

export function usePort(id: string) {
  return useQuery({
    queryKey: ["ports", id],
    queryFn: () => fetchPort(id),
    enabled: !!id,
  });
}

export function useCreatePort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ports"] });
    },
  });
}

export function useUpdatePort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PortFormValues> }) =>
      updatePort(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ports"] });
      queryClient.invalidateQueries({ queryKey: ["ports", variables.id] });
    },
  });
}

export function useDeletePort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ports"] });
    },
  });
}
