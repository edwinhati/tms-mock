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
  useCreatePort,
  useDeletePort,
  usePorts,
  useUpdatePort,
} from "@/hooks/use-ports";
import { type PortFormValues, portSchema } from "@/lib/schemas";
import type { Port } from "@/types/tms";

export default function PortsPage() {
  const { data: ports, isLoading } = usePorts();
  const deletePort = useDeletePort();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPort, setEditingPort] = useState<Port | null>(null);

  const columns: ColumnDef<Port>[] = [
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
        const port = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  setEditingPort(port);
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
                onClick={() => setDeleteId(port.id)}
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
      deletePort.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Port deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete port");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ports</h1>
          <p className="text-sm text-muted-foreground">
            Manage your port locations and details.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Port
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Port</DialogTitle>
              <DialogDescription>
                Create a new port record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <PortForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={ports || []}
        searchKey="name"
        searchPlaceholder="Search ports..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Port</DialogTitle>
            <DialogDescription>
              Update the port details below.
            </DialogDescription>
          </DialogHeader>
          {editingPort && (
            <PortForm
              port={editingPort}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingPort(null);
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
              port and remove its data from our servers.
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

interface PortFormProps {
  port?: Port;
  onSuccess: () => void;
}

function PortForm({ port, onSuccess }: PortFormProps) {
  const createPort = useCreatePort();
  const updatePort = useUpdatePort();
  const isEditing = !!port;

  const form = useForm<PortFormValues>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      name: port?.name || "",
      type: "port",
      phone: port?.phone || "",
      provinceCode: port?.provinceCode || "",
      provinceName: port?.provinceName || "",
      cityCode: port?.cityCode || "",
      cityName: port?.cityName || "",
      districtCode: port?.districtCode || "",
      districtName: port?.districtName || "",
      villageCode: port?.villageCode || "",
      villageName: port?.villageName || "",
      address: port?.address || "",
      latitude: port?.latitude || "",
      longitude: port?.longitude || "",
    },
  });

  const onSubmit = (data: PortFormValues) => {
    if (isEditing && port) {
      updatePort.mutate(
        { id: port.id, data },
        {
          onSuccess: () => {
            toast.success("Port updated successfully");
            onSuccess();
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update port");
          },
        },
      );
    } else {
      createPort.mutate(data, {
        onSuccess: () => {
          toast.success("Port created successfully");
          onSuccess();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create port");
        },
      });
    }
  };

  const isPending = createPort.isPending || updatePort.isPending;

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FormInput
        name="name"
        label="Port Name"
        placeholder="Port name"
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
              ? "Update Port"
              : "Create Port"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
