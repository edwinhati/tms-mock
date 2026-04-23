import { z } from "zod";

// ============================================================================
// Address Schema
// ============================================================================

export const addressSchema = z.object({
  provinceCode: z.string().min(1, "Province is required"),
  provinceName: z.string().min(1, "Province name is required"),
  cityCode: z.string().min(1, "City is required"),
  cityName: z.string().min(1, "City name is required"),
  districtCode: z.string().min(1, "District is required"),
  districtName: z.string().min(1, "District name is required"),
  villageCode: z.string().min(1, "Village is required"),
  villageName: z.string().min(1, "Village name is required"),
  address: z.string().min(1, "Detailed address is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type AddressValues = z.infer<typeof addressSchema>;

// ============================================================================
// Customer Schema
// ============================================================================

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  ...addressSchema.shape,
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

// ============================================================================
// Vendor Schema
// ============================================================================

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  ...addressSchema.shape,
});

export type VendorFormValues = z.infer<typeof vendorSchema>;

// ============================================================================
// Driver Schema
// ============================================================================

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

// ============================================================================
// Vehicle Schema
// ============================================================================

export const vehicleSchema = z.object({
  licensePlate: z.string().min(1, "License plate is required"),
  type: z.enum(["truck", "wing_box", "ship", "container"]),
  capacity: z.string().optional(),
  vendorId: z.string().min(1, "Vendor is required"),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ============================================================================
// School Schema
// ============================================================================

export const schoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  educationLevel: z.enum(["SD", "SMP", "SMA", "SMK"]),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  ...addressSchema.shape,
});

export type SchoolFormValues = z.infer<typeof schoolSchema>;

// ============================================================================
// Location Schema
// ============================================================================

export const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["warehouse", "hub", "port", "school", "office"]),
  phone: z.string().optional(),
  ...addressSchema.shape,
});

export type LocationFormValues = z.infer<typeof locationSchema>;

export const warehouseSchema = locationSchema.extend({
  type: z.literal("warehouse"),
});
export type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export const hubSchema = locationSchema.extend({
  type: z.literal("hub"),
});
export type HubFormValues = z.infer<typeof hubSchema>;

export const portSchema = locationSchema.extend({
  type: z.literal("port"),
});
export type PortFormValues = z.infer<typeof portSchema>;

// ============================================================================
// Goods Schema
// ============================================================================

export const goodsSchema = z.object({
  materialCode: z.string().min(1, "Material code is required"),
  description: z.string().min(1, "Description is required"),
  unit: z.enum(["set", "unit", "pcs"]),
});

export type GoodsFormValues = z.infer<typeof goodsSchema>;

// ============================================================================
// Shipping Rate Schema
// ============================================================================

export const shippingRateSchema = z.object({
  originId: z.string().min(1, "Origin location is required"),
  originType: z.enum([
    "warehouse",
    "hub",
    "port",
    "school",
    "vendor",
    "customer",
  ]),
  destinationId: z.string().min(1, "Destination location is required"),
  destinationType: z.enum([
    "warehouse",
    "hub",
    "port",
    "school",
    "vendor",
    "customer",
  ]),
  vehicleType: z.enum(["truck", "wing_box", "ship", "container"]),
  rate: z.string().min(1, "Rate is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
});

export type ShippingRateFormValues = z.infer<typeof shippingRateSchema>;
