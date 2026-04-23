import type { InferSelectModel } from "drizzle-orm";
import type {
  customers,
  deliveryProofs,
  drivers,
  goods,
  hubs,
  notifications,
  ports,
  schools,
  shipmentItems,
  shipmentLegs,
  shipmentStatusHistory,
  shipments,
  shippingRates,
  vehicles,
  vendors,
  warehouses,
} from "@/lib/db/schema";

// Core Entity Types
export type Customer = InferSelectModel<typeof customers>;
export type Vendor = InferSelectModel<typeof vendors>;
export type Warehouse = InferSelectModel<typeof warehouses>;
export type Hub = InferSelectModel<typeof hubs>;
export type Port = InferSelectModel<typeof ports>;
export type School = InferSelectModel<typeof schools>;
export type Vehicle = InferSelectModel<typeof vehicles>;
export type Driver = InferSelectModel<typeof drivers>;
export type Good = InferSelectModel<typeof goods>;
export type ShippingRate = InferSelectModel<typeof shippingRates>;

export type SiteType =
  | "warehouse"
  | "hub"
  | "port"
  | "school"
  | "vendor"
  | "customer";

// Transaction Types
export interface Shipment extends InferSelectModel<typeof shipments> {
  originName?: string;
  destinationName?: string;
}
export type ShipmentItem = InferSelectModel<typeof shipmentItems>;
export interface ShipmentLeg extends InferSelectModel<typeof shipmentLegs> {
  originName?: string;
  destinationName?: string;
}
export type ShipmentStatusHistory = InferSelectModel<
  typeof shipmentStatusHistory
>;
export type DeliveryProof = InferSelectModel<typeof deliveryProofs>;
export type Notification = InferSelectModel<typeof notifications>;

// Enums
export type LocationType = "warehouse" | "hub" | "port" | "school" | "office";
export type VehicleType = "truck" | "wing_box" | "ship" | "container";
export type VehicleStatus = "active" | "inactive" | "maintenance";
export type DriverStatus = "active" | "inactive";
export type EducationLevel = "SD" | "SMP" | "SMA" | "SMK";
export type ShipmentStatus =
  | "planned"
  | "in_transit"
  | "delivered"
  | "cancelled";
export type LegStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type ProofType = "photo" | "bast" | "signature";
export type NotificationType = "whatsapp" | "email";
export type NotificationStatus = "pending" | "sent" | "failed";
export type GoodsUnit = "set" | "unit" | "pcs";

// Extended Types dengan Relations
export interface ShipmentWithRelations extends Shipment {
  customer?: Customer;
  items?: ShipmentItemWithRelations[];
  legs?: ShipmentLegWithRelations[];
  statusHistory?: ShipmentStatusHistory[];
  proofs?: DeliveryProof[];
  calculatedProgress?: number;
}

export interface ShipmentItemWithRelations extends ShipmentItem {
  goods?: Good;
}

export interface ShipmentLegWithRelations extends ShipmentLeg {
  vehicle?: Vehicle;
  driver?: Driver;
  statusHistory?: ShipmentStatusHistory[];
  proofs?: DeliveryProof[];
}

export interface VehicleWithRelations extends Vehicle {
  vendor?: Vendor;
}

export interface DriverWithRelations extends Driver {
  legs?: ShipmentLeg[];
}

export interface SchoolWithRelations extends School {
  // Relation to location is now removed as it's polymorphic
}

export interface ShippingRateWithRelations extends ShippingRate {
  originLocationName?: string;
  destinationLocationName?: string;
}

// API Request/Response Types
export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CreateVehicleInput {
  type: VehicleType;
  licensePlate: string;
  capacity?: string;
  vendorId: string;
}

export interface CreateVendorInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  districtCode: string;
  districtName: string;
  villageCode: string;
  villageName: string;
  address: string;
  latitude?: string;
  longitude?: string;
}

export interface CreateDriverInput {
  name: string;
  email: string;
  password?: string;
  phone: string;
  licenseNumber?: string;
}

export interface CreateSchoolInput {
  name: string;
  educationLevel: EducationLevel;
  contactPerson?: string;
  phone?: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  districtCode: string;
  districtName: string;
  villageCode: string;
  villageName: string;
  address: string;
  latitude?: string;
  longitude?: string;
}

export interface CreateGoodsInput {
  materialCode: string;
  description: string;
  unit: GoodsUnit;
  weight?: number;
  volume?: number;
  specialHandling?: string;
}

export interface CreateShippingRateInput {
  originId: string;
  originType: SiteType;
  destinationId: string;
  destinationType: SiteType;
  vehicleType: VehicleType;
  ratePerKg?: number;
  ratePerVolume?: number;
  ratePerTrip?: number;
  effectiveDate: string;
}

export interface CreateShipmentRequest {
  customerId: string;
  originId: string;
  originType: SiteType;
  destinationId: string;
  destinationType: SiteType;
  scheduledDate?: string;
  slaDeadline?: string;
  notes?: string;
  items: {
    goodsId: string;
    quantity: number;
    weight?: number;
    volume?: number;
    notes?: string;
  }[];
  legs: {
    legNumber: number;
    originId: string;
    originType: SiteType;
    destinationId: string;
    destinationType: SiteType;
    vehicleId?: string;
    driverId?: string;
    plannedDeparture?: string;
    plannedArrival?: string;
    notes?: string;
  }[];
}

export interface UpdateStatusRequest {
  status: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface AssignShipmentRequest {
  legId: string;
  vehicleId: string;
  driverId: string;
}

// Dashboard Types
export interface DashboardStats {
  totalShipments: number;
  plannedShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  cancelledShipments: number;
}

export interface ShipmentReport {
  id: string;
  shipmentNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  scheduledDate: Date | null;
  actualDate: Date | null;
  driverName: string | null;
  vehiclePlate: string | null;
}

export interface DriverPerformance {
  driverId: string;
  driverName: string;
  totalShipments: number;
  completedShipments: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  averageDeliveryTime: number; // in hours
}

export interface VehicleUtilization {
  vehicleId: string;
  vehiclePlate: string | null;
  vehicleType: VehicleType;
  totalTrips: number;
  totalDistance: number;
  utilizationRate: number; // percentage
}
