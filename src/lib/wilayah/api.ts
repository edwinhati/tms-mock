const BASE_URL = "https://wilayah.id/api";

export interface WilayahItem {
  code: string;
  name: string;
}

export async function getProvinces(): Promise<WilayahItem[]> {
  const res = await fetch(`${BASE_URL}/provinces.json`);
  if (!res.ok) throw new Error("Failed to fetch provinces");
  return res.json();
}

export async function getRegencies(
  provinceCode: string,
): Promise<WilayahItem[]> {
  const res = await fetch(`${BASE_URL}/regencies/${provinceCode}.json`);
  if (!res.ok)
    throw new Error(`Failed to fetch regencies for province ${provinceCode}`);
  return res.json();
}

export async function getDistricts(
  regencyCode: string,
): Promise<WilayahItem[]> {
  const res = await fetch(`${BASE_URL}/districts/${regencyCode}.json`);
  if (!res.ok)
    throw new Error(`Failed to fetch districts for regency ${regencyCode}`);
  return res.json();
}

export async function getVillages(
  districtCode: string,
): Promise<WilayahItem[]> {
  const res = await fetch(`${BASE_URL}/villages/${districtCode}.json`);
  if (!res.ok)
    throw new Error(`Failed to fetch villages for district ${districtCode}`);
  return res.json();
}
