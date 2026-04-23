import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateCustomerInput, Customer } from "@/types/tms";

const API_BASE = "/api/customers";

async function fetchCustomers(): Promise<Customer[]> {
  return apiGet<Customer[]>(API_BASE);
}

async function fetchCustomer(id: string): Promise<Customer> {
  return apiGet<Customer>(`${API_BASE}/${id}`);
}

async function createCustomer(data: CreateCustomerInput): Promise<Customer> {
  return apiPost<Customer>(API_BASE, data);
}

async function updateCustomer(
  id: string,
  data: Partial<CreateCustomerInput>,
): Promise<Customer> {
  return apiPut<Customer>(`${API_BASE}/${id}`, data);
}

async function deleteCustomer(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCustomerInput>;
    }) => updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
