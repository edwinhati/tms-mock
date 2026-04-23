"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useShipments } from "@/hooks/use-shipments";
import type { ShipmentWithRelations } from "@/types/tms";

const columns: ColumnDef<ShipmentWithRelations>[] = [
  {
    accessorKey: "shipmentNumber",
    header: "Shipment #",
    cell: ({ row }) => (
      <Link
        href={`/shipments/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.shipmentNumber}
      </Link>
    ),
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
      return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
    },
  },
  {
    accessorKey: "calculatedProgress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.original.calculatedProgress || 0;
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground w-8">{progress}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "scheduledDate",
    header: "Scheduled",
    cell: ({ row }) =>
      row.original.scheduledDate
        ? format(new Date(row.original.scheduledDate), "MMM dd")
        : "-",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => format(new Date(row.original.createdAt), "MMM dd, yyyy"),
  },
];

export default function ShipmentsPage() {
  const router = useRouter();
  const { data: shipmentsData, isLoading, isError, refetch } = useShipments();
  const shipments = shipmentsData?.data;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Shipments</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Shipment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rowCount={5} columnCount={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Shipments</h1>
          <Button asChild>
            <Link href="/shipments/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Shipment
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent>
            <ErrorState
              title="Failed to load shipments"
              message="Unable to load shipments. Please check your connection and try again."
              onRetry={refetch}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Shipments</h1>
        <Button asChild>
          <Link href="/shipments/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Shipment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {shipments && shipments.length > 0 ? (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={shipments}
                searchKey="shipmentNumber"
                searchPlaceholder="Search shipments..."
              />
            </div>
          ) : (
            <EmptyState
              icon="truck"
              title="No shipments yet"
              description="Create your first shipment to start tracking deliveries."
              actionLabel="Create Shipment"
              onAction={() => router.push("/shipments/new")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
