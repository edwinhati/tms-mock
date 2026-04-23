"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  useCreateShippingRate,
  useDeleteShippingRate,
  useShippingRates,
  useUpdateShippingRate,
} from "@/hooks/use-shipping-rates";
import { type SiteType, useSites } from "@/hooks/use-sites";
import { type ShippingRateFormValues, shippingRateSchema } from "@/lib/schemas";
import type {
  CreateShippingRateInput,
  ShippingRateWithRelations,
  VehicleType,
} from "@/types/tms";

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "truck", label: "Truck" },
  { value: "wing_box", label: "Wing Box" },
  { value: "ship", label: "Ship" },
  { value: "container", label: "Container" },
];

const siteTypes: { value: SiteType; label: string }[] = [
  { value: "warehouse", label: "Warehouse" },
  { value: "hub", label: "Hub" },
  { value: "port", label: "Port" },
  { value: "school", label: "School" },
  { value: "vendor", label: "Vendor" },
  { value: "customer", label: "Customer" },
];

export default function ShippingRatesPage() {
  const { data: shippingRates, isLoading } = useShippingRates();
  const deleteShippingRate = useDeleteShippingRate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<ShippingRateWithRelations | null>(
    null,
  );

  const columns: ColumnDef<ShippingRateWithRelations>[] = [
    {
      accessorKey: "originLocationName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Origin" />
      ),
      cell: ({ row }) => {
        const origin = row.original.originLocationName;
        const originType = row.original.originType;
        return (
          <div className="font-medium">
            {origin || "-"}{" "}
            <span className="text-xs text-muted-foreground ml-1">
              ({originType})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "destinationLocationName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Destination" />
      ),
      cell: ({ row }) => {
        const dest = row.original.destinationLocationName;
        const destType = row.original.destinationType;
        return (
          <div className="text-muted-foreground">
            {dest || "-"}{" "}
            <span className="text-xs text-muted-foreground ml-1">
              ({destType})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "vehicleType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vehicle Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.vehicleType;
        const label = vehicleTypes.find((t) => t.value === type)?.label || type;
        return <div className="text-muted-foreground">{label}</div>;
      },
    },
    {
      accessorKey: "ratePerKg",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rate/kg" />
      ),
      cell: ({ row }) => {
        const rate = row.original.ratePerKg;
        return (
          <div className="text-muted-foreground">
            {rate ? `Rp ${Number(rate).toLocaleString()}` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "ratePerVolume",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rate/volume" />
      ),
      cell: ({ row }) => {
        const rate = row.original.ratePerVolume;
        return (
          <div className="text-muted-foreground">
            {rate ? `Rp ${Number(rate).toLocaleString()}` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "ratePerTrip",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rate/trip" />
      ),
      cell: ({ row }) => {
        const rate = row.original.ratePerTrip;
        return (
          <div className="text-muted-foreground">
            {rate ? `Rp ${Number(rate).toLocaleString()}` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "effectiveDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Effective Date" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {format(new Date(row.original.effectiveDate), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rate = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  setEditRate(rate);
                  setIsEditDialogOpen(true);
                }}
              >
                <IconEdit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(rate.id)}
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
      deleteShippingRate.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Shipping rate deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete shipping rate");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipping Rates</h1>
          <p className="text-sm text-muted-foreground">
            Manage shipping rates and pricing for different routes.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Shipping Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Shipping Rate</DialogTitle>
              <DialogDescription>
                Create a new shipping rate. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <ShippingRateForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={shippingRates || []}
        searchKey="vehicleType"
        searchPlaceholder="Search shipping rates..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipping Rate</DialogTitle>
            <DialogDescription>
              Update the shipping rate details below.
            </DialogDescription>
          </DialogHeader>
          {editRate && (
            <ShippingRateForm
              shippingRate={editRate}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditRate(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shipping rate.
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

interface ShippingRateFormProps {
  shippingRate?: ShippingRateWithRelations;
  onSuccess: () => void;
}

function ShippingRateForm({ shippingRate, onSuccess }: ShippingRateFormProps) {
  const createShippingRate = useCreateShippingRate();
  const updateShippingRate = useUpdateShippingRate();
  const isEditing = !!shippingRate;

  const vehicleTypeOptions = vehicleTypes.map((type) => ({
    value: type.value,
    label: type.label,
  }));

  const form = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      originType: (shippingRate?.originType as SiteType) || "warehouse",
      originId: shippingRate?.originId || "",
      destinationType:
        (shippingRate?.destinationType as SiteType) || "warehouse",
      destinationId: shippingRate?.destinationId || "",
      vehicleType: shippingRate?.vehicleType || "truck",
      rate:
        shippingRate?.ratePerTrip?.toString() ||
        shippingRate?.ratePerKg?.toString() ||
        "",
      effectiveDate: shippingRate?.effectiveDate
        ? format(new Date(shippingRate.effectiveDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    },
  });

  const originType = useWatch({
    control: form.control,
    name: "originType",
  });

  const destinationType = useWatch({
    control: form.control,
    name: "destinationType",
  });

  const { data: originSites, isLoading: originLoading } = useSites(
    originType as SiteType,
  );
  const { data: destinationSites, isLoading: destinationLoading } = useSites(
    destinationType as SiteType,
  );

  const originOptions = originSites.map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const destinationOptions = destinationSites.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const onSubmit = (values: ShippingRateFormValues) => {
    const data: CreateShippingRateInput = {
      originType: values.originType as SiteType,
      originId: values.originId,
      destinationType: values.destinationType as SiteType,
      destinationId: values.destinationId,
      vehicleType: values.vehicleType as VehicleType,
      ratePerTrip: parseFloat(values.rate),
      effectiveDate: new Date(values.effectiveDate).toISOString(),
    };

    if (isEditing && shippingRate) {
      updateShippingRate.mutate(
        { id: shippingRate.id, data },
        {
          onSuccess: () => {
            toast.success("Shipping rate updated successfully");
            onSuccess();
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update shipping rate");
          },
        },
      );
    } else {
      createShippingRate.mutate(data, {
        onSuccess: () => {
          toast.success("Shipping rate created successfully");
          onSuccess();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create shipping rate");
        },
      });
    }
  };

  const isPending =
    createShippingRate.isPending || updateShippingRate.isPending;

  return (
    <Form form={form} onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex gap-2">
          <div className="w-1/3">
            <FormSelect
              name="originType"
              label="Origin Type"
              options={siteTypes}
              required
            />
          </div>
          <div className="flex-1">
            <FormSelect
              name="originId"
              label="Origin Location"
              placeholder="Select origin"
              options={originOptions}
              disabled={originLoading || originOptions.length === 0}
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-1/3">
            <FormSelect
              name="destinationType"
              label="Dest. Type"
              options={siteTypes}
              required
            />
          </div>
          <div className="flex-1">
            <FormSelect
              name="destinationId"
              label="Dest. Location"
              placeholder="Select destination"
              options={destinationOptions}
              disabled={destinationLoading || destinationOptions.length === 0}
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormSelect
          name="vehicleType"
          label="Vehicle Type"
          placeholder="Select vehicle type"
          options={vehicleTypeOptions}
          required
        />
        <FormInput
          name="rate"
          label="Rate (Rp)"
          placeholder="Enter rate"
          required
        />
        <FormInput
          name="effectiveDate"
          label="Effective Date"
          type="date"
          required
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0 mt-4">
        <Button
          type="submit"
          disabled={isPending || originLoading || destinationLoading}
        >
          {isPending
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Shipping Rate"
              : "Create Shipping Rate"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
