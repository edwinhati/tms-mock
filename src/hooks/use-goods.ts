import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateGoodsInput, Good } from "@/types/tms";

const API_BASE = "/api/goods";

async function fetchGoods(): Promise<Good[]> {
  return apiGet<Good[]>(API_BASE);
}

async function fetchGood(id: string): Promise<Good> {
  return apiGet<Good>(`${API_BASE}/${id}`);
}

async function createGood(data: CreateGoodsInput): Promise<Good> {
  return apiPost<Good>(API_BASE, data);
}

async function updateGood(
  id: string,
  data: Partial<CreateGoodsInput>,
): Promise<Good> {
  return apiPut<Good>(`${API_BASE}/${id}`, data);
}

async function deleteGood(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useGoods() {
  return useQuery({
    queryKey: ["goods"],
    queryFn: fetchGoods,
  });
}

export function useGood(id: string) {
  return useQuery({
    queryKey: ["goods", id],
    queryFn: () => fetchGood(id),
    enabled: !!id,
  });
}

export function useCreateGood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods"] });
    },
  });
}

export function useUpdateGood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateGoodsInput>;
    }) => updateGood(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goods"] });
      queryClient.invalidateQueries({ queryKey: ["goods", variables.id] });
    },
  });
}

export function useDeleteGood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods"] });
    },
  });
}
