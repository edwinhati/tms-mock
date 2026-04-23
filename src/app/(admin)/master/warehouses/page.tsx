"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AddressSelector } from "@/components/ui/address-selector";
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
import { Form, FormInput } from "@/components/ui/form-wrapper";
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouses,
} from "@/hooks/use-warehouses";
import { type WarehouseFormValues, warehouseSchema } from "@/lib/schemas";
import type { Warehouse } from "@/types/tms";

export default function WarehousesPage() {
  const { data: warehouses, isLoading } = useWarehouses();
  const deleteWarehouse = useDeleteWarehouse();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("phone") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "cityName",
      header: "City",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("cityName") || "-"}
        </div>
      ),
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
        const warehouse = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  setEditingWarehouse(warehouse);
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
                onClick={() => setDeleteId(warehouse.id)}
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
      deleteWarehouse.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Warehouse deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete warehouse");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your warehouse locations and details.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Create a new warehouse record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <WarehouseForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={warehouses || []}
        searchKey="name"
        searchPlaceholder="Search warehouses..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
            <DialogDescription>
              Update the warehouse details below.
            </DialogDescription>
          </DialogHeader>
          {editingWarehouse && (
            <WarehouseForm
              warehouse={editingWarehouse}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingWarehouse(null);
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
              warehouse and remove its data from our servers.
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

interface WarehouseFormProps {
  warehouse?: Warehouse;
  onSuccess: () => void;
}

function WarehouseForm({ warehouse, onSuccess }: WarehouseFormProps) {
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const isEditing = !!warehouse;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name || "",
      type: "warehouse",
      phone: warehouse?.phone || "",
      provinceCode: warehouse?.provinceCode || "",
      provinceName: warehouse?.provinceName || "",
      cityCode: warehouse?.cityCode || "",
      cityName: warehouse?.cityName || "",
      districtCode: warehouse?.districtCode || "",
      districtName: warehouse?.districtName || "",
      villageCode: warehouse?.villageCode || "",
      villageName: warehouse?.villageName || "",
      address: warehouse?.address || "",
      latitude: warehouse?.latitude || "",
      longitude: warehouse?.longitude || "",
    },
  });

  const onSubmit = (data: WarehouseFormValues) => {
    if (isEditing && warehouse) {
      updateWarehouse.mutate(
        { id: warehouse.id, data },
        {
          onSuccess: () => {
            toast.success("Warehouse updated successfully");
            onSuccess();
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update warehouse");
          },
        },
      );
    } else {
      createWarehouse.mutate(data, {
        onSuccess: () => {
          toast.success("Warehouse created successfully");
          onSuccess();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create warehouse");
        },
      });
    }
  };

  const isPending = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FormInput
        name="name"
        label="Warehouse Name"
        placeholder="Warehouse name"
        required
      />
      <FormInput name="phone" label="Phone" placeholder="+62 xxx xxxx xxxx" />
      <AddressSelector form={form} />

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Warehouse"
              : "Create Warehouse"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
