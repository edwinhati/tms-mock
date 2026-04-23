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
import { Form, FormInput, FormSelect } from "@/components/ui/form-wrapper";
import { AddressSelector } from "@/components/ui/address-selector";
import {
  useCreateSchool,
  useDeleteSchool,
  useSchools,
} from "@/hooks/use-schools";
import { schoolSchema, type SchoolFormValues } from "@/lib/schemas";
import type { EducationLevel, School } from "@/types/tms";

const educationLevels: { value: EducationLevel; label: string }[] = [
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
  { value: "SMK", label: "SMK" },
];

export default function SchoolsPage() {
  const { data: schools, isLoading, isError, refetch } = useSchools();

  const deleteSchool = useDeleteSchool();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name");
        const displayName =
          typeof name === "object" && name !== null
            ? (name as any).name || JSON.stringify(name)
            : String(name || "-");
        return <div className="font-medium">{displayName}</div>;
      },
    },
    {
      accessorKey: "educationLevel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Level" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.getValue("educationLevel")}
        </div>
      ),
    },
    {
      accessorKey: "contactPerson",
      header: "Contact",
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
        const school = row.original;
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
                onClick={() => setDeleteId(school.id)}
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
      deleteSchool.mutate(deleteId, {
        onSuccess: () => {
          toast.success("School deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete school");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schools</h1>
          <p className="text-sm text-muted-foreground">
            Manage your school records and education partners.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
              <DialogDescription>
                Create a new school record. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <SchoolForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={schools || []}
        searchKey="name"
        searchPlaceholder="Search schools..."
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
              school and remove their data from our servers.
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

function SchoolForm({ onSuccess }: { onSuccess: () => void }) {
  const createSchool = useCreateSchool();

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      educationLevel: "SD",
      contactPerson: "",
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
      latitude: "",
      longitude: "",
    },
  });

  const onSubmit = (data: SchoolFormValues) => {
    createSchool.mutate(data, {
      onSuccess: () => {
        toast.success("School created successfully");
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create school");
      },
    });
  };

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FormInput
        name="name"
        label="School Name"
        placeholder="School name"
        required
      />
      <FormSelect
        name="educationLevel"
        label="Education Level"
        placeholder="Select level"
        options={educationLevels}
        required
      />
      <FormInput
        name="contactPerson"
        label="Contact Person"
        placeholder="Contact person name"
      />
      <FormInput name="phone" label="Phone" placeholder="+62 xxx xxxx xxxx" />
      <AddressSelector form={form} />

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={createSchool.isPending}>
          {createSchool.isPending ? "Creating..." : "Create School"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
