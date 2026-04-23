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
  useCreateVendor,
  useDeleteVendor,
  useVendorsHook,
} from "@/hooks/use-vendors";
import { vendorSchema, type VendorFormValues } from "@/lib/schemas";
import type { Vendor } from "@/types/tms";

export default function VendorsPage() {
  const { data: vendors, isLoading, isError, refetch } = useVendorsHook();
  const deleteVendor = useDeleteVendor();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<Vendor>[] = [
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
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("contactPerson") || "-"}
        </div>
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
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("email") || "-"}
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
        const vendor = row.original;
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
                onClick={() => setDeleteId(vendor.id)}
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
      deleteVendor.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Vendor deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete vendor");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendor records and contacts.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Create a new vendor record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <VendorForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={vendors || []}
        searchKey="name"
        searchPlaceholder="Search vendors..."
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
              vendor and remove their data from our servers.
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

function VendorForm({ onSuccess }: { onSuccess: () => void }) {
  const createVendor = useCreateVendor();
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      provinceCode: "",
      provinceName: "",
      cityCode: "",
      cityName: "",
      districtCode: "",
      districtName: "",
      villageCode: "",
      villageName: "",
      address: "",
    },
  });

  const onSubmit = (data: VendorFormValues) => {
    createVendor.mutate(data, {
      onSuccess: () => {
        toast.success("Vendor created successfully");
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create vendor");
      },
    });
  };

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FormInput name="name" label="Name" placeholder="Vendor name" required />
      <FormInput
        name="contactPerson"
        label="Contact Person"
        placeholder="Contact person name"
      />
      <FormInput name="phone" label="Phone" placeholder="+62 xxx xxxx xxxx" />
      <FormInput
        name="email"
        label="Email"
        type="email"
        placeholder="email@example.com"
      />
      <AddressSelector form={form} />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={createVendor.isPending}>
          {createVendor.isPending ? "Creating..." : "Create Vendor"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
