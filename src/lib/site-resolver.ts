import { db } from "@/lib/db";
import {
  warehouses,
  hubs,
  ports,
  schools,
  vendors,
  customers,
} from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

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
    typeMap.get(site.type)!.add(site.id);
  }

  const promises: Promise<void>[] = [];

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

  if (typeMap.has("warehouse")) {
    promises.push(
      addPromise(
        "warehouse",
        warehouses,
        Array.from(typeMap.get("warehouse")!),
      ),
    );
  }
  if (typeMap.has("hub")) {
    promises.push(addPromise("hub", hubs, Array.from(typeMap.get("hub")!)));
  }
  if (typeMap.has("port")) {
    promises.push(addPromise("port", ports, Array.from(typeMap.get("port")!)));
  }
  if (typeMap.has("school")) {
    promises.push(
      addPromise("school", schools, Array.from(typeMap.get("school")!)),
    );
  }
  if (typeMap.has("vendor")) {
    promises.push(
      addPromise("vendor", vendors, Array.from(typeMap.get("vendor")!)),
    );
  }
  if (typeMap.has("customer")) {
    promises.push(
      addPromise("customer", customers, Array.from(typeMap.get("customer")!)),
    );
  }

  await Promise.all(promises);
  return result;
}
