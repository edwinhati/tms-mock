"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Calendar,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Package,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DatePickerInput } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomers } from "@/hooks/use-customers";
import { useDrivers } from "@/hooks/use-drivers";
import type { ReportFilters, ShipmentReportData } from "@/hooks/use-reports";
import {
  useDriverPerformance,
  useReportStats,
  useShipmentReports,
} from "@/hooks/use-reports";
import { useVehicles } from "@/hooks/use-vehicles";
import type { ShipmentStatus } from "@/types/tms";

const statusOptions: { value: ShipmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "planned", label: "Planned" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// CSV Export Function
function exportToCSV(data: ShipmentReportData[], filename: string) {
  const headers = [
    "Shipment Number",
    "Date",
    "Customer",
    "Origin",
    "Destination",
    "Status",
    "Driver",
    "Weight (kg)",
    "Revenue",
  ];

  const rows = data.map((shipment) => [
    shipment.shipmentNumber,
    shipment.createdAt
      ? format(new Date(shipment.createdAt), "yyyy-MM-dd")
      : "",
    shipment.customerName || "-",
    shipment.originName || "-",
    shipment.destinationName || "-",
    shipment.status,
    shipment.driverName || "-",
    shipment.totalWeight?.toString() || "0",
    shipment.totalRevenue?.toString() || "0",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Excel Export Function (CSV with Excel MIME type)
function exportToExcel(data: ShipmentReportData[], filename: string) {
  const headers = [
    "Shipment Number",
    "Date",
    "Customer",
    "Origin",
    "Destination",
    "Status",
    "Driver",
    "Weight (kg)",
    "Revenue",
  ];

  const rows = data.map((shipment) => [
    shipment.shipmentNumber,
    shipment.createdAt
      ? format(new Date(shipment.createdAt), "yyyy-MM-dd")
      : "",
    shipment.customerName || "-",
    shipment.originName || "-",
    shipment.destinationName || "-",
    shipment.status,
    shipment.driverName || "-",
    shipment.totalWeight?.toString() || "0",
    shipment.totalRevenue?.toString() || "0",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Table Columns
const columns: ColumnDef<ShipmentReportData>[] = [
  {
    accessorKey: "shipmentNumber",
    header: "Shipment #",
    cell: ({ row }) => (
      <Link
        href={`/shipments/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.shipmentNumber}
      </Link>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) =>
      row.original.createdAt
        ? format(new Date(row.original.createdAt), "MMM dd, yyyy")
        : "-",
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => row.original.customerName || "-",
  },
  {
    accessorKey: "originName",
    header: "Origin",
    cell: ({ row }) => row.original.originName || "-",
  },
  {
    accessorKey: "destinationName",
    header: "Destination",
    cell: ({ row }) => row.original.destinationName || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === "delivered"
          ? "default"
          : status === "in_transit"
            ? "secondary"
            : status === "planned"
              ? "outline"
              : "destructive";
      return (
        <Badge variant={variant}>
          {status.replace("_", " ").toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "driverName",
    header: "Driver",
    cell: ({ row }) => row.original.driverName || "-",
  },
  {
    accessorKey: "totalWeight",
    header: "Weight (kg)",
    cell: ({ row }) =>
      row.original.totalWeight
        ? row.original.totalWeight.toLocaleString()
        : "-",
  },
  {
    accessorKey: "totalRevenue",
    header: "Revenue",
    cell: ({ row }) =>
      row.original.totalRevenue
        ? `Rp ${row.original.totalRevenue.toLocaleString()}`
        : "-",
  },
];

// Simple CSS-based Bar Chart Component
function SimpleBarChart({
  data,
  maxValue,
  color = "bg-primary",
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[70%]">
                {item.label}
              </span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-500 rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple Pie/Donut Chart Component using CSS conic-gradient
function SimplePieChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No data available
      </div>
    );
  }

  let currentAngle = 0;
  const gradientParts = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const startAngle = currentAngle;
    currentAngle += (percentage / 100) * 360;
    return `${item.color} ${startAngle}deg ${currentAngle}deg`;
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-32 h-32 rounded-full"
        style={{
          background: `conic-gradient(${gradientParts.join(", ")})`,
        }}
      >
        <div className="w-full h-full rounded-full bg-card border-4 border-card flex items-center justify-center">
          <span className="text-lg font-bold">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {item.label} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  isLoading,
  suffix = "",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading: boolean;
  suffix?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">
            {value}
            {suffix}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  // Initialize date range to current month
  const today = new Date();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(today), "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
    status: "all",
  });

  const { data: shipments, isLoading: shipmentsLoading } =
    useShipmentReports(filters);
  const { data: drivers, isLoading: driversLoading } = useDriverPerformance({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const { data: stats, isLoading: statsLoading } = useReportStats(filters);
  const { data: customers } = useCustomers();
  const { data: allDrivers } = useDrivers();
  const { data: vehicles } = useVehicles();

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof ReportFilters, value: string | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Export handlers
  const handleExportCSV = useCallback(() => {
    if (shipments) {
      exportToCSV(
        shipments,
        `shipments-report-${format(new Date(), "yyyy-MM-dd")}`,
      );
    }
  }, [shipments]);

  const handleExportExcel = useCallback(() => {
    if (shipments) {
      exportToExcel(
        shipments,
        `shipments-report-${format(new Date(), "yyyy-MM-dd")}`,
      );
    }
  }, [shipments]);

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!stats) return [];
    const colors = {
      planned: "#60a5fa",
      in_transit: "#3b82f6",
      delivered: "#22c55e",
      cancelled: "#ef4444",
    };
    return Object.entries(stats.shipmentsByStatus)
      .filter(([, value]) => value > 0)
      .map(([status, value]) => ({
        label: status.replace("_", " ").toUpperCase(),
        value,
        color: colors[status as ShipmentStatus],
      }));
  }, [stats]);

  const topCustomersData = useMemo(() => {
    if (!shipments) return [];
    const customerCounts: Record<string, number> = {};
    for (const shipment of shipments) {
      const name = shipment.customerName || "Unknown";
      customerCounts[name] = (customerCounts[name] || 0) + 1;
    }
    return Object.entries(customerCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [shipments]);

  const driverPerformanceData = useMemo(() => {
    if (!drivers) return [];
    return drivers
      .map((driver) => ({
        label: driver.driverName,
        value: driver.completedShipments,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [drivers]);

  const maxCustomerValue = useMemo(
    () => Math.max(...topCustomersData.map((d) => d.value), 1),
    [topCustomersData],
  );

  const maxDriverValue = useMemo(
    () => Math.max(...driverPerformanceData.map((d) => d.value), 1),
    [driverPerformanceData],
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analyze shipment performance and export data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter reports by date range, status, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePickerInput
                value={filters.startDate || ""}
                onChange={(value) =>
                  handleFilterChange("startDate", value || undefined)
                }
                placeholder="Select start date"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePickerInput
                value={filters.endDate || ""}
                onChange={(value) =>
                  handleFilterChange("endDate", value || undefined)
                }
                placeholder="Select end date"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Combobox
                value={filters.status}
                onValueChange={(value) =>
                  handleFilterChange("status", value as ShipmentStatus)
                }
              >
                <ComboboxInput placeholder="Select status" />
                <ComboboxContent>
                  <ComboboxEmpty>No status found.</ComboboxEmpty>
                  <ComboboxList>
                    {statusOptions.map((option) => (
                      <ComboboxItem key={option.value} value={option.value}>
                        {option.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Combobox
                value={filters.customerId || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "customerId",
                    value === "all" || !value ? undefined : value,
                  )
                }
              >
                <ComboboxInput placeholder="All Customers" />
                <ComboboxContent>
                  <ComboboxEmpty>No customer found.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="all">All Customers</ComboboxItem>
                    {customers?.map((customer) => (
                      <ComboboxItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="space-y-2">
              <Label>Driver</Label>
              <Combobox
                value={filters.driverId || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "driverId",
                    value === "all" || !value ? undefined : value,
                  )
                }
              >
                <ComboboxInput placeholder="All Drivers" />
                <ComboboxContent>
                  <ComboboxEmpty>No driver found.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="all">All Drivers</ComboboxItem>
                    {allDrivers?.map((driver) => (
                      <ComboboxItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Shipments"
          value={stats?.totalShipments.toLocaleString() || 0}
          icon={Package}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Total Weight"
          value={stats?.totalWeight.toLocaleString() || 0}
          icon={Truck}
          isLoading={statsLoading}
          suffix=" kg"
        />
        <StatsCard
          title="Total Revenue"
          value={`Rp ${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={Wallet}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Avg Delivery Time"
          value={stats?.averageDeliveryTime || 0}
          icon={Calendar}
          isLoading={statsLoading}
          suffix=" hrs"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipments by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Shipments by Status</CardTitle>
            <CardDescription>
              Distribution of shipments across different statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
            ) : (
              <SimplePieChart data={statusChartData} />
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Customers
            </CardTitle>
            <CardDescription>
              Customers with most shipments in selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <SimpleBarChart
                data={topCustomersData}
                maxValue={maxCustomerValue}
                color="bg-blue-500"
              />
            )}
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Driver Performance</CardTitle>
            <CardDescription>
              Top performing drivers by completed shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {driversLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : driverPerformanceData.length > 0 ? (
              <SimpleBarChart
                data={driverPerformanceData}
                maxValue={maxDriverValue}
                color="bg-green-500"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No driver performance data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
          <CardDescription>
            {shipments
              ? `${shipments.length} shipments found`
              : "Loading shipments..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={shipments || []}
            searchKey="shipmentNumber"
            searchPlaceholder="Search by shipment number..."
            isLoading={shipmentsLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
