"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
  useCreateDriver,
  useDeleteDriver,
  useDrivers,
  useUpdateDriver,
} from "@/hooks/use-drivers";

const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(13, "Phone must be at most 13 digits")
    .regex(/^08\d+$/, "Phone must start with 08"),
  licenseNumber: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface DriverWithUser {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  licenseNumber: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export default function DriversPage() {
  const { data: drivers, isLoading } = useDrivers();
  const deleteDriver = useDeleteDriver();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<DriverWithUser | null>(
    null,
  );

  const columns: ColumnDef<DriverWithUser>[] = [
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
      header: "Email",
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
      accessorKey: "licenseNumber",
      header: "License",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("licenseNumber") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
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
        const driver = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  setEditingDriver(driver);
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
                onClick={() => setDeleteId(driver.id)}
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
      deleteDriver.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Driver deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete driver");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground">
            Manage drivers and their login credentials.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>
                Create a new driver account with email and password.
              </DialogDescription>
            </DialogHeader>
            <DriverForm
              onSuccess={() => {
                setIsAddDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={drivers || []}
        searchKey="name"
        searchPlaceholder="Search drivers..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update the driver details below.
            </DialogDescription>
          </DialogHeader>
          {editingDriver && (
            <DriverForm
              driver={editingDriver}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingDriver(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              driver and their login credentials.
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

interface DriverFormProps {
  driver?: DriverWithUser;
  onSuccess: () => void;
}

function DriverForm({ driver, onSuccess }: DriverFormProps) {
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const isEditing = !!driver;

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver?.name || "",
      email: driver?.email || "",
      password: "",
      licenseNumber: driver?.licenseNumber || "",
      phone: driver?.phone || "",
    },
  });

  const onSubmit = (data: DriverFormValues) => {
    if (isEditing && driver) {
      updateDriver.mutate(
        { id: driver.id, data },
        {
          onSuccess: () => {
            toast.success("Driver updated successfully");
            onSuccess();
            form.reset();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update driver");
          },
        },
      );
    } else {
      if (!data.password) {
        toast.error("Password is required for new drivers");
        return;
      }
      createDriver.mutate(data as any, {
        onSuccess: () => {
          toast.success("Driver created successfully");
          onSuccess();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create driver");
        },
      });
    }
  };

  const isPending = createDriver.isPending || updateDriver.isPending;

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormInput name="name" label="Name" placeholder="Driver name" required />
      <FormInput
        name="email"
        label="Email"
        type="email"
        placeholder="email@example.com"
        required
        disabled={isEditing}
      />
      {!isEditing && (
        <FormInput
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
        />
      )}
      <FormInput
        name="phone"
        label="Phone"
        placeholder="081234567890"
        required
        disabled={isEditing}
      />
      <FormInput
        name="licenseNumber"
        label="License Number"
        placeholder="SIM B1/B2 number"
      />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Driver"
              : "Create Driver"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
