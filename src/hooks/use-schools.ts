import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateSchoolInput, School } from "@/types/tms";

const API_BASE = "/api/schools";

async function fetchSchools(): Promise<School[]> {
  return apiGet<School[]>(API_BASE);
}

async function fetchSchool(id: string): Promise<School> {
  return apiGet<School>(`${API_BASE}/${id}`);
}

async function createSchool(data: CreateSchoolInput): Promise<School> {
  return apiPost<School>(API_BASE, data);
}

async function updateSchool(
  id: string,
  data: Partial<CreateSchoolInput>,
): Promise<School> {
  return apiPut<School>(`${API_BASE}/${id}`, data);
}

async function deleteSchool(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useSchools() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: fetchSchools,
  });
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: ["schools", id],
    queryFn: () => fetchSchool(id),
    enabled: !!id,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateSchoolInput>;
    }) => updateSchool(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["schools", variables.id] });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}
