import { useQuery } from "@tanstack/react-query";
import {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
} from "@/lib/wilayah/api";

export function useProvinces() {
  return useQuery({
    queryKey: ["wilayah", "provinces"],
    queryFn: getProvinces,
    staleTime: Infinity,
  });
}

export function useRegencies(provinceCode?: string) {
  return useQuery({
    queryKey: ["wilayah", "regencies", provinceCode],
    queryFn: () => getRegencies(provinceCode!),
    enabled: !!provinceCode,
    staleTime: Infinity,
  });
}

export function useDistricts(regencyCode?: string) {
  return useQuery({
    queryKey: ["wilayah", "districts", regencyCode],
    queryFn: () => getDistricts(regencyCode!),
    enabled: !!regencyCode,
    staleTime: Infinity,
  });
}

export function useVillages(districtCode?: string) {
  return useQuery({
    queryKey: ["wilayah", "villages", districtCode],
    queryFn: () => getVillages(districtCode!),
    enabled: !!districtCode,
    staleTime: Infinity,
  });
}
