"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { AddressSelector } from "@/components/ui/address-selector";
import {
  useHubs,
  useCreateHub,
  useUpdateHub,
  useDeleteHub,
} from "@/hooks/use-hubs";
import { hubSchema, type HubFormValues } from "@/lib/schemas";
import type { Hub } from "@/types/tms";

export default function HubsPage() {
  const { data: hubs, isLoading } = useHubs();
  const deleteHub = useDeleteHub();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);

  const columns: ColumnDef<Hub>[] = [
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
        const hub = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  setEditingHub(hub);
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
                onClick={() => setDeleteId(hub.id)}
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
      deleteHub.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Hub deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete hub");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hubs</h1>
          <p className="text-sm text-muted-foreground">
            Manage your transit hubs and details.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Hub
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Hub</DialogTitle>
              <DialogDescription>
                Create a new hub record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <HubForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={hubs || []}
        searchKey="name"
        searchPlaceholder="Search hubs..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hub</DialogTitle>
            <DialogDescription>Update the hub details below.</DialogDescription>
          </DialogHeader>
          {editingHub && (
            <HubForm
              hub={editingHub}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingHub(null);
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
              This action cannot be undone. This will permanently delete the hub
              and remove its data from our servers.
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

interface HubFormProps {
  hub?: Hub;
  onSuccess: () => void;
}

function HubForm({ hub, onSuccess }: HubFormProps) {
  const createHub = useCreateHub();
  const updateHub = useUpdateHub();
  const isEditing = !!hub;

  const form = useForm<HubFormValues>({
    resolver: zodResolver(hubSchema),
    defaultValues: {
      name: hub?.name || "",
      type: "hub",
      phone: hub?.phone || "",
      provinceCode: hub?.provinceCode || "",
      provinceName: hub?.provinceName || "",
      cityCode: hub?.cityCode || "",
      cityName: hub?.cityName || "",
      districtCode: hub?.districtCode || "",
      districtName: hub?.districtName || "",
      villageCode: hub?.villageCode || "",
      villageName: hub?.villageName || "",
      address: hub?.address || "",
      latitude: hub?.latitude || "",
      longitude: hub?.longitude || "",
    },
  });

  const onSubmit = (data: HubFormValues) => {
    if (isEditing && hub) {
      updateHub.mutate(
        { id: hub.id, data },
        {
          onSuccess: () => {
            toast.success("Hub updated successfully");
            onSuccess();
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update hub");
          },
        },
      );
    } else {
      createHub.mutate(data, {
        onSuccess: () => {
          toast.success("Hub created successfully");
          onSuccess();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create hub");
        },
      });
    }
  };

  const isPending = createHub.isPending || updateHub.isPending;

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FormInput name="name" label="Hub Name" placeholder="Hub name" required />
      <FormInput name="phone" label="Phone" placeholder="+62 xxx xxxx xxxx" />
      <AddressSelector form={form} />

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Hub"
              : "Create Hub"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
