import { relations } from "drizzle-orm";
import {
  decimal,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// Enums
export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "truck",
  "wing_box",
  "ship",
  "container",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "active",
  "inactive",
  "maintenance",
]);

export const driverStatusEnum = pgEnum("driver_status", ["active", "inactive"]);

export const educationLevelEnum = pgEnum("education_level", [
  "SD",
  "SMP",
  "SMA",
  "SMK",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "planned",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const legStatusEnum = pgEnum("leg_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const proofTypeEnum = pgEnum("proof_type", [
  "photo",
  "bast",
  "signature",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "whatsapp",
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const goodsUnitEnum = pgEnum("goods_unit", ["set", "unit", "pcs"]);

export const siteTypeEnum = pgEnum("site_type", [
  "warehouse",
  "hub",
  "port",
  "school",
  "vendor",
  "customer",
]);

// Helper for universal address fields
const addressFields = {
  provinceCode: text("province_code"),
  provinceName: text("province_name"),
  cityCode: text("city_code"),
  cityName: text("city_name"),
  districtCode: text("district_code"),
  districtName: text("district_name"),
  villageCode: text("village_code"),
  villageName: text("village_name"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
};

// ==================== CORE ENTITIES ====================

// 1. Customers
export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    ...addressFields,
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("customers_name_idx").on(table.name)],
);

// 2. Vendors
export const vendors = pgTable(
  "vendors",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    ...addressFields,
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("vendors_name_idx").on(table.name)],
);

// 3. Warehouses
export const warehouses = pgTable(
  "warehouses",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    ...addressFields,
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("warehouses_name_idx").on(table.name)],
);

// 4. Hubs
export const hubs = pgTable(
  "hubs",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    ...addressFields,
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("hubs_name_idx").on(table.name)],
);

// 5. Ports
export const ports = pgTable(
  "ports",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    ...addressFields,
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("ports_name_idx").on(table.name)],
);

// 6. Schools
export const schools = pgTable(
  "schools",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    educationLevel: educationLevelEnum("education_level").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    ...addressFields,
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("schools_name_idx").on(table.name)],
);

// 7. Vehicles
export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    type: vehicleTypeEnum("type").notNull(),
    licensePlate: text("license_plate"),
    capacity: decimal("capacity", { precision: 10, scale: 2 }), // in kg
    volume: decimal("volume", { precision: 10, scale: 2 }), // in m3
    status: vehicleStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("vehicles_vendorId_idx").on(table.vendorId),
    index("vehicles_type_idx").on(table.type),
    index("vehicles_status_idx").on(table.status),
  ],
);

// 6. Drivers
export const drivers = pgTable(
  "drivers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    licenseNumber: text("license_number"),
    status: driverStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("drivers_userId_idx").on(table.userId),
    index("drivers_status_idx").on(table.status),
  ],
);

