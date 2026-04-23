import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateShippingRateInput, ShippingRate } from "@/types/tms";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";

const API_BASE = "/api/shipping-rates";

async function fetchShippingRates(): Promise<ShippingRate[]> {
  return apiGet(API_BASE);
}

async function fetchShippingRate(id: string): Promise<ShippingRate> {
  return apiGet(`${API_BASE}/${id}`);
}

async function createShippingRate(
  data: CreateShippingRateInput,
): Promise<ShippingRate> {
  return apiPost(API_BASE, data);
}

async function updateShippingRate(
  id: string,
  data: Partial<CreateShippingRateInput>,
): Promise<ShippingRate> {
  return apiPut(`${API_BASE}/${id}`, data);
}

async function deleteShippingRate(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useShippingRates() {
  return useQuery({
    queryKey: ["shipping-rates"],
    queryFn: fetchShippingRates,
  });
}

export function useShippingRate(id: string) {
  return useQuery({
    queryKey: ["shipping-rates", id],
    queryFn: () => fetchShippingRate(id),
    enabled: !!id,
  });
}

export function useCreateShippingRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShippingRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-rates"] });
    },
  });
}

export function useUpdateShippingRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateShippingRateInput>;
    }) => updateShippingRate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipping-rates"] });
      queryClient.invalidateQueries({
        queryKey: ["shipping-rates", variables.id],
      });
    },
  });
}

export function useDeleteShippingRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShippingRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-rates"] });
    },
  });
}
