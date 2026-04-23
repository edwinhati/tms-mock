import { useQuery } from "@tanstack/react-query";
import { useWarehouses } from "./use-warehouses";
import { useHubs } from "./use-hubs";
import { usePorts } from "./use-ports";
import { useSchools } from "./use-schools";
import { useVendorsHook as useVendors } from "./use-vendors";
import { useCustomers } from "./use-customers";

export type SiteType =
  | "warehouse"
  | "hub"
  | "port"
  | "school"
  | "vendor"
  | "customer";

export function useSites(type?: SiteType | string | null) {
  const warehouses = useWarehouses();
  const hubs = useHubs();
  const ports = usePorts();
  const schools = useSchools();
  const vendors = useVendors();
  const customers = useCustomers();

  if (!type) {
    return { data: [], isLoading: false };
  }

  switch (type) {
    case "warehouse":
      return {
        data: warehouses.data?.map((d) => ({ id: d.id, name: d.name })) || [],
        isLoading: warehouses.isLoading,
      };
    case "hub":
      return {
        data: hubs.data?.map((d) => ({ id: d.id, name: d.name })) || [],
        isLoading: hubs.isLoading,
      };
    case "port":
      return {
        data: ports.data?.map((d) => ({ id: d.id, name: d.name })) || [],
        isLoading: ports.isLoading,
      };
    case "school":
      return {
        data: schools.data?.map((d) => ({ id: d.id, name: d.name })) || [],
        isLoading: schools.isLoading,
      };
    case "vendor":
      return {
        data: vendors.data?.map((d) => ({ id: d.id, name: d.name })) || [],
        isLoading: vendors.isLoading,
      };
    case "customer":
      return {
        data: customers.data?.map((d) => ({ id: d.id, name: d.name })) || [],
        isLoading: customers.isLoading,
      };
    default:
      return { data: [], isLoading: false };
  }
}
