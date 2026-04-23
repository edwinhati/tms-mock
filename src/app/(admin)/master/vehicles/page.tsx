"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormInput, FormSelect } from "@/components/ui/form-wrapper";
import {
  useCreateVehicle,
  useDeleteVehicle,
  useVehicles,
} from "@/hooks/use-vehicles";
import { useVendorsHook } from "@/hooks/use-vendors";
import { type VehicleFormValues, vehicleSchema } from "@/lib/schemas";
import type { Vehicle } from "@/types/tms";

const vehicleTypes: { value: string; label: string }[] = [
  { value: "truck", label: "Truck" },
  { value: "wing_box", label: "Wing Box" },
  { value: "ship", label: "Ship" },
  { value: "container", label: "Container" },
];

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useVehicles();
  const deleteVehicle = useDeleteVehicle();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "licensePlate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="License Plate" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("licensePlate")}</div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("type")}</div>
      ),
    },
    {
      accessorKey: "capacity",
      header: "Capacity",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.capacity || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : status === "maintenance"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {}}
              >
                <IconEdit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(vehicle.id)}
              >
                <IconTrash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </DataTableRowActions>
        );
      },
    },
  ];

  const handleDelete = () => {
    if (deleteId) {
      deleteVehicle.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Vehicle deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete vehicle");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            Manage your fleet and vehicle records.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Create a new vehicle record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <VehicleForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={vehicles || []}
        searchKey="licensePlate"
        searchPlaceholder="Search vehicles..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              vehicle and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VehicleForm({ onSuccess }: { onSuccess: () => void }) {
  const createVehicle = useCreateVehicle();
  const { data: vendors } = useVendorsHook();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      licensePlate: "",
      type: "truck",
      capacity: "",
      vendorId: "",
    },
  });

  const vendorOptions =
    vendors?.map((v) => ({ value: v.id, label: v.name })) || [];

  const onSubmit = (data: VehicleFormValues) => {
    createVehicle.mutate(data, {
      onSuccess: () => {
        toast.success("Vehicle created successfully");
        onSuccess();
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create vehicle");
      },
    });
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormInput
        name="licensePlate"
        label="License Plate"
        placeholder="B 1234 ABC"
        required
      />
      <FormSelect
        name="type"
        label="Vehicle Type"
        placeholder="Select type"
        options={vehicleTypes}
        required
      />
      <FormInput
        name="capacity"
        label="Capacity"
        placeholder="e.g., 5000 kg or 20 m³"
        description="Optional capacity information"
      />
      <FormSelect
        name="vendorId"
        label="Vendor"
        placeholder="Select vendor"
        options={vendorOptions}
        required
      />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={createVehicle.isPending}>
          {createVehicle.isPending ? "Creating..." : "Create Vehicle"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
