import { useQuery } from "@tanstack/react-query";
import {
  getDistricts,
  getProvinces,
  getRegencies,
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
    queryFn: () =>
      provinceCode ? getRegencies(provinceCode) : Promise.resolve([]),
    enabled: !!provinceCode,
    staleTime: Infinity,
  });
}

export function useDistricts(regencyCode?: string) {
  return useQuery({
    queryKey: ["wilayah", "districts", regencyCode],
    queryFn: () =>
      regencyCode ? getDistricts(regencyCode) : Promise.resolve([]),
    enabled: !!regencyCode,
    staleTime: Infinity,
  });
}

export function useVillages(districtCode?: string) {
  return useQuery({
    queryKey: ["wilayah", "villages", districtCode],
    queryFn: () =>
      districtCode ? getVillages(districtCode) : Promise.resolve([]),
    enabled: !!districtCode,
    staleTime: Infinity,
  });
}
