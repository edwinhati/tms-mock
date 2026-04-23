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
import { Form, FormInput } from "@/components/ui/form-wrapper";
import { AddressSelector } from "@/components/ui/address-selector";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/hooks/use-customers";
import { type CustomerFormValues, customerSchema } from "@/lib/schemas";
import type { Customer } from "@/types/tms";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const columns: ColumnDef<Customer>[] = [
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
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("phone") || "-"}
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
        const customer = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  setEditingCustomer(customer);
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
                onClick={() => setDeleteId(customer.id)}
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
      deleteCustomer.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Customer deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete customer");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer records and contacts.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={customers || []}
        searchKey="name"
        searchPlaceholder="Search customers..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer details below.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingCustomer(null);
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
              customer and remove their data from our servers.
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

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEditing = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      provinceCode: customer?.provinceCode || "",
      provinceName: customer?.provinceName || "",
      cityCode: customer?.cityCode || "",
      cityName: customer?.cityName || "",
      districtCode: customer?.districtCode || "",
      districtName: customer?.districtName || "",
      villageCode: customer?.villageCode || "",
      villageName: customer?.villageName || "",
      address: customer?.address || "",
      latitude: customer?.latitude || "",
      longitude: customer?.longitude || "",
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    if (isEditing && customer) {
      updateCustomer.mutate(
        { id: customer.id, data },
        {
          onSuccess: () => {
            toast.success("Customer updated successfully");
            onSuccess();
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update customer");
          },
        },
      );
    } else {
      createCustomer.mutate(data, {
        onSuccess: () => {
          toast.success("Customer created successfully");
          onSuccess();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create customer");
        },
      });
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormInput
        name="name"
        label="Name"
        placeholder="Customer name"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          name="email"
          label="Email"
          type="email"
          placeholder="email@example.com"
          description="Optional contact email"
        />
        <FormInput
          name="phone"
          label="Phone"
          placeholder="+62 xxx xxxx xxxx"
          description="Optional contact phone"
        />
      </div>
      <AddressSelector form={form} />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Customer"
              : "Create Customer"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