// 7. Goods
export const goods = pgTable(
  "goods",
  {
    id: text("id").primaryKey(),
    materialCode: text("material_code").notNull().unique(),
    description: text("description").notNull(),
    unit: goodsUnitEnum("unit").notNull(),
    defaultWeight: decimal("default_weight", { precision: 10, scale: 2 }),
    defaultVolume: decimal("default_volume", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("goods_materialCode_idx").on(table.materialCode)],
);

// 10. Shipping Rates
export const shippingRates = pgTable(
  "shipping_rates",
  {
    id: text("id").primaryKey(),
    originId: text("origin_id").notNull(),
    originType: siteTypeEnum("origin_type").notNull(),
    destinationId: text("destination_id").notNull(),
    destinationType: siteTypeEnum("destination_type").notNull(),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    ratePerKg: decimal("rate_per_kg", { precision: 12, scale: 2 }),
    ratePerVolume: decimal("rate_per_volume", { precision: 12, scale: 2 }),
    ratePerTrip: decimal("rate_per_trip", { precision: 12, scale: 2 }),
    effectiveDate: timestamp("effective_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("shippingRates_originId_idx").on(table.originId),
    index("shippingRates_destinationId_idx").on(table.destinationId),
    index("shippingRates_vehicleType_idx").on(table.vehicleType),
  ],
);

// ==================== TRANSACTION ENTITIES ====================

// 11. Shipments
export const shipments = pgTable(
  "shipments",
  {
    id: text("id").primaryKey(),
    shipmentNumber: text("shipment_number").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    originId: text("origin_id").notNull(),
    originType: siteTypeEnum("origin_type").notNull(),
    destinationId: text("destination_id").notNull(),
    destinationType: siteTypeEnum("destination_type").notNull(),
    status: shipmentStatusEnum("status").default("planned").notNull(),
    scheduledDate: timestamp("scheduled_date"),
    actualDate: timestamp("actual_date"),
    slaDeadline: timestamp("sla_deadline"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("shipments_shipmentNumber_idx").on(table.shipmentNumber),
    index("shipments_customerId_idx").on(table.customerId),
    index("shipments_status_idx").on(table.status),
    index("shipments_scheduledDate_idx").on(table.scheduledDate),
  ],
);

// 12. Shipment Items
export const shipmentItems = pgTable(
  "shipment_items",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    goodsId: text("goods_id")
      .notNull()
      .references(() => goods.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    volume: decimal("volume", { precision: 10, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("shipmentItems_shipmentId_idx").on(table.shipmentId),
    index("shipmentItems_goodsId_idx").on(table.goodsId),
  ],
);

// 13. Shipment Legs (Multi-leg journey)
export const shipmentLegs = pgTable(
  "shipment_legs",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    legNumber: integer("leg_number").notNull(),
    originId: text("origin_id").notNull(),
    originType: siteTypeEnum("origin_type").notNull(),
    destinationId: text("destination_id").notNull(),
    destinationType: siteTypeEnum("destination_type").notNull(),
    vehicleId: text("vehicle_id").references(() => vehicles.id, {
      onDelete: "set null",
    }),
    driverId: text("driver_id").references(() => drivers.id, {
      onDelete: "set null",
    }),
    status: legStatusEnum("status").default("pending").notNull(),
    plannedDeparture: timestamp("planned_departure"),
    actualDeparture: timestamp("actual_departure"),
    plannedArrival: timestamp("planned_arrival"),
    actualArrival: timestamp("actual_arrival"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("shipmentLegs_shipmentId_idx").on(table.shipmentId),
    index("shipmentLegs_vehicleId_idx").on(table.vehicleId),
    index("shipmentLegs_driverId_idx").on(table.driverId),
    index("shipmentLegs_status_idx").on(table.status),
  ],
);

// 12. Shipment Status History
export const shipmentStatusHistory = pgTable(
  "shipment_status_history",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    legId: text("leg_id").references(() => shipmentLegs.id, {
      onDelete: "cascade",
    }),
    status: text("status").notNull(),
    notes: text("notes"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("shipmentStatusHistory_shipmentId_idx").on(table.shipmentId),
    index("shipmentStatusHistory_legId_idx").on(table.legId),
    index("shipmentStatusHistory_createdAt_idx").on(table.createdAt),
  ],
);

// 13. Delivery Proofs
export const deliveryProofs = pgTable(
  "delivery_proofs",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    legId: text("leg_id").references(() => shipmentLegs.id, {
      onDelete: "cascade",
    }),
    type: proofTypeEnum("type").notNull(),
    fileUrl: text("file_url").notNull(),
    notes: text("notes"),
    takenAt: timestamp("taken_at"),
    takenBy: text("taken_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("deliveryProofs_shipmentId_idx").on(table.shipmentId),
    index("deliveryProofs_legId_idx").on(table.legId),
    index("deliveryProofs_type_idx").on(table.type),
  ],
);

// 14. Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    type: notificationTypeEnum("type").notNull(),
    recipient: text("recipient").notNull(),
    template: text("template").notNull(),
    data: json("data"),
    status: notificationStatusEnum("status").default("pending").notNull(),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_type_idx").on(table.type),
    index("notifications_status_idx").on(table.status),
    index("notifications_createdAt_idx").on(table.createdAt),
  ],
);

// ==================== RELATIONS ====================

export const customersRelations = relations(customers, ({ many }) => ({
  shipments: many(shipments),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const warehousesRelations = relations(warehouses, () => ({
  // Relations will be handled polymorphically via originId/destinationId
}));

export const hubsRelations = relations(hubs, () => ({
  // Relations will be handled polymorphically via originId/destinationId
}));

export const portsRelations = relations(ports, () => ({
  // Relations will be handled polymorphically via originId/destinationId
}));

export const schoolsRelations = relations(schools, () => ({
  // Relations will be handled polymorphically via originId/destinationId
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [vehicles.vendorId],
    references: [vendors.id],
  }),
  legs: many(shipmentLegs),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  legs: many(shipmentLegs),
}));

export const goodsRelations = relations(goods, ({ many }) => ({
  shipmentItems: many(shipmentItems),
}));

export const shippingRatesRelations = relations(shippingRates, () => ({
  // Polymorphic relations not easily represented in Drizzle relations API
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [shipments.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [shipments.createdBy],
    references: [users.id],
  }),
  items: many(shipmentItems),
  legs: many(shipmentLegs),
  statusHistory: many(shipmentStatusHistory),
  proofs: many(deliveryProofs),
}));

export const shipmentItemsRelations = relations(shipmentItems, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentItems.shipmentId],
    references: [shipments.id],
  }),
  goods: one(goods, {
    fields: [shipmentItems.goodsId],
    references: [goods.id],
  }),
}));

export const shipmentLegsRelations = relations(
  shipmentLegs,
  ({ one, many }) => ({
    shipment: one(shipments, {
      fields: [shipmentLegs.shipmentId],
      references: [shipments.id],
    }),
    vehicle: one(vehicles, {
      fields: [shipmentLegs.vehicleId],
      references: [vehicles.id],
    }),
    driver: one(drivers, {
      fields: [shipmentLegs.driverId],
      references: [drivers.id],
    }),
    statusHistory: many(shipmentStatusHistory),
    proofs: many(deliveryProofs),
  }),
);

export const shipmentStatusHistoryRelations = relations(
  shipmentStatusHistory,
  ({ one }) => ({
    shipment: one(shipments, {
      fields: [shipmentStatusHistory.shipmentId],
      references: [shipments.id],
    }),
    leg: one(shipmentLegs, {
      fields: [shipmentStatusHistory.legId],
      references: [shipmentLegs.id],
    }),
    updater: one(users, {
      fields: [shipmentStatusHistory.updatedBy],
      references: [users.id],
    }),
  }),
);

export const deliveryProofsRelations = relations(deliveryProofs, ({ one }) => ({
  shipment: one(shipments, {
    fields: [deliveryProofs.shipmentId],
    references: [shipments.id],
  }),
  leg: one(shipmentLegs, {
    fields: [deliveryProofs.legId],
    references: [shipmentLegs.id],
  }),
  taker: one(users, {
    fields: [deliveryProofs.takenBy],
    references: [users.id],
  }),
}));
