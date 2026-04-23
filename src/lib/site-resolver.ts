import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  customers,
  hubs,
  ports,
  schools,
  vendors,
  warehouses,
} from "@/lib/db/schema";

export type SiteType =
  | "warehouse"
  | "hub"
  | "port"
  | "school"
  | "vendor"
  | "customer";

export interface SiteReference {
  id: string;
  type: SiteType;
}

export async function resolveSiteNames(
  sites: SiteReference[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (sites.length === 0) return result;

  const typeMap = new Map<SiteType, Set<string>>();

  for (const site of sites) {
    if (!typeMap.has(site.type)) {
      typeMap.set(site.type, new Set());
    }
    typeMap.get(site.type)?.add(site.id);
  }

  const promises: Promise<void>[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: Complex Drizzle table type
  const addPromise = async (type: SiteType, table: any, ids: string[]) => {
    if (ids.length === 0) return;
    const data = await db
      .select({ id: table.id, name: table.name })
      .from(table)
      .where(inArray(table.id, ids));

    for (const item of data) {
      result.set(`${type}:${item.id}`, item.name);
    }
  };

  for (const [type, ids] of typeMap.entries()) {
    // biome-ignore lint/suspicious/noExplicitAny: Complex Drizzle table type
    let table: any;
    switch (type) {
      case "warehouse":
        table = warehouses;
        break;
      case "hub":
        table = hubs;
        break;
      case "port":
        table = ports;
        break;
      case "school":
        table = schools;
        break;
      case "vendor":
        table = vendors;
        break;
      case "customer":
        table = customers;
        break;
    }
    if (table) {
      promises.push(addPromise(type, table, Array.from(ids)));
    }
  }

  await Promise.all(promises);
  return result;
}
