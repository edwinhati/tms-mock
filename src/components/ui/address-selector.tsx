"use client";

import * as React from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { FormSelect, FormTextarea } from "@/components/ui/form-wrapper";
import {
  useProvinces,
  useRegencies,
  useDistricts,
  useVillages,
} from "@/hooks/use-wilayah";

interface AddressSelectorProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  prefix?: string;
}

export function AddressSelector<T extends FieldValues>({
  form,
  prefix = "",
}: AddressSelectorProps<T>) {
  const getFieldName = (name: string) =>
    (prefix ? `${prefix}.${name}` : name) as Path<T>;

  const provinceCode = form.watch(getFieldName("provinceCode"));
  const cityCode = form.watch(getFieldName("cityCode"));
  const districtCode = form.watch(getFieldName("districtCode"));
  const villageCode = form.watch(getFieldName("villageCode"));

  const { data: provinces, isLoading: loadingProvinces } = useProvinces();
  const { data: cities, isLoading: loadingCities } = useRegencies(provinceCode);
  const { data: districts, isLoading: loadingDistricts } =
    useDistricts(cityCode);
  const { data: villages, isLoading: loadingVillages } =
    useVillages(districtCode);

  // Update names and handle cascading reset
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only handle manual changes, not setValue calls unless they are from the UI
      // type can be "change" for user input
      if (type !== "change") return;

      const fullProvinceName = getFieldName("provinceCode");
      const fullCityName = getFieldName("cityCode");
      const fullDistrictName = getFieldName("districtCode");
      const fullVillageName = getFieldName("villageCode");

      if (name === fullProvinceName) {
        const currentVal = form.getValues(fullProvinceName);
        const selected = provinces?.find((p) => p.code === currentVal);
        form.setValue(
          getFieldName("provinceName"),
          (selected?.name || "") as any,
        );

        // Reset children
        form.setValue(getFieldName("cityCode"), "" as any);
        form.setValue(getFieldName("cityName"), "" as any);
        form.setValue(getFieldName("districtCode"), "" as any);
        form.setValue(getFieldName("districtName"), "" as any);
        form.setValue(getFieldName("villageCode"), "" as any);
        form.setValue(getFieldName("villageName"), "" as any);
      } else if (name === fullCityName) {
        const currentVal = form.getValues(fullCityName);
        const selected = cities?.find((c) => c.code === currentVal);
        form.setValue(getFieldName("cityName"), (selected?.name || "") as any);

        // Reset children
        form.setValue(getFieldName("districtCode"), "" as any);
        form.setValue(getFieldName("districtName"), "" as any);
        form.setValue(getFieldName("villageCode"), "" as any);
        form.setValue(getFieldName("villageName"), "" as any);
      } else if (name === fullDistrictName) {
        const currentVal = form.getValues(fullDistrictName);
        const selected = districts?.find((d) => d.code === currentVal);
        form.setValue(
          getFieldName("districtName"),
          (selected?.name || "") as any,
        );

        // Reset children
        form.setValue(getFieldName("villageCode"), "" as any);
        form.setValue(getFieldName("villageName"), "" as any);
      } else if (name === fullVillageName) {
        const currentVal = form.getValues(fullVillageName);
        const selected = villages?.find((v) => v.code === currentVal);
        form.setValue(
          getFieldName("villageName"),
          (selected?.name || "") as any,
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form, provinces, cities, districts, villages, prefix]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormSelect
        name={getFieldName("provinceCode")}
        label="Province"
        placeholder={loadingProvinces ? "Loading..." : "Select province"}
        options={
          provinces?.map((p) => ({ value: p.code, label: p.name })) || []
        }
        required
      />
      <FormSelect
        name={getFieldName("cityCode")}
        label="City"
        placeholder={loadingCities ? "Loading..." : "Select city"}
        options={cities?.map((c) => ({ value: c.code, label: c.name })) || []}
        disabled={!provinceCode || loadingCities}
        required
      />
      <FormSelect
        name={getFieldName("districtCode")}
        label="District"
        placeholder={loadingDistricts ? "Loading..." : "Select district"}
        options={
          districts?.map((d) => ({ value: d.code, label: d.name })) || []
        }
        disabled={!cityCode || loadingDistricts}
        required
      />
      <FormSelect
        name={getFieldName("villageCode")}
        label="Village"
        placeholder={loadingVillages ? "Loading..." : "Select village"}
        options={villages?.map((v) => ({ value: v.code, label: v.name })) || []}
        disabled={!districtCode || loadingVillages}
        required
      />
      <div className="sm:col-span-2">
        <FormTextarea
          name={getFieldName("address")}
          label="Detailed Address"
          placeholder="Street name, building number, etc."
          required
        />
      </div>
    </div>
  );
}
